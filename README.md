# 兵工铸魂·智绘易学AI思政教学应用软件 V1.0

面向兵工院校思政教育场景的画像驱动学习系统，由学生端、教师端与学校端组成。系统把思政成长画像测评、兵工案例学习、每日问题、AI 学习助手与真实学情统计连成一条完整链路，所有账号、测评与学习行为数据均保存在 Supabase 数据库中。

## 技术架构

- 前端：React 19、Vite 8、原生 CSS 与 SVG 图表
- 登录与数据：Supabase Auth、PostgreSQL、行级安全（RLS）
- 服务端接口：Vercel Serverless Functions（`api/`）
- AI 文本：DeepSeek；AI 图像识别：通义千问 VL
- 部署：Vercel，前端与接口同域

浏览器只能拿到公开密钥；`service_role`、AI 服务密钥只存在于本地 `.env.local` 与 Vercel 环境变量。

## 角色与权限

| 角色   | 登录后可见                                                    |
| ------ | ------------------------------------------------------------- |
| 学生   | 本人画像、测评历史、案例学习、每日问题、AI 学习助手、图片识别 |
| 教师   | 所带学生名单、画像、学习行为、班级均值、教学建议、名单导出    |
| 管理员 | 学校数据看板 + 教师端功能，默认进入学校看板                   |

学生只能在数据库中读取自己的测评与行为记录；教师和管理员读取全部学生数据，但不能修改业务数据。AI 接口只允许已登录且状态正常的账号调用，图片识别仅限学生。

## 本地运行

```bash
npm install
npm run dev
```

构建与预览：

```bash
npm run build
npm run preview
```

## 环境变量

复制 `.env.example` 为 `.env.local`，填入真实值。`.env.local` 已被 Git 忽略。

| 变量                        | 用途                                     |
| --------------------------- | ---------------------------------------- |
| `SUPABASE_URL`              | Supabase 项目地址                        |
| `SUPABASE_ANON_KEY`         | 前端与服务端共用的公开密钥               |
| `SUPABASE_SERVICE_ROLE_KEY` | 仅本地脚本与服务端使用，禁止暴露给浏览器 |
| `VITE_SUPABASE_URL`         | 前端构建时注入的项目地址                 |
| `VITE_SUPABASE_ANON_KEY`    | 前端构建时注入的公开密钥                 |
| `DEEPSEEK_API_KEY`          | DeepSeek 接口密钥                        |
| `DEEPSEEK_MODEL`            | 服务端固定的文本模型                     |
| `DASHSCOPE_API_KEY`         | 通义千问接口密钥                         |
| `QWEN_VL_MODEL`             | 服务端固定的视觉模型                     |

## 数据库与脚本

首次使用按 [`docs/SETUP.md`](docs/SETUP.md) 执行数据库迁移，然后运行：

```bash
npm run import:roster                 # 导入 private/roster.csv 中的学生名单
npm run staff -- --role admin --login-id bgzh_admin --name 系统管理员
npm run staff -- --role teacher --login-id bgzh_teacher --name 教师账号
npm run smoke                         # 冒烟测试，结束后自动清理测试数据
npm run report                        # 从数据库生成汇报材料
npm run copyright                     # 生成软件著作权源代码文档
```

学生初始密码与学号相同。教师与管理员密码由脚本随机生成，只在终端显示并写入本地 `private/账号密码.txt`，不会进入 Git。

## 目录说明

```text
src/api/           唯一允许直接调用 Supabase 的前端模块
src/pages/         登录页
src/views/         学生端、教师端、学校端
src/components/    业务组件与图表
api/_lib/          服务端鉴权、限频、校验与 Supabase 管理客户端
supabase/migrations/
scripts/           名单导入、账号创建、冒烟测试、报告与著作权文档
docs/              部署与验收说明
copyright/         软件说明书与源代码文档
```

## 数据与安全

- 学生名单、`.env.local`、教师账号密码文件均在 `.gitignore` 中。
- 数据库启用 RLS；学生只能读写自己的合规数据，客户端不能修改角色或资料。
- AI 调用经服务端校验身份、角色、消息长度与图片大小，并按账号限频。
- 系统只记录行为类型与时间，不保存 AI 对话内容、作答文字或上传图片。
- AI 模型、温度与最大输出长度由服务端固定，前端无法覆盖。

## 版本

当前版本：V1.0  
软件全称：兵工铸魂·智绘易学AI思政教学应用软件
