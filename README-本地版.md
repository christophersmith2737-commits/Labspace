# LabSpace 本地离线版

项目位置：`C:\Users\13909\LabSpace`

依赖已经安装完成，网页图标和运行环境均保存在电脑上。断网时可以启动、浏览、编辑代码和使用本地数据库。

## 日常使用

1. 双击 `启动LabSpace本地版.bat`。
2. 浏览器会自动打开 `http://127.0.0.1:5173/`。
3. 保持命令窗口开启；关闭窗口或按 `Ctrl+C` 即可停止。
4. 用 Codex、VS Code 或其他编辑器修改此文件夹中的源码。

## 本地数据

- 本地数据库保存在 `.wrangler\state`。
- 本地数据与正式网站的数据相互独立，不会自动同步或互相覆盖。
- `.wrangler\state` 不会上传到 GitHub。
- 修改大量数据前，可以双击 `备份本地数据.bat`。

## 第一次连接 GitHub

1. 在 GitHub 新建一个空的私有仓库。
2. 不要勾选自动创建 README、License 或 `.gitignore`。
3. 双击 `连接GitHub仓库.bat`，粘贴仓库的 HTTPS 地址。
4. 双击 `提交并推送到GitHub.bat`。
5. 首次推送时，Git Credential Manager 可能会打开浏览器要求登录 GitHub。

## 后续推送

每次修改完成后，双击 `提交并推送到GitHub.bat`。脚本会先执行完整构建；只有构建成功才会提交并推送。

## 重要区别

GitHub 只保存源码，不会自动保存本地 D1 数据库，也不会自动更新当前 ChatGPT Sites 正式站。以后如果改用 Cloudflare Workers，需要另外创建 D1 数据库、应用迁移并配置自定义域名。
