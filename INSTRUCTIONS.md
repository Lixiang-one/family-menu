# 执行指令 — 分阶段搭建家庭点餐 App

请按阶段顺序执行。**每完成一个阶段就停下来**，告诉我做了什么、如何验证，
等我回复"继续"后再进入下一阶段。先读项目根目录的 `CLAUDE.md` 了解整体背景。

---

## 阶段 0 — 准备工作（需要我配合）

在开始写代码前，先和我确认以下事项，缺哪个就停下来问我：

1. 我是否已经有 Supabase 项目？
   - 如果没有：引导我去 supabase.com 注册、新建一个项目，
     并告诉我去哪里复制 Project URL 和 anon key。
   - 如果有：让我提供 Project URL 和 anon key。
2. 我的数据库表是否已建好？
   - 如果没建：让我打开 Supabase 控制台的 SQL Editor，
     把项目里的 `supabase_setup.sql` 整个粘贴执行。执行后让我确认
     Table Editor 里出现了 5 张表、Storage 里有 dish-images 桶。
3. 提醒我去 Supabase 的 Authentication → Providers 关闭公开注册，
   只保留我手动创建的一个管理员账号（在 Authentication → Users 里手动添加）。

确认完成后再进入阶段 1。

---

## 阶段 1 — 初始化项目

1. 用 `create-next-app` 初始化 Next.js 项目（TypeScript、Tailwind、
   App Router、ESLint、`src/` 目录、`@/*` 路径别名）。
2. 安装依赖：`@supabase/ssr`、`@supabase/supabase-js`、
   `framer-motion`、`lucide-react`。
3. 创建 `.env.local`，写入 `NEXT_PUBLIC_SUPABASE_URL` 和
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` 两个变量（值用我提供的，
   如果我还没给就放占位符并提醒我填）。
4. 确认 `.env.local` 已在 `.gitignore` 里。
5. 创建 Supabase 客户端工具文件：一个浏览器端 client、
   一个服务端 client（用 `@supabase/ssr` 的标准写法）。
6. 配置 Tailwind 的基础主题（圆角、颜色），设定全局字体和移动端
   视口 meta。

**验证**：`npm run dev` 能启动，打开 localhost:3000 显示默认页不报错。

---

## 阶段 2 — 数据层与类型

1. 定义 TypeScript 类型：Category、Ingredient、Dish、DishDetail、
   DishIngredient、MenuList，字段对照 CLAUDE.md 里的数据库结构。
2. 写一组数据访问函数（放在 `src/lib/` 下），封装：
   - 读取所有类别
   - 读取菜品列表（顾客端只取已上架的）
   - 读取单个菜品详情（查 `dish_details` 视图）
   - 提交菜单清单（写入 menu_lists）
   - 读取/删除历史清单
   - 管理端：增、删、改菜品；管理食材和 dish_ingredients 关联
3. 暂时不接 UI，先确保这些函数类型正确、能编译通过。

**验证**：项目能编译，无 TypeScript 报错。

---

## 阶段 3 — 顾客端页面

按 CLAUDE.md 的设计风格实现：

1. `/` 菜品列表页：分类横滑筛选 + 菜品卡片列表，从 Supabase 读真实数据。
2. `/dish/[id]` 详情页：大图、简介、耗时/难度、食材清单、做法步骤。
3. 当前菜单的状态管理：用 React Context 存"已选菜品"，
   底部做一个毛玻璃悬浮栏显示已选数量。
4. `/menu` 确认页：列出已选菜、可增减数量、填备注、提交按钮。
   提交成功后跳转到 `/history`。
5. `/history` 历史清单页：按 submitted_at 倒序展示，每条显示提交日期、
   菜品、备注、状态。每条有"删除"（带二次确认）和"重新下单"
   （把该清单的菜重新载入当前菜单状态并跳到 /menu）。
6. 加上 Framer Motion 的 spring 动画：卡片按压回弹、按钮弹性、
   悬浮栏出现动效、页面切换过渡。

**验证**：在手机尺寸下完整走通——浏览菜品、看详情、选菜、提交、
在历史页看到记录、能删除和重新下单。

---

## 阶段 4 — 管理端

1. `/admin/login` 登录页：用 Supabase Auth 的邮箱密码登录。
2. 做一个保护机制：未登录访问任何 `/admin` 路径都跳转到登录页
   （用 middleware 或在布局里检查 session）。
3. `/admin` 菜品管理列表：展示所有菜（含草稿），每条带编辑、删除按钮，
   顶部"新增菜品"。
4. `/admin/dish/new` 和 `/admin/dish/[id]` 菜品编辑表单，
   完整支持：菜名、类别（下拉，选项来自 categories 表）、简介、
   耗时、难度、食材清单（动态增删行，每行食材名+用量）、
   做法步骤（动态增删行）、是否上架开关。
5. 照片上传：选图后前端压缩，上传到 Storage 的 `dish-images` 桶，
   拿到公开 URL 存进 dishes.image_url，表单里显示预览。
6. 保存菜品时，正确处理 dish_ingredients 关联表的同步
   （新增/删除/修改食材关联；食材表里没有的食材先创建）。

**验证**：能登录后台，新增一道带照片的菜，顾客端能看到它；
能编辑、能删除；草稿菜顾客端看不到。

---

## 阶段 5 — PWA 与部署

1. 添加 PWA 支持：`public/manifest.json`（应用名、主题色、
   display: standalone）、一组应用图标、Service Worker
   （用 `@ducanh2912/next-pwa` 这类库）。
2. 配置 iOS 的 meta 标签，让"添加到主屏幕"后体验接近原生。
3. 引导我把项目推到 GitHub，然后连接 Vercel 部署。
4. 提醒我在 Vercel 的项目设置里填入环境变量
   （和 `.env.local` 里一样的两个）。
5. 部署成功后，让我用手机打开线上网址测试"添加到主屏幕"。

**验证**：线上网址能正常访问，能装到手机主屏幕，独立打开像 App。

---

## 收尾

全部完成后，简要列出：项目结构、还能优化的点、日常如何更新菜品。
