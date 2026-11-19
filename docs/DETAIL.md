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

## 0.2.1 新增

- 仓库多副本去重：同一 skill 发到 20+ 个 agent 目录时只留一份（按本机布局优先），并给出合并数量。
- 分类 12 类：新增 `agent-workflow`（智能体与工作流）、`business`（商业与决策），`other` 清零；关键词支持复数。
- 技能库体检 `skill_hub_audit`：按本机约定检查主库软链（严重）/ DSH 端覆盖条目（注意）/ 端侧实体副本（注意）/ 名称不一致、无描述、容器、未分类（提示），只读。软链本身合法：DSH provider 会 stat 跟随符号链接。

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

## 0.2.0 新增

- **Key 流程倒过来**：先在「Key 管理」里选一个本机 skill，插件读它的 SKILL.md 与脚本，把里面出现的变量名挑出来（`$FOO_KEY`、`FOO_KEY=`、`process.env.FOO_KEY`、`"FOO_KEY":` 四种写法都认，shell 噪声 `$PATH`/`$HOME` 与不像凭据的名字会被过滤），你点一个 chip 就自动填好环境变量名、钥匙串服务名与备注。
- **平台自动识别**：设置页直接显示「macOS 钥匙串 / Windows 凭据管理器（DPAPI）/ Linux Secret Service」，不再让你选。
- **安装 skill**：新增「安装 skill」页签。贴 `owner/repo` 或 GitHub 地址（可带 `/tree/<branch>/<subdir>`），先预览仓库里有哪些 skill，勾选后装进 `~/.agents/skills`。
- 对应的 agent 工具与接口：`skill_hub_install_skill`、`POST /skill-hub/api/keys/detect`、`/skills/preview`、`/skills/install`。

## 0.2.2 新增

- 安装同名 skill 时**只能替换**：勾选「替换主库里的同名 skill」后，旧目录移到 `~/.agents/_trash/<日期>/skill-hub/<name>`（同一天重复替换自动加 `-2`），再装新版；不勾则跳过并说明。
- 预览时就会标出「主库已有」的候选，按钮随之变成「替换同名并安装」，替换是你看得见的一次决定，不是装完才知道。
- 仓库内同名副本的措辞由「合并」改为「择一」——内容不会被拼在一起。

## 0.2.3 新增

- 预览按钮滚动显示已耗时秒数，超过 15 秒补一句「大仓库或走了镜像/代理」——不再让按钮干杵着像卡死。
- 预览结果写「clone 用时 x.xs · 按你的 git 配置 / 直连 GitHub」，能一眼分清是网络慢还是插件慢。
- 克隆前用 `git ls-remote` 给两条路各计时 3 秒，取快的；一条失败自动换另一条；同一进程内记住上次结果，不重复探测。
- 每次预览前清掉 2 小时前的 `$TMPDIR/skill-hub-*` 残留。
- Key 页面补一句：要自动带上变量就写进 `~/.zshenv`（非交互 shell 不读 `~/.zshrc`），不想改文件就让 skill 现取。

## 0.2.4 新增

- 入匙命令分两条：默认可交互（`security add-generic-password … -U -w` 由 `security` 隐藏输入地向你要值，密钥不进 argv，也就不进 `~/.zsh_history`），另附一条带值的版本并写明它会留在 history 里。
- 说明插件不碰任何 shell 配置文件；要自动导出就写进 `~/.zshenv`（`.zshrc` 只对交互 shell 生效，agent 跑的非交互 shell 读不到）。
- **0.2.5 · 按 shell 出正确的命令**：新增 `lib/shell.js`，覆盖主流 shell（zsh / bash / posix sh / fish / PowerShell / cmd）。每种 shell 有自己的 `export` 语法与持久化文件——fish 用 `set -gx … (…)`、PowerShell 用 `$env:K = …`、cmd 只能 `for /f` 现读或用 `setx`；`~/.zshenv`、`~/.bashrc`、`~/.profile`、`~/.config/fish/config.fish`、`$PROFILE` 各自对应。shell 由 `$SHELL` 自动识别，界面上可切换；平台与 shell 不匹配时退回 POSIX，不生成跑不通的命令。

## 0.2.6 新增

- **全局快捷键**：注册 `skill-hub.open` 命令，默认 `Mod+Shift+K`（macOS `⇧⌘K`），只绑桌面三个平台——`web:*` 上 `Mod+Alt+字母` 已被会话搜索等占用，交叉 profile 冲突会让整条注册失败。
- 触发后直接打开设置并选中「技能中枢」：通过 `sidebar.settings` 槽发布的根 store 调 `openSection('skill-hub')`，不导入别的插件的模块。
- 在输入框里也能触发（`regions: ['page','editable','terminal']`），但别的弹窗打开时不抢键（`modals: ['settings']`）。
- 首选键位被占时依次尝试 `⇧⌘J`、`⇧⌘H`、`⇧⌘U`…，全被占才注册「无默认键位」；面板里随时可改。
- 为什么不用 `⌥`：macOS 的 `⌥+字母` 是死键，快捷键服务明确让死键通过，合成按键与真人按键都不触发。
- 打开设置用的是 `sidebar.settings` 槽条目上的**根 store**（`entry.store` → `create().actions.openSection('skill-hub')`）；注意 store 挂在条目本身，不在 `entry.options` 上——踩过这个坑，表现是「快捷键和按钮都毫无反应」。
- 额外挂了一个 DOM `keydown` 监听（同一组合键）覆盖 Web 端；两条路径都只做一件事——打开设置并选中技能中枢，重复触发无副作用。
- 输入框左侧工具行（`conversation.input.left`）加了 `技能` 按钮，作为不用记键位的入口。

## 0.3.2

- 输入口「专家团」页签重做：选中团后一次性摊开 目标 / 分工（角色 · skill 数 · 交付物）/ 流程（序号 · 阶段 · 负责人 → 产出），主按钮 `插入完整任务书` 一次插入整本（全部角色 + skill 加载顺序 + 流程 + 三条自检 + 铁律），每角色另有次要入口「只插入该角色」。
- `buildTeamPrompt(team)`：角色职责末尾的标点先剥掉再拼接（避免「。；」），无职责的角色写「按角色名执行」。

## 0.3.1

- 输入口弹层加宽到 560px；「技能」按钮改成描边胶囊（4 宫格图标 + 技能 + ▾），hover/按下态走主题 token。
- 提示词生成：`buildSkillPrompt` / `buildRolePrompt`；`firstSentence` 重写，域名（`inference.sh`）与版本号（`GPT Image 2.5`）不再被拦腰截断。
- 专家团：顶部「分工与流程」汇总表（角色表 + 流程表）+ `自动整理` / `导出为 skill` / `简易｜详细`；详细编辑区在简易模式下折叠。
- 宿主：`autoCompose`（幂等补齐）、`renderTeamSop`（分工/流程/复盘/铁律/与内置能力配合）、`renderTeamSkill`（front-matter + SOP）、`autoFillTeam`、`exportTeamSkill`（写 `~/.agents/skills/team-<id>`，同名默认拒绝，`replace` 时旧版进 `_trash`）；新端点 `team/autofill`、`team/export`；新工具 `skill_hub_team_export`。

## 0.3.0 · 界面重做

三个页签按「Operate 模式」重做：

- 技能总览：体检条收成一行；12 类 chip 带计数；列表在宽面板自动双列。
- 分类整理：看板式多列（每类一列、列头计数、独立滚动），卡片内直接改分类。
- 专家团：角色卡 + 竖排流程节点 + 铁律行内编辑 + 吸顶保存条；流程节点可上下移动、增删、挂角色。
- 输入口「技能」菜单：搜 skill 直接插入 `/name`，`＋提示词` 连描述一起插入；专家团页签按角色插入任务书；底部直达设置页。

设计约束：8pt 间距、≤4 档字号、单一强调色、统一缓动 `cubic-bezier(.16,1,.3,1)`、全部走 `--dsw-alias-*` token。

## 0.3.3 — 专家团面板改成「从上到下」的单列结构

原来是一栏放团列表、一栏放表单，角色和流程还藏在「详细」模式里。用起来的顺序是反的：还没想清楚这个团是谁、要交付什么，就被丢进角色编辑。

现在从上到下就是思考顺序：

1. **顶部横排选团**（＋新建）——分类在最上面，一眼看清有哪几个团
2. **基本信息**——图标 / 名称 / 这个团要交付什么，保存条就在同一张卡里
3. **分工与流程总览**——两张只读表，先看全局，再往下改
4. **角色**——每张卡可改名、改交付物、改职责，`＋ 绑定 skill` 从本机 skill 里搜并挂上，`×` 解绑；不再有「固定 skill」这回事
5. **流程**——竖排步骤：序号、做什么、产出、负责人胶囊、↑↓、移除、＋阶段
6. **铁律**——逐条约束

顺带把设计底线落到 CSS：焦点环（`:focus-visible`）、`prefers-reduced-motion` 下关闭入场动画、8pt 间距、单一强调色、悬浮才出现的次要操作。

## 0.3.4 — 四个顺手改动

1. **baoyu-skills 专属专家团**：新增 `📰 长文与公众号团`、`🧠 图解与知识漫画团`、`📡 一稿多平台分发团`，把 [JimLiu/baoyu-skills](https://github.com/JimLiu/baoyu-skills) 那 21 个 skill 串成三条能跑的生产线（选题素材 → 写作 → 配图 → 发布 / 拆概念 → 出图 → 成演示 / 母稿 → 改写 → 分发）。
2. **分类整理可收缩**：11 个分类默认全部收起，只显示「类别 + 条数 + ▸」；点开某一类才展开成卡片网格（占满整行，内部再分列），一屏就能看完全部分类分布。
3. **入匙命令一键跑**：结果卡顶部多一个 `在终端里执行（推荐）`——插件用 osascript 打开 Terminal 并把命令填好，你只需按回车；有密钥时可选择 `带密钥执行`（会进 shell history，默认不选）。命令永远由服务端从校验过的字段重新生成，浏览器不能塞任意 shell 进来。
4. **输入口弹层扩成三页签**：`技能`（全部 341 个，滚到底随便挑）/ `专家团`（一次插入整本任务书）/ `安装`（owner/repo → 预览 → 勾选 → 装，严格走技能中枢规则：真实目录、同名替换进 `_trash`）。按钮旁边新增一个 **`装`** 小按钮，直接落到安装页签。
