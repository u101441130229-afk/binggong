# 部署与验收说明

本说明面向首次部署该系统的老师或管理员。所有命令都在项目根目录执行，Windows 与 macOS 通用。

## 一、准备 Supabase 数据库

1. 打开 Supabase 项目控制台，进入 **SQL Editor**。
2. 在本地用记事本或 VS Code 打开 `supabase/migrations/001_init.sql`。
3. 全选（Ctrl+A）并复制（Ctrl+C）。
4. 回到 SQL Editor，点击 **New query**，粘贴（Ctrl+V）。
5. 点击 **Run**，看到 Success 即表示数据表、索引、权限策略与角色函数已创建完成。
6. 该脚本可以重复执行：重复运行不会删除已有数据。

迁移脚本会创建三张表：

| 表                   | 内容                                        |
| -------------------- | ------------------------------------------- |
| `profiles`           | 账号资料、角色、班级、专业、是否启用        |
| `assessment_results` | 每次思政画像测评的八维得分与画像类型        |
| `activity_records`   | 案例学习、每日问题、AI 调用的行为类型与时间 |

所有表都启用了行级安全（RLS），学生只能读取自己的数据。

## 二、配置本地环境变量

复制 `.env.example` 为 `.env.local`，填写真实值：

| 变量                        | 说明                                                                     |
| --------------------------- | ------------------------------------------------------------------------ |
| `SUPABASE_URL`              | Supabase 项目 URL                                                        |
| `SUPABASE_ANON_KEY`         | 公开密钥（Publishable key 或 anon key）                                  |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端密钥（Secret key 或 service_role key），只在本地脚本与 Vercel 使用 |
| `VITE_SUPABASE_URL`         | 与 `SUPABASE_URL` 相同                                                   |
| `VITE_SUPABASE_ANON_KEY`    | 与 `SUPABASE_ANON_KEY` 相同                                              |
| `DEEPSEEK_API_KEY`          | DeepSeek 密钥                                                            |
| `DEEPSEEK_MODEL`            | 文本模型名称，默认 `deepseek-flash`                                      |
| `MOONSHOT_API_KEY`          | Kimi密钥                                                                 |
| `KIMI_VL_MODEL`             | 视觉模型名称，默认 `kimi-k2.5`                                           |

`.env.local` 已被 `.gitignore` 忽略，不会上传到 GitHub。不要把 `service_role` 或 AI 密钥写进前端代码、`VITE_` 变量或任何提交文件。

## 三、导入学生与创建教师账号

学生名册放在 `private/roster.csv`，表头需包含 `student_no,name,class_code,major`。

```bash
npm run import:roster
```

脚本逐行创建账号，学生登录名为学号，初始密码也是学号。已存在的账号会跳过，不会重置密码。执行结束后会输出新增、跳过、失败数量与失败明细。

创建教师或管理员：

```bash
npm run staff -- --role admin --login-id bgzh_admin --name 系统管理员
npm run staff -- --role teacher --login-id bgzh_teacher --name 教师账号
```

脚本会生成 20 位随机密码，只在终端显示一次，并追加写入 `private/账号密码.txt`。该文件与 `private/` 目录均不会进入 Git，请妥善保存。

如需重置已有账号密码：

```bash
npm run staff -- --role teacher --login-id bgzh_teacher --name 教师账号 --reset-password
```

## 四、配置 Vercel 环境变量

进入 Vercel 项目 **Settings → Environment Variables**，在第一个输入框批量粘贴 `private/vercel-env.txt` 的内容。该文件包含：

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
DEEPSEEK_MODEL
KIMI_VL_MODEL
```

粘贴后确认 **Production** 与 **Preview** 都已勾选，点击 **Save**。如果项目此前没有配置 AI 密钥，请另外添加：

```text
DEEPSEEK_API_KEY
MOONSHOT_API_KEY
```

修改环境变量后必须重新部署（**Deployments → 最新部署 → Redeploy**）才会生效。

## 五、预览验收

1. 打开 `feature/real-login` 分支对应的 Vercel 预览地址。
2. 使用 `private/账号密码.txt` 中的管理员账号登录。
3. 管理员默认进入学校看板；可切换到教师数据面板查看真实学生名单。
4. 使用一个学生账号登录（学号 + 学号），完成一次测评。
5. 返回教师端或学校端刷新，确认新增测评与统计已出现。
6. 在学生端完成一个案例学习、提交一次每日问题，确认教师端“最近学习记录”出现对应行为。
7. 在教师端或学校端点击“导出名单数据”，用 Excel 打开 CSV，确认中文与表头正常。
8. 点击“生成建议”或“生成分析”，确认 AI 返回内容；同一账号一分钟内超过 6 次会收到频率提示。
9. 在手机或窄窗口中打开，确认登录页、画像页与表格可以正常滚动。

## 六、合并到主分支

1. 在 GitHub 打开仓库，切换到 `feature/real-login` 分支。
2. 点击 **Compare & pull request**，确认 base 为 `main`、compare 为 `feature/real-login`。
3. 填写标题后点击 **Create pull request**。
4. 检查文件变更中没有 `.env.local`、`private/`、`report/名单数据.csv` 或构建产物。
5. 点击 **Merge pull request**，选择普通合并，不要强制推送或改写历史。
6. 合并后等待 Vercel 自动部署正式域名。

## 七、生成汇报材料

学生完成试用后，在本地执行：

```bash
npm run report
```

脚本会读取数据库真实数据，生成：

- `report/汇报.md`：试用范围、参与率、八维均值、画像类型分布、学习行为统计等。
- `report/名单数据.csv`：学生名单与测评结果，含个人信息，已加入 `.gitignore`，只保存在本地。

如果某项暂无数据，报告中显示“暂无”，不会编造数值。

## 八、常见问题

**登录提示“账号或密码错误”**  
确认输入的是学号或教师登录名，不是邮箱；确认账号已导入且 `is_active` 为 `true`。

**页面能打开但数据为空**  
确认 Vercel 已配置 `SUPABASE_URL`、`SUPABASE_ANON_KEY` 并完成 Redeploy；确认 SQL 迁移已执行。

**AI 提示登录状态失效**  
登录令牌已过期，退出后重新登录即可。

**AI 提示调用过于频繁**  
同一账号每分钟最多 6 次、每天最多 60 次，稍后再试。

## 九、将来迁移到国内服务器

数据访问集中在两个目录，迁移时只需要替换这两处，页面组件无需改动：

- `src/api/`：浏览器端的登录、数据查询与 AI 请求封装。
- `api/_lib/`：Vercel 函数端的令牌校验、限频、请求校验与数据库客户端。

同时需要替换 `supabase/migrations/` 中的建表脚本与 `.env.local` 中的数据库连接配置，并保留 `src/api/loginId.js` 的登录名映射规则。页面与业务组件只调用 `src/api/` 暴露的函数，不直接依赖 Supabase。

## Kimi 图片识别迁移（2026-11-03）

已有项目只需在 Vercel → Settings → Environment Variables 添加：

| 变量               | 值                                                     |
| ------------------ | ------------------------------------------------------ |
| `MOONSHOT_API_KEY` | Kimi 中国区开放平台创建的真实密钥（不要提交到 GitHub） |
| `KIMI_VL_MODEL`    | `kimi-k2.5`                                            |

选择 Production 和 Preview，保存后重新部署。模型未配置时默认使用 `kimi-k2.5`。接口使用 `https://api.moonshot.cn/v1/chat/completions`，需要中国区开放平台的密钥，不能使用 Kimi Code 会员密钥或海外区密钥。

新前端调用 `/api/kimi-vl`；旧 `/api/qwen-vl` 仅为已缓存页面提供兼容入口，同样调用 Kimi。服务端明确关闭思考模式，避免短回答的 token 预算被推理占用。模型、温度、思考模式均由服务端固定。

`DASHSCOPE_API_KEY` 和 `QWEN_VL_MODEL` 不再被读取，切换成功后可从部署配置删除。DeepSeek 的两个环境变量保持原值。无需重跑数据库初始化。数据库的 `ai_qwen` 只作为旧版表约束的兼容存储编码，Kimi 识别也记录到这一类别；页面以“图像识别调用”统一展示历史与新记录。历史部署设计文档是归档资料，不代表当前供应商。

验证顺序：先运行 `npm test`（离线接口回归），再运行 `npm run lint`、`npm run build`。`npm run smoke` 还需要 Supabase 配置，会创建并清理测试账号，AI 上游使用模拟响应。最后在 Preview 中用学生账号实际上传图片，确认返回描述、教师端统计增加；教师/管理员不能调用视觉接口。真实 Kimi 调用会产生费用，离线测试不证明密钥余额或线上连通性。

本次没有自动重生成已归档的 `copyright/源代码文档.docx`；如软著材料需反映新版代码，完成部署验收后运行 `npm run copyright` 重新导出。
