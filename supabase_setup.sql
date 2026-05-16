-- ============================================================
--  家庭点餐 App — Supabase 数据库初始化脚本
--  在 Supabase 控制台 → SQL Editor 里整段粘贴执行即可
--  分 7 个部分：扩展 / 建表 / 索引 / 视图 / RLS / Storage / 示例数据
-- ============================================================


-- ============================================================
--  PART 1 — 扩展
-- ============================================================
-- pgcrypto 提供 gen_random_uuid()，用来生成主键
create extension if not exists "pgcrypto";


-- ============================================================
--  PART 2 — 建表
-- ============================================================

-- ----- 2.1 类别表 ----------------------------------------------
-- 管理员编辑菜品时，"类别"下拉选项就来自这张表
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,           -- 热菜 / 素菜 / 汤品 ...
  sort_order  int  not null default 0,        -- 控制顾客端分类的排列顺序
  created_at  timestamptz not null default now()
);

-- ----- 2.2 食材表 ----------------------------------------------
-- 食材独立成表，可被多道菜复用（番茄既属番茄炒蛋也属番茄汤）
create table if not exists public.ingredients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,           -- 鸡蛋 / 番茄 / 猪肋排 ...
  created_at  timestamptz not null default now()
);

-- ----- 2.3 菜品表（核心） --------------------------------------
create table if not exists public.dishes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category_id   uuid references public.categories(id) on delete set null,
  description   text,                          -- 简介，顾客详情页第一眼看到
  image_url     text,                          -- Storage 里图片的公开 URL
  cooking_time  int,                           -- 耗时（分钟）
  difficulty    text default '简单'
                  check (difficulty in ('简单','中等','较难')),
  steps         jsonb not null default '[]',   -- 做法步骤，字符串数组 ["第1步","第2步"]
  is_available  boolean not null default true, -- false = 草稿，顾客端看不到
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----- 2.4 菜品-食材关联表（多对多） ----------------------------
-- 你的"查看菜品所需食材"功能，以及"自动汇总买菜清单"都靠这张表
create table if not exists public.dish_ingredients (
  id             uuid primary key default gen_random_uuid(),
  dish_id        uuid not null references public.dishes(id) on delete cascade,
  ingredient_id  uuid not null references public.ingredients(id) on delete cascade,
  amount         text,                          -- 用量，自由文本："3 个" "适量"
  sort_order     int not null default 0,
  unique (dish_id, ingredient_id)
);

-- ----- 2.5 已提交菜单清单表 ------------------------------------
-- 顾客提交的"今日菜单"。items 直接用 jsonb 存，结构：
--   [{ "dish_id": "uuid", "qty": 2 }, ...]
create table if not exists public.menu_lists (
  id            uuid primary key default gen_random_uuid(),
  items         jsonb not null default '[]',
  note          text,
  status        text not null default 'submitted'
                  check (status in ('submitted','cooking','done')),
  submitted_at  timestamptz not null default now()
);


-- ============================================================
--  PART 3 — 索引（让常用查询更快）
-- ============================================================
create index if not exists idx_dishes_category   on public.dishes(category_id);
create index if not exists idx_dishes_available  on public.dishes(is_available);
create index if not exists idx_di_dish           on public.dish_ingredients(dish_id);
create index if not exists idx_di_ingredient     on public.dish_ingredients(ingredient_id);
create index if not exists idx_menu_submitted    on public.menu_lists(submitted_at desc);


-- ============================================================
--  PART 4 — 自动维护 updated_at
-- ============================================================
-- 菜品被修改时，自动刷新 updated_at 时间戳
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_dishes_updated_at on public.dishes;
create trigger trg_dishes_updated_at
  before update on public.dishes
  for each row execute function public.touch_updated_at();


-- ============================================================
--  PART 5 — 视图（前端可直接查询，省去拼装逻辑）
-- ============================================================

-- ----- 5.1 菜品详情视图 ----------------------------------------
-- 一次查出菜品 + 类别名 + 食材清单（已聚合成 json 数组）
-- 顾客详情页直接 select * from dish_details where id = '...'
create or replace view public.dish_details as
select
  d.id,
  d.name,
  d.description,
  d.image_url,
  d.cooking_time,
  d.difficulty,
  d.steps,
  d.is_available,
  d.sort_order,
  d.category_id,
  c.name as category_name,
  coalesce(
    (select jsonb_agg(
        jsonb_build_object('name', i.name, 'amount', di.amount)
        order by di.sort_order
     )
     from public.dish_ingredients di
     join public.ingredients i on i.id = di.ingredient_id
     where di.dish_id = d.id),
    '[]'::jsonb
  ) as ingredients
from public.dishes d
left join public.categories c on c.id = d.category_id;


-- ============================================================
--  PART 6 — 行级安全策略 RLS
--  规则：
--   · 菜品/类别/食材/关联表  → 所有人可读，仅登录的管理员可写
--   · menu_lists            → 所有人可读写可删（家人无需登录即可点餐）
--  这里"管理员"= 任何已登录用户。因为只有你一个人会登录后台，
--  顾客端家人完全匿名访问，所以 authenticated 就等于管理员。
-- ============================================================

-- 先全部开启 RLS
alter table public.categories       enable row level security;
alter table public.ingredients      enable row level security;
alter table public.dishes           enable row level security;
alter table public.dish_ingredients enable row level security;
alter table public.menu_lists       enable row level security;

-- ----- 6.1 categories ------------------------------------------
drop policy if exists "categories read"  on public.categories;
drop policy if exists "categories write" on public.categories;
create policy "categories read"
  on public.categories for select
  using (true);
create policy "categories write"
  on public.categories for all
  to authenticated
  using (true) with check (true);

-- ----- 6.2 ingredients -----------------------------------------
drop policy if exists "ingredients read"  on public.ingredients;
drop policy if exists "ingredients write" on public.ingredients;
create policy "ingredients read"
  on public.ingredients for select
  using (true);
create policy "ingredients write"
  on public.ingredients for all
  to authenticated
  using (true) with check (true);

-- ----- 6.3 dishes ----------------------------------------------
-- 顾客端只看得到已上架的菜（is_available = true）
-- 管理员（已登录）能看到全部，包括草稿
drop policy if exists "dishes read public" on public.dishes;
drop policy if exists "dishes read admin"  on public.dishes;
drop policy if exists "dishes write"       on public.dishes;
create policy "dishes read public"
  on public.dishes for select
  to anon
  using (is_available = true);
create policy "dishes read admin"
  on public.dishes for select
  to authenticated
  using (true);
create policy "dishes write"
  on public.dishes for all
  to authenticated
  using (true) with check (true);

-- ----- 6.4 dish_ingredients ------------------------------------
drop policy if exists "di read"  on public.dish_ingredients;
drop policy if exists "di write" on public.dish_ingredients;
create policy "di read"
  on public.dish_ingredients for select
  using (true);
create policy "di write"
  on public.dish_ingredients for all
  to authenticated
  using (true) with check (true);

-- ----- 6.5 menu_lists ------------------------------------------
-- 家人无需登录就要能提交、查看、删除，所以匿名也放开
drop policy if exists "menu read"   on public.menu_lists;
drop policy if exists "menu insert" on public.menu_lists;
drop policy if exists "menu update" on public.menu_lists;
drop policy if exists "menu delete" on public.menu_lists;
create policy "menu read"
  on public.menu_lists for select
  using (true);
create policy "menu insert"
  on public.menu_lists for insert
  with check (true);
create policy "menu update"
  on public.menu_lists for update
  using (true) with check (true);
create policy "menu delete"
  on public.menu_lists for delete
  using (true);


-- ============================================================
--  PART 7 — Storage 图片桶
--  桶名 dish-images，公开可读（顾客端要能加载图片）
--  仅登录的管理员可上传 / 替换 / 删除
-- ============================================================

-- 创建公开桶（已存在则忽略）
insert into storage.buckets (id, name, public)
values ('dish-images', 'dish-images', true)
on conflict (id) do nothing;

-- 任何人都能读图片
drop policy if exists "dish-images read" on storage.objects;
create policy "dish-images read"
  on storage.objects for select
  using (bucket_id = 'dish-images');

-- 仅登录用户能上传 / 修改 / 删除图片
drop policy if exists "dish-images write"  on storage.objects;
drop policy if exists "dish-images update" on storage.objects;
drop policy if exists "dish-images delete" on storage.objects;
create policy "dish-images write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'dish-images');
create policy "dish-images update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'dish-images');
create policy "dish-images delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'dish-images');


-- ============================================================
--  PART 8 — 示例数据（可选，方便你先把前端跑起来看效果）
--  正式上线前可以把这一段删掉，或在控制台手动清空这几张表
-- ============================================================

-- 类别
insert into public.categories (name, sort_order) values
  ('热菜', 1), ('素菜', 2), ('汤品', 3), ('主食', 4)
on conflict (name) do nothing;

-- 食材
insert into public.ingredients (name) values
  ('鸡蛋'), ('番茄'), ('小葱'), ('白糖'), ('盐'),
  ('猪肋排'), ('冰糖'), ('生抽'), ('老抽'), ('姜片'),
  ('青菜'), ('蒜末'), ('紫菜'), ('虾皮'), ('大米')
on conflict (name) do nothing;

-- 菜品（用 do 块，方便引用类别 id）
do $$
declare
  cat_hot  uuid := (select id from public.categories where name='热菜');
  cat_veg  uuid := (select id from public.categories where name='素菜');
  cat_soup uuid := (select id from public.categories where name='汤品');
  d_egg    uuid;
  d_rib    uuid;
begin
  -- 番茄炒蛋
  insert into public.dishes (name, category_id, description, cooking_time, difficulty, steps)
  values ('番茄炒蛋', cat_hot, '家常下饭菜，酸甜松软，几分钟就能上桌。', 10, '简单',
    '["番茄切块，鸡蛋打散加少许盐","热油先炒蛋至凝固盛出","下番茄炒出汁，加糖","倒回鸡蛋翻炒，撒葱花出锅"]')
  returning id into d_egg;

  insert into public.dish_ingredients (dish_id, ingredient_id, amount, sort_order)
  select d_egg, id, amt, ord from (values
    ('鸡蛋','3 个',1), ('番茄','2 个',2), ('小葱','1 根',3),
    ('白糖','1 勺',4), ('盐','适量',5)
  ) as v(nm, amt, ord)
  join public.ingredients i on i.name = v.nm;

  -- 红烧排骨
  insert into public.dishes (name, category_id, description, cooking_time, difficulty, steps)
  values ('红烧排骨', cat_hot, '软烂脱骨，酱色红亮，下饭一绝。', 45, '中等',
    '["排骨冷水下锅焯水","炒冰糖至焦糖色，下排骨上色","加生抽老抽姜片","加热水没过，小火炖40分钟收汁"]')
  returning id into d_rib;

  insert into public.dish_ingredients (dish_id, ingredient_id, amount, sort_order)
  select d_rib, id, amt, ord from (values
    ('猪肋排','500 克',1), ('冰糖','6 颗',2), ('生抽','2 勺',3),
    ('老抽','1 勺',4), ('姜片','3 片',5)
  ) as v(nm, amt, ord)
  join public.ingredients i on i.name = v.nm;
end $$;

-- ============================================================
--  完成。建议执行后到 Table Editor 确认 5 张表都已生成，
--  并到 Storage 确认 dish-images 桶存在且为 Public。
-- ============================================================
