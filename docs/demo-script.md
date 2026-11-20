# 技能中枢 · 演示视频脚本

目标：90 秒内把五个痛点各用一个动作演出来，不念功能清单。

录制工具：**Recordly**（`/Applications/Recordly.app`）。
⚠️ 从命令行/agent 里启动 Electron 应用前必须 `env -u ELECTRON_RUN_AS_NODE`，
否则它会以 Node 模式静默退出（本机 `ELECTRON_RUN_AS_NODE=1` 会传给子进程）。
Recordly 首次录制需要在「系统设置 → 隐私与安全性 → 屏幕录制」里给它打勾。

| # | 分镜 | 画面里的动作 | 对应痛点 |
|---|---|---|---|
| 1 | 0–8s | 输入框左下的分段控件 `技能 ▴ │ ⤓`，点左段，面板弹出 | 入口 |
| 2 | 8–25s | 面板「技能」页：搜 `video`，点一行 → 提示词直接进输入框；再点「+ 提示词」展示模板 | 2.2 使用中快速给提示词 |
| 3 | 25–45s | 「专家团」页：选「短视频团」，展示角色 → 流程 → 「插入完整任务书」，输入框出现整本 SOP | 2.1 分角色分流程 / 2.4 自由分配专家团 |
| 4 | 45–60s | 设置 → 技能中枢 → 分类整理：11 列看板，展开「图像与设计」，用下拉把某个 skill 换类目 | 1 分类 |
| 5 | 60–75s | 「安装」页签：填 `owner/repo` → 预览（显示 N 个 skill、同名会替换）→ 装 | 2.3 skill 集中管理 |
| 6 | 75–90s | 「Key 管理」：选 skill → 自动识别变量名 → 生成入匙命令 → 在终端里一行执行，key 只在钥匙串 | 2.5 key 管理（防外泄） |

收尾字幕：仓库地址 + `market/index.json` 索引 URL。

## 录制操作（Recordly 授权后）

```bash
env -u ELECTRON_RUN_AS_NODE open -a /Applications/Recordly.app
# HUD 里选 Screen → 点「录制」→ 按上面的分镜走 → 点停止 → 编辑器里导出 mp4
```

导出到 `~/ai-project-hub/dsh-skill-hub/docs/demo.mp4`，README 顶部用
`![技能中枢演示](docs/demo.mp4)`（GitHub 会在文件页内嵌播放器）。
