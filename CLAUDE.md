# 家庭点餐 App — 项目说明

这是一个自家用的点餐 Web 应用。家人在手机上浏览菜品、选菜、提交"今日菜单"；
管理员（房主本人）在后台增删改菜品、上传菜品照片。模拟饭店点餐逻辑，
特色是每道菜可以查看所需食材和做法步骤。

## 技术栈（请严格遵守，不要替换）

- 框架：Next.js（App Router）+ TypeScript
- 样式：Tailwind CSS
- 动画：Framer Motion
- 后端：Supabase（数据库 + Storage + Auth）
- Supabase 客户端：必须用 `@supabase/ssr`，不要用旧的 `@supabase/supabase-js` 单独直连
- 图标：lucide-react
- 部署目标：Vercel
- 包管理器：npm

## 设计风格

参考苹果最新设计语言。要点：
- 大圆角卡片（约 16-20px）、充足留白、浅灰背景上浮白色卡片
- 顶部导航栏和底部栏用毛玻璃效果（backdrop-filter: blur）
- 菜品图片是视觉主角
- 字重克制，只用常规和中粗两种
- 交互要有"Q弹"感：用 Framer Motion 的 spring 物理曲线，
  卡片按压时轻微缩小回弹，按钮点击有弹性反馈
- 全站中文界面
- 移动端优先，主要在手机浏览器使用

## 应用结构

### 顾客端（无需登录，匿名访问）
- `/` 菜品列表页：顶部分类横滑，下面菜品卡片列表
- `/dish/[id]` 菜品详情页：大图 + 简介 + 耗时/难度 + 食材清单 + 做法步骤
- `/menu` 当前菜单确认页：调整数量、写备注、提交
- `/history` 已提交清单页：按提交日期展示历史，可删除、可"重新下单"

### 管理端（需登录）
- `/admin/login` 登录页
- `/admin` 菜品管理列表：每条带编辑/删除，顶部"新增菜品"
- `/admin/dish/new` 和 `/admin/dish/[id]` 菜品编辑表单：
  可填菜名、类别、简介、照片、耗时、难度、食材清单（动态增删）、
  做法步骤（动态增删）、是否上架

## 数据库结构（Supabase / PostgreSQL）

5 张表：
- `categories` 类别：id, name, sort_order
- `ingredients` 食材：id, name
- `dishes` 菜品：id, name, category_id, description, image_url,
  cooking_time, difficulty, steps(jsonb 字符串数组), is_available, sort_order
- `dish_ingredients` 菜品-食材关联（多对多）：dish_id, ingredient_id, amount
- `menu_lists` 已提交清单：id, items(jsonb，结构 [{dish_id, qty}]), note,
  status, submitted_at

还有一个视图 `dish_details`：把菜品 + 类别名 + 聚合好的食材清单一次查出，
顾客详情页直接查这个视图。

建表 SQL 在项目根目录的 `supabase_setup.sql` 文件里。

## 关键约定（重要）

- 权限模型：本项目里"已登录用户 = 管理员"。顾客端家人全程匿名访问。
  所以管理端页面只需检查"是否已登录"，不需要复杂的角色系统。
- RLS 已在 SQL 里配好：菜品等表所有人可读、登录可写；menu_lists 完全放开。
- 顾客端只应看到 is_available = true 的菜（RLS 已保证，前端也要正确处理）。
- 图片存 Supabase Storage 的 `dish-images` 公开桶，上传后把公开 URL
  存进 dishes.image_url。上传前在前端压缩图片（手机照片往往好几 MB）。
- 环境变量放 `.env.local`，且必须把 `.env.local` 写进 `.gitignore`。
  绝不要把密钥提交到 git。
- 删除历史清单时，前端要有二次确认。

## 工作方式

- 按 `INSTRUCTIONS.md` 里的阶段顺序执行，一个阶段完成后停下来，
  告诉我如何验证，等我确认后再进入下一阶段。
- 每个阶段结束后简要说明你做了什么、改了哪些文件。
- 遇到需要我提供信息的地方（如 Supabase 密钥），停下来明确问我，不要瞎猜。
- 不确定的设计决定，先问再做。
