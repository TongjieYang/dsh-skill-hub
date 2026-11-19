# 技能中枢 · Skill Hub

> 给 DeepSeek Harness 装一个「技能中枢」：一眼看全本机 skill、自动归纳分类、把常用 skill 编成专家团、第三方 key 收进系统钥匙串（入匙命令给你自己跑）。

<p align="center">
  <img src="icon.svg" width="88" alt="Skill Hub">
</p>

装完在 **设置 → 技能中枢** 里就有五个页签：技能总览（含技能库体检）/ 分类整理 / 专家团 / Key 管理 / 安装 skill。

---

## 它要解决的痛点

### 痛点 1：看不见 —— 我本机到底装了多少 skill？

skill 目录是分裂的：`~/.dsh/skills`、`~/.agents/skills`、`~/.claude/skills`、各家工具自己的目录。攒到几百个以后：

- 想知道「有没有能做带货视频的 skill」，得 `ls` 三遍再一个个点开 `SKILL.md`
- 同一个名字在两处各存一份，谁生效说不清
- 有些目录本身就是「容器」，里面套着十几个 skill，一数就重复

**这个插件**：一次扫描所有根目录，按 rank 首见优先去重，同名遮蔽（谁盖住了谁）和容器目录单独标出来。

### 痛点 2：分不清 —— 名字毫无规律

`baoyu-*`、`lark-*`、`xyq-*`、`cheat-*`、`dbs-*`、`office-*`……前缀只说明作者，不说明用途。想按「我要干的事」找 skill，只能靠记忆。

**这个插件**：12 类自动归类，三层判定 —— 名字前缀规则 → 平台词提示（小红书/抖音/飞书/高德…）→ 描述关键词加权打分（名字命中权重 4、描述命中权重 1，ASCII 关键词按整词匹配，避免 `docker` 被 `doc` 误伤）。手改的分类写进 `config.json`，永远压过自动结果。

```
🎬 内容与视频   ✍️ 写作与文案   🎨 图像与设计   🛠 开发与工程   🧩 飞书与协作
🔍 检索与知识   📄 文档办公     🗺 地图与出行   📈 电商与运营   📦 其他
```

### 痛点 3：组不起来 —— 每次都在重新想「该叫哪几个 skill」

做一条带货视频的链路是：选题 → 口播稿 → 分镜 → 素材/成片 → 复盘。每一步该加载哪个 skill、交给哪个「角色」、交付物是什么、哪几条红线不能碰 —— 这些知识每次会话都要重新组织一遍，还经常漏步骤。

**这个插件**：把这类链路固化成**专家团**（团队 = 目标 + 角色 + 阶段 + 铁律 + 每角色绑定的 skill）。内置四个：

| 专家团 | 链路 |
|---|---|
| `daohuo-video` 带货视频团 | 选题 → 脚本 → 素材 → 成片 → 复盘 |
| `kepu-video` 科普视频团 | 选题 → 事实核查 → 稿子 → 成片 |
| `app-builder` 应用开发团 | 说清楚 → 定方案 → 拆任务 → 实现 → 提交 |
| `xhs-ops` 小红书运营团 | 定位 → 选题 → 图文/视频 → 发布复盘 |

agent 侧一句话 `skill_hub_team({team:"daohuo-video"})` 就拿到完整 SOP，然后按阶段装载绑定的 skill。绑定的 skill 本机没有，界面和 agent 两侧都会标 ⚠️。

### 痛点 4：key 到处漏

配一个第三方 key，常见做法是：

```bash
echo 'export WEREAD_API_KEY=wrk-abcdefg' >> ~/.zshrc
```

后果：明文进了 `.zshrc`、进了 shell 历史、进了 dotfile 备份、进了云同步、还可能被贴进聊天记录交给 AI。而 agent 一旦能读环境变量，这个 key 就等于对每次会话公开。

**这个插件**：

- 只登记**元数据**（环境变量名 / 钥匙串服务名 / 账号 / 平台 / 备注），不存密钥
- 真实密钥只出现在设置面板的密码框里，**不发给后端、不落盘、不进日志**
- **先选 skill，变量名自动认**：选中 `weread-skills`，它自己从 SKILL.md 里找出 `WEREAD_API_KEY`，你只填值；一个 skill 有多个变量就列成 chip 让你点
- 平台自动识别（macOS 钥匙串 / Windows DPAPI / Linux Secret Service），不用手选
- 生成三块命令给你：存入系统钥匙串 / 验证（不打印密钥）/ 需要时取回环境变量
- **命令由你自己在终端执行**，agent 不代跑、也不索取密钥

落点：

| 平台 | 存储 |
|---|---|
| macOS | `security add-generic-password -s 'skill-hub:<service>' -a '<account>' -w '<key>' -U` |
| Windows | DPAPI：`ConvertTo-SecureString` → `ConvertFrom-SecureString` → `%USERPROFILE%\.config\skill-hub\<service>.txt` |
| Linux | `secret-tool store --label=… service … account …` |

---

## 功能一览

| 页签 | 做什么 |
|---|---|
| **技能总览** | 扫描 + 去重 + 容器/遮蔽标记；关键词搜索、分类筛选、按类计数 |
| **分类整理** | 按类分组列出全部 skill，逐条下拉改类，可「恢复自动」 |
| **专家团** | 查看四个内置团的角色/阶段/铁律/绑定 skill；新建、JSON 编辑、删除、恢复内置 |
| **Key 管理** | 选 skill → 自动找变量名 → 填 key → 生成入匙命令；登记 key 元数据；一键生成「加载全部 key」的 shell 片段 |
| **安装 skill** | 贴一个 GitHub 地址或 `owner/repo`，预览仓库里的 skill，勾选装进 `~/.agents/skills` |

**快捷键**：`⇧⌘K`（Windows/Linux 为 `Ctrl+Shift+K`）在任意界面直接打开「技能中枢」，不用先开设置再点左栏。默认键位可以在 设置 → 通用设置 → 快捷键 里改；如果首选键位被别的插件占了，插件会依次试 `⇧⌘J`、`⇧⌘H`…，全被占才退化成「无默认键位」（面板里手动分配），界面不会挂。

> 用 `Shift` 而不是 `Option`：macOS 上 `⌥+字母` 是输入法死键，快捷键服务会把它当输入放过。

除了快捷键，输入框左侧工具行还有一个 **`技能`** 按钮（在「完全权限」右边、模型名左边），点一下同样直达技能中枢——测试时不用记键位。


### Agent 侧工具

| 工具 | 用途 |
|---|---|
| `skill_hub_scan` | 列本机 skill（可按关键词 / 类别过滤），带分类统计 |
| `skill_hub_team` | 取某个专家团的完整 SOP（可只看某一阶段） |
| `skill_hub_key_script` | 生成入匙命令**模板**（只含 `__SECRET__` 占位符，拿不到真实密钥）；给 `skill` 就自动从该 skill 正文找变量名 |
| `skill_hub_install_skill` | 从 GitHub 仓库把 skill 装进 `~/.agents/skills`（真实目录、不用软链、同名不覆盖；同一仓库发到多个 agent 目录的副本自动合并成一份） |
| `skill_hub_audit` | 按本机约定体检技能库：主库里出现软链、DSH 端不空、端侧存了实体副本、目录名与 name 不一致、没有 description、容器目录、未分类 |

### 装 skill 时守的规矩

这个插件装 skill 不走「复制一份到各端」，而是守本机的单一事实来源：

1. 真实目录只落在 `~/.agents/skills/<name>`，**不建软链**；
2. 身份取 `SKILL.md` front-matter 的 `name`，不是文件夹名；
3. 同名目录已存在就**跳过并报出来**，绝不覆盖正在用的 skill；
4. `git clone` 只落到临时目录，装完即删，不把整套仓库留在磁盘上；
5. 每次安装写一行到 `~/.agents/skill-hub/install.log`（时间 / 来源 / 名字 / 落点），方便以后回滚。

## 安装

```bash
git clone https://github.com/TongjieYang/dsh-skill-hub.git ~/ai-project-hub/dsh-skill-hub
```

在 DeepSeek Harness 里让 agent 执行：

```
plugin_manager({ action: "install_bundle", target: "~/ai-project-hub/dsh-skill-hub" })
```

或者在 **侧边栏 → Plugins** 里从本地目录安装。装完重启会话，**设置 → 技能中枢** 就能看到。

## 数据落点

`~/.agents/skill-hub/`（可用环境变量 `DSH_SKILL_HUB_DIR` 覆盖）：

```
config.json     # 分类 overrides / 自定义扫描根 / key 元数据
teams/*.json    # 自建或改过的专家团
```

`config.json` 里**没有 secret**，只有登记信息。

## 扫描根

| 根目录 | rank | 说明 |
|---|---|---|
| `~/.dsh/skills` | 400 | DSH 专有，优先级最高 |
| `~/.agents/skills` | 500 | 跨端 skill 主库 |
| `~/.claude/skills` | 600 | Claude 软链视图 |

rank 小的先见者生效；同名的后来者记为「遮蔽」。可在 `config.json` 的 `roots` 里改。

**安装规则**（`skill_hub_install_skill` / 安装页签）：

- 装成 `~/.agents/skills/<name>` 的真实目录，不用软链；
- 仓库把同一个 skill 发到多个 agent 目录时，按 `.agents/skills` > `.dsh/skills` > 顶层 `skills` > `plugin/skills` 择一，其余忽略（不再出现两份同名）；
- **同名只能替换，不能合并**：`replace: true` 时旧目录先移到 `~/.agents/_trash/<日期>/skill-hub/<name>`，再装新版；不传则为跳过并列出撞名的条目。

**往钥匙串里存 key**：默认给两条命令 ——
`security add-generic-password -s 'skill-hub:weread' -a 'ytj' -U -w`（推荐：`security` 隐藏输入地问你要值，密钥不进 argv、不进 `~/.zsh_history`），
以及一条把值直接写进命令的版本（方便，但会留在 shell history）。

插件**不写任何 dotfile**；要一直带着变量，自己把生成的 `export` 那一行加进对应文件（插件会按你的 shell 给对语法和文件名）：

| shell | 一直生效要加进 | 取回变量写法 |
|---|---|---|
| zsh | `~/.zshenv`（非交互也读；`.zshrc` 只对交互 shell 生效） | `export K="$(security find-generic-password …)"` |
| bash | `~/.bashrc`（仅交互；非交互可设 `BASH_ENV`） | `export K="$(…)"` |
| sh / dash / ksh | `~/.profile`（登录 shell） | `export K="$(…)"` |
| fish | `~/.config/fish/config.fish` | `set -gx K (security find-generic-password …)` |
| PowerShell | `$PROFILE` | `$env:K = <读取表达式>` |
| cmd.exe | 没有 profile 文件 | `for /f "usebackq delims=" %A in (`powershell …`) do set "K=%A"`，持久用 `setx` |

shell 自动识别（看 `$SHELL`，Windows 默认 PowerShell），也可以在界面上手动切；平台与 shell 不匹配时（比如在 macOS 上选了 PowerShell）自动退回 POSIX 写法，不会生成跑不通的命令。
不加文件也完全没问题 —— skill 用的时候现取，最不容易泄漏。

**克隆走哪条路**：预览时先用 `git ls-remote` 分别给「按你的 git 配置」和「直连 GitHub（忽略 git 配置）」计时，取快的那条；一条失败自动换另一条，结果里会写 clone 用时和实际走的路。你的 git 若把 github 重写到镜像（`url.…insteadOf`），镜像慢时这条路会明显拖时间，插件会把另一个选项也试一遍。

**临时目录**：每次预览前清掉 2 小时前的 `$TMPDIR/skill-hub-*` 残留（进程被杀时留下的克隆）。

**不在扫描范围**：`~/.workbuddy/skills`、`~/.codex/skills`。前者是按需挂载的软链视图（116 条），后者当前有 26 个实体副本、计划重装后再接——两者都不进统计，避免把「端侧视图」当成额外的 skill。

**软链是合法形态**：DSH 的 provider 对 symlink 做 `stat` 跟随，链接目录按普通目录处理（`nodeEntryKind`），所以端侧放软链在 DSH / Claude / WorkBuddy 上都成立。被禁止的只有两种：主库内部出现软链、端侧存自带 `SKILL.md` 的真实副本。

## 安全边界

- 密钥永不离开浏览器：不上传、不落盘、不进日志、不进会话
- agent 工具拿到的永远是带 `__SECRET__` 的模板
- 入匙命令由用户自己执行；插件不写 `~/.zshrc`、不改任何 shell 启动文件
- 只读扫描 skill 目录，不修改、不移动、不删除任何 skill

### 0.2.1：仓库副本去重 / 分类不再有「其他」/ 技能库体检

- **同一个 skill 被仓库发到多个 agent 目录只算一份**：`impeccable` 这类仓库会把 skill 同时放进 `.agents/skills`、`.claude/skills`、`plugin/skills`、`cursor-plugin/skills` 等 20 多个目录，预览时按本机布局优先（`.agents/skills` > `.dsh/skills` > 顶层 `skills` > `plugin/skills`）只保留一份，并提示「另合并 N 份同名副本」。
- **分类扩到 12 类**：新增「智能体与工作流」（子智能体、编排、交接、验收）与「商业与决策」（诊断、增长、定价、决策）；`other` 从 51 个降到 0。关键词匹配支持复数（`video` 命中 `videos`）。
- **技能库体检**：技能总览页新增体检卡片，或让 agent 调 `skill_hub_audit`。它按本机约定检查，**只读不改**：

  > 关于软链：DSH 的 provider 会跟随符号链接（`nodeEntryKind` 对 symlink 做 `stat`，链接目录按普通目录处理），所以「端侧放软链」在 DSH/Claude/WorkBuddy 上都是可用形态；被禁止的只有「主库内部出现软链」和「端侧存真实副本」。
主库（`~/.agents/skills`）里出现软链＝严重；`~/.dsh/skills` 里有条目＝注意（软链本身合法，但该根 rank 400 会覆盖同名主库条目）；端侧（`~/.claude/skills` 等）存了真实目录＝注意（应软链到主库）；目录名与 `SKILL.md` 的 name 不一致、没有 description、容器目录、未分类＝提示。

**这个插件拦不住别的安装器写盘**——其他插件直接写文件，所以体检是事后审计：它告诉你结果合不合规，但不阻止写。要真正拦截，只能改 DSH 的安装链路本身。

## 已知行为与注意

- **改完代码要重启 DSH**：浏览器半（`client.js`）刷新窗口（`⌘R`）即可；宿主半（`index.js`、`lib/*`）必须重启 DSH，已安装的包不会热替换 JS。
- **HTTP 路由用 `handler(req, res)` 而不是 `resource(request)`**：DSH 的 webserver 对 `resource` 只放行 `GET`/`HEAD`，其它方法直接回 405 且不读 body。0.1.1 之前所有写操作（改分类 / 存团 / 登记 key）都因此 405，现在改走 `handler` 并自带 body 解析、1 MB 上限、跨站请求（`Sec-Fetch-Site: cross-site`）403。
- **接口只监听 loopback**，没有自己的鉴权：和 DSH 其它插件路由一样，同机其它进程能访问；跨站写入已被拒。
- 专家团里绑定的 skill 是**名字快照**，删了 skill 之后团里会出现「⚠️ 绑定了本机没有的 skill」，但团本身不坏。

## 开发

零依赖、纯 ESM、无构建步骤（宿主半 `index.js` + 浏览器半 `client.js`）。

```bash
node --test "tests/*.test.mjs"
```

73 条测试覆盖：front-matter 解析、多根扫描与遮蔽、12 类分类器、仓库多副本去重、技能库体检、专家团归一化、三平台入匙脚本、真实 `node:http` 上的 `GET /state` 与 `POST /keys/add`、以及 `client.js` 在 vm 沙箱里的模块契约（只 require react、只注册 settings.section + 同名图标）。

## License

MIT
