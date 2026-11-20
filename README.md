## 0.3.9 页签切换不再跳高度

`技能 / 专家团 / 安装` 三页的内容量差很多，之前弹层高度由内容撑开，切页签时会"啪"地跳一下。现在改成**固定长度 + CSS 过渡**：

| 页签 | 高度 | 为什么 |
|---|---|---|
| 技能 | `min(64vh, 560px)` | 列表最长，是基准高度 |
| 专家团 | `min(70vh, 600px)` | 团详情 + 角色/流程，比列表更长 |
| 安装 | `min(40vh, 360px)` | 只有一个输入框和预览按钮 |

```css
.sh-menu{ height:min(64vh,560px); transition:height var(--sh-d3) var(--sh-ease) }
.sh-menu[data-tab="teams"]{ height:min(70vh,600px) }
.sh-menu[data-tab="install"]{ height:min(40vh,360px) }
@media (prefers-reduced-motion: reduce){ .sh-menu{ transition:none!important } }
```

为什么不直接 `transition: height` 到 `auto`：`auto` 没有可插值的端点（CSS 规范如此），浏览器会当成离散变化，看起来还是跳。所以给每页一个**长度值**，高度差在长度之间插值；内容区 `.sh-menu-body` 用 `flex:1 1 auto; min-height:0; overflow:auto` 吃掉剩余空间并自己滚动，面板本身不再滚。

`tests/ui-audit.test.mjs` 新增 3 条守这件事：弹层必须是长度高度且 `transition` 含 `height`、每个页签都要有 `[data-tab]` 高度规则、`prefers-reduced-motion` 必须关掉过渡、正文区必须 `flex:1 1 auto + min-height:0 + overflow:auto`。

---

## 0.3.8 三件事：弹层交给 CSS、图标换矢量、补上界面审核测试

这一版修的是「看着不对」而不是「功能没做」：

- **弹层不再用 JS 算像素**。`client.js` 里 `computeLayout()` / `fitMenu()` / `pos` 状态全部删掉，尺寸与位置改由一条 CSS 决定：
  `left:50%; transform:translateX(-50%); bottom:clamp(84px,12vh,170px); width:clamp(320px,46vw,640px); max-height:min(68vh,640px)`。
  另外两条兜底：`@media (max-height:620px)` 贴底、`@media (max-width:520px)` 满宽。窗口怎么变都在视口里。
- **图标改单色矢量**。emoji 会跟着系统字体渲染成彩色位图，任何主题都可能撞色；现在统一用 16×16 的 `stroke:currentColor` 路径（18 个图形），分类与专家团按 id 映射，颜色永远跟着文字色走。专家团的「图标」输入框改成只读的「自动」图标框。
- **新增界面审核测试** `tests/ui-audit.test.mjs`（15 条，无新依赖）：弹层必须 `clamp()` + 百分比、JS 里不许再出现几何计算、动画/过渡时长只能来自 `--sh-d1|d2|d3`、关键帧只能有两三个且带 `prefers-reduced-motion`、图标槽位不许有 emoji、每个分类/专家团都要能映射到图标、两套主题的文字对比度过 WCAG AA、`className` 必须有样式、图标只能以 `glyph(id, kind)` 形式调用（这条是补上一个真实 bug：`glyph(h, …)` 让设置页整块抛 `h is not a function`）。
- 业务逻辑测试仍是 `tests/*.test.mjs` 的另外 99 条，合计 **114**。

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

**这个插件**：把这类链路固化成**专家团**（团队 = 目标 + 角色 + 阶段 + 铁律 + 每角色绑定的 skill）。内置九个：

| 专家团 | 链路 |
|---|---|
| `daohuo-video` 带货视频团 | 选题 → 脚本 → 素材 → 成片 → 复盘 |
| `kepu-video` 科普视频团 | 选题 → 事实核查 → 稿子 → 成片 |
| `app-builder` 应用开发团 | 说清楚 → 定方案 → 拆任务 → 实现 → 提交 |
| `xhs-ops` 小红书运营团 | 定位 → 选题 → 图文/视频 → 发布复盘 |

另外三团是给 [JimLiu/baoyu-skills](https://github.com/JimLiu/baoyu-skills) 这一套视觉/内容 skill 专门配的（本机已装满 21 个）：

| 专家团 | 链路 |
|---|---|
| 📰 `baoyu-wechat-article` 长文与公众号团 | 选题素材（url-to-markdown / youtube-transcript / wechat-summary）→ 写作（copywriting / format-markdown）→ 配图（cover-image / article-illustrator / infographic）→ 排版发布（markdown-to-html / post-to-wechat） |
| 🧠 `baoyu-visual-explain` 图解与知识漫画团 | 概念拆解（diagram）→ 知识漫画（comic）/ 信息图（infographic）→ 幻灯片（slide-deck） |
| 📡 `baoyu-multichannel` 一稿多平台分发团 | 母稿（url-to-markdown / x-to-markdown / youtube-transcript）→ 平台改写（copywriting / translate）+ 图文卡片（xhs-images / cover-image）→ 分发（post-to-wechat / post-to-weibo / post-to-x） |
| 🎬 `baoyu-video-cover` 视频封面团 | 定基调（读书号 / vlog + 平台画幅）→ 5 维 brief（type / palette / rendering / text / mood）→ 出图（cover-image 16:9 + image-gen 竖版）→ 320px 缩略自检与命名 |
| 🎞 `short-video` 短视频团 | 钩子（baokuan-video / dbs-hook）→ 分镜（rea-video / infographic）→ 成片（onetake / adu-motion-video / tts）→ 封面与发布（cover-image / xhs-images / qihao） |

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
| **分类整理** | 11 类**折叠看板**（默认全收起，只看每类多少条）；点开某一类才展开成卡片网格，卡上直接下拉改类 |
| **专家团** | 单列自上而下：顶部选团 → 基本信息 → 分工/流程总览 → 角色（可增删、可自由绑定 skill）→ 流程 → 铁律；`自动整理` 补齐空项，`导出为 skill` 让 Codex/WorkBuddy 直接用 |
| **Key 管理** | 选 skill → 自动找变量名 → 填 key → 生成入匙命令；**一键在终端里执行**（终端自己打开、你只按回车，首次 macOS 问是否允许控制 Terminal）；登记 key 元数据 |
| **安装 skill** | 贴一个 GitHub 地址或 `owner/repo`，预览仓库里的 skill，勾选装进 `~/.agents/skills`；输入框旁还有个 **`装`** 按钮，直接跳到这套流程 |

**快捷键**：`⇧⌘K`（Windows/Linux 为 `Ctrl+Shift+K`）在任意界面直接打开「技能中枢」，不用先开设置再点左栏。默认键位可以在 设置 → 通用设置 → 快捷键 里改；如果首选键位被别的插件占了，插件会依次试 `⇧⌘J`、`⇧⌘H`…，全被占才退化成「无默认键位」（面板里手动分配），界面不会挂。

> 用 `Shift` 而不是 `Option`：macOS 上 `⌥+字母` 是输入法死键，快捷键服务会把它当输入放过。

除了快捷键，输入框左侧工具行还有一个 **`技能`** 按钮（在「完全权限」右边、模型名左边），点一下同样直达技能中枢——测试时不用记键位。


### 专家团：先整理，再设定

专家团面板是**一列自上而下**的结构，从上到下就是「先想清楚，再动手」的顺序：

| 从上到下 | 是什么 |
|---|---|
| **① 专家团（顶部横排）** | 切团、`＋ 新建`；选中的团圆角高亮，自建团带一个小圆点 |
| **② 基本信息** | 图标、名称、这个团要交付什么；右下一排 `保存改动 / 恢复内置 / 删除` |
| **③ 分工与流程（总览）** | 两张只读表：分工（每角色几 skill、几步、交付什么）、流程（第几步、谁负责、产出什么）；右上是 `自动整理` 与 `导出为 skill` |
| **④ 角色** | 每张卡：角色名、交付物、职责、**已绑定的 skill 胶囊（点 × 解绑、`＋ 绑定 skill` 再挂一个）**；角色数量不限，可删 |
| **⑤ 流程** | 竖排步骤节点：序号、这一步做什么、产出什么、点角色胶囊把负责人挂上去、↑↓ 调序、移除、`＋ 阶段` |
| **⑥ 铁律** | 逐条约束，会原样出现在导出的 SOP 里 |

三个动作：

| 动作 | 做什么 |
|---|---|
| `自动整理` | 把没填的东西补齐：没阶段的按角色顺序生成阶段、阶段没指派就按标题词挑角色、缺职责/交付物/目标/铁律全部补上；**幂等**，再点一次不会有变化 |
| `导出为 skill` | 把整个团写成 `~/.agents/skills/team-<id>/SKILL.md`（分工表 + 流程 + 复盘 + 铁律 + 怎么配合内置能力）。同名已存在会问你要不要覆盖（旧版进 `_trash/`） |
| 角色里的 `＋ 绑定 skill` | 从本机 341 个 skill 里搜、点一下就挂到这个角色上；**不是固定死的**，每个团、每个角色都能自己定 |

**跨工具怎么用**（这是 `导出为 skill` 的意义）：

- **DSH / Codex**：原生读 `~/.agents/skills`，导出后新开一个会话说「用 team-daohuo-video」，或者直接 `/team-daohuo-video`。
- **Claude Code / WorkBuddy**：它们各自读自己的 `skills` 目录，导完加一条软链即可：
  ```bash
  ln -s ~/.agents/skills/team-daohuo-video ~/.claude/skills/team-daohuo-video      # Claude
  ln -s ~/.agents/skills/team-daohuo-video ~/.workbuddy/skills/team-daohuo-video   # WorkBuddy
  ```
- 每个团也可以完全不用导出：`skill_hub_team`（agent 工具）与输入框的「专家团」页签都能直接取到完整 SOP。

### 输入框的「技能」弹层

点输入框左下的 `▱ 技能 ▴`：

- **技能** 页签：搜 340 个 skill，点一行插入 `/<name> `；点右边的 `＋提示词` 插入整句（中文描述自动写成「用这个 skill 完成：…」，英文写成「Use this skill to: …」）
- **专家团** 页签：选一个团 → 面板直接摊开它的**目标 / 分工（每个角色绑了哪些 skill）/ 流程（每步谁做、产出什么）**，一个 `插入完整任务书` 就把整本任务书插进输入框：全部角色 + 每步要装载的 skill 顺序 + 流程 + 三条自检 + 铁律。不需要逐个角色点（每个角色右侧仍有「只插入该角色」，是次要入口）
- 底部 `打开设置` 直接跳技能中枢

### Agent 侧工具

| 工具 | 用途 |
|---|---|
| `skill_hub_scan` | 列本机 skill（可按关键词 / 类别过滤），带分类统计 |
| `skill_hub_team` | 取某个专家团的完整 SOP（可只看某一阶段） |
| `skill_hub_key_script` | 生成入匙命令**模板**（只含 `__SECRET__` 占位符，拿不到真实密钥）；给 `skill` 就自动从该 skill 正文找变量名 |
| `skill_hub_install_skill` | 从 GitHub 仓库把 skill 装进 `~/.agents/skills`（真实目录、不用软链、同名不覆盖；同一仓库发到多个 agent 目录的副本自动合并成一份） |
| `skill_hub_team_export` | 把专家团导出成 `~/.agents/skills/team-<id>/SKILL.md`（同名可 `replace: true`，旧版进 `_trash/`） |
| `skill_hub_audit` | 按本机约定体检技能库：主库里出现软链、DSH 端不空、端侧存了实体副本、目录名与 name 不一致、没有 description、容器目录、未分类 |

### 装 skill 时守的规矩

这个插件装 skill 不走「复制一份到各端」，而是守本机的单一事实来源：

1. 真实目录只落在 `~/.agents/skills/<name>`，**不建软链**；
2. 身份取 `SKILL.md` front-matter 的 `name`，不是文件夹名；
3. 同名目录已存在就**跳过并报出来**，绝不覆盖正在用的 skill；
4. `git clone` 只落到临时目录，装完即删，不把整套仓库留在磁盘上；
5. 每次安装写一行到 `~/.agents/skill-hub/install.log`（时间 / 来源 / 名字 / 落点），方便以后回滚。

## 按书名拉「全部版本封面」（和橱窗对版本用）

同一本书在微信读书上有十几个版本，搜索结果按热度排序；`publishTime` 最新那一条
**不一定是真在卖的版本**（可能是 `publisher`/`isbn` 全空、封面是白底模板的未上架
预备条目）。做读书号内容前先跑一次这个脚本，把每一版摊开核对：

```bash
python3 scripts/weread-editions.py "自卑与超越"
# 也可以直接给 bookId
python3 scripts/weread-editions.py 3300129930
```

产物落在 `~/Desktop/weread-editions/<书名>/`：

| 文件 | 内容 |
|---|---|
| `sheet.jpg` | 全部版本封面拼图，每格标注「出版时间 · bookId · 评价数/评分 · 出版社/ISBN 缺失标记 · 书名」 |
| `editions.json` | 每版的 `bookId / publishTime / publisher / isbn / wordCount / rating / ratingCount / cover / readerLink / deepLink / flags` |
| `covers/<bookId>.jpg` | 最大档封面（`t9_`，没有就退 `t6_/t5_/t3_/s_`） |

判读规则：

- **`无出版社 / 无ISBN`** → 大概率是模板或未上架条目，别用它做封面。
- 用户书架上那本可以在 `GET /shelf/sync` 里按书名找 `bookId` 对齐，避免“橱窗与读书号不是一个版本”。
- 封面 URL 的域名与形态不统一（`cdn.weread.qq.com/weread/cover/…`、`/outpic/…`、`myqcloud.com/cover/…`），
  只能替换 `s_/t1_–t6_/t9_` 前缀，**不能自己拼**；`t9_` 也不是统一尺寸（有 428×653，也有 428×616）。
- 密钥：`WEREAD_API_KEY` 环境变量优先，否则读 macOS 钥匙串（`service=weread`），全程不落盘、不打印。

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
