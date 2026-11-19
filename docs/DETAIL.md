# 技能中枢 · Skill Hub

一个 DeepSeek Harness 插件，把「本机到底有哪些 skill / 它们该怎么归类 / 这一单活该由哪几个 skill 组队干 / 第三方 key 放哪」这四件分散的事收进同一个设置页。

## 它解决什么

| 痛点 | 现状 | 插件里的做法 |
|---|---|---|
| 看不见 | 本机攒了几百个 skill，目录散在 `~/.agents/skills`、`~/.dsh/skills`、`~/.claude/skills`，没有一个地方能一眼看全 | 「技能总览」一次扫描所有根目录，按 rank 去重，同名遮蔽和容器目录单独标出 |
| 分不清 | skill 名字五花八门（`baoyu-*`、`lark-*`、`xyq-*`、`cheat-*`…），想找「能剪视频的那个」只能靠翻目录 | 10 类自动归类（名前缀规则 + 描述关键词打分），支持手动改类，手动结果永远优先 |
| 组不起来 | 做一条带货视频要选题 → 口播 → 分镜 → 成片 → 复盘，每次都要重新想「该叫哪些 skill」 | 「专家团」把角色、阶段、绑定的 skill、交付物、铁律写成一个 SOP，agent 一键取用 |
| key 乱放 | API key 直接 `echo 'export XXX=...' >> ~/.zshrc`，落进 shell 历史、`.zshrc`、dotfile 备份、聊天记录 | 只登记元数据；真实密钥留在浏览器输入框，命令由用户自己在终端执行 |

## 功能

### 1. 技能总览
- 扫描 `~/.dsh/skills`（rank 400）、`~/.agents/skills`（rank 500）、`~/.claude/skills`（rank 600）
- 按 rank 首见优先去重，同名的低 rank 版本被标记为「遮蔽」
- 无 `SKILL.md` 但含子 skill 的目录识别为「容器」，不重复计数
- 支持关键词搜索 + 分类筛选

### 2. 分类整理
自动分类走三层：名字里的平台/领域前缀 → 平台词提示（小红书 / 抖音 / 飞书 / 公众号 / 高德…）→ 描述关键词打分。

10 个类别：
`content-video` 内容与视频 · `writing` 写作与文案 · `image-design` 图像与设计 · `dev` 开发与工程 · `collab` 飞书与协作 · `research` 检索与知识 · `office-docs` 文档办公 · `map-travel` 地图与出行 · `commerce-ops` 电商与运营 · `other` 其他。

手动改类写入 `config.json` 的 `overrides`，支持「恢复自动」。

### 3. 专家团
内置四个团，可直接用，也可复制后改：

| 团 | 干什么 |
|---|---|
| `daohuo-video` 带货视频团 | 选题 → 脚本 → 素材 → 成片 → 复盘 |
| `kepu-video` 科普视频团 | 选题 → 事实核查 → 稿子 → 成片 |
| `app-builder` 应用开发团 | 说清楚 → 定方案 → 拆任务 → 实现 → 提交 |
| `xhs-ops` 小红书运营团 | 定位 → 选题 → 图文/视频 → 发布复盘 |

每个团包含：`goal`、`roles[{title, duty, skills, deliverable}]`、`stages[{title, deliverable, roleIds}]`、`guardrails`。
绑定的 skill 若本机没有，界面和 agent 两侧都会标 ⚠️。

### 4. Key 管理
- 只存元数据：环境变量名、钥匙串服务名、账号、平台、备注
- 真实密钥只出现在浏览器输入框 → 替换 `__SECRET__` 占位符 → 生成命令 → 用户自己执行
- 三块命令：存入钥匙串、验证（不打印密钥）、需要时取回环境变量
- 落点：macOS `security add-generic-password`；Windows DPAPI（`ConvertFrom-SecureString` 写用户目录）；Linux `secret-tool`

## 安装

```bash
git clone https://github.com/TongjieYang/dsh-skill-hub.git ~/ai-project-hub/dsh-skill-hub
```

在 DeepSeek Harness 里：

```
plugin_manager({ action: "install_bundle", target: "~/ai-project-hub/dsh-skill-hub" })
```

或打开 侧边栏 → Plugins → 从本地目录安装。装完在 设置 → 技能中枢 里就能看到。

## Agent 侧工具

| 工具 | 用途 |
|---|---|
| `skill_hub_scan` | 列本机 skill，可按关键词/类别过滤 |
| `skill_hub_team` | 取某个专家团的完整 SOP（可只看某一阶段） |
| `skill_hub_key_script` | 生成入匙命令模板（只含 `__SECRET__`，拿不到真实密钥） |

## 数据落点

`~/.agents/skill-hub/`（可用 `DSH_SKILL_HUB_DIR` 覆盖）：

```
config.json     # overrides / 自定义扫描根 / key 元数据
teams/*.json    # 自建的专家团
```

`keys.json` 里没有 secret，只有登记信息。

## 安全边界

- 密钥永不离开浏览器：不上传、不落盘、不进日志、不进会话
- agent 工具拿到的永远是带 `__SECRET__` 的模板
- 入匙命令由用户自己执行，agent 不代跑
- 插件不写 `~/.zshrc`、不改任何 shell 启动文件

## 开发

```bash
node --test "tests/*.test.mjs"
```

零依赖，纯 ESM，无构建步骤。

## License

MIT
