# 技能中枢 · Skill Hub

> 给 DeepSeek Harness 装一个「技能中枢」：一眼看全本机 skill、自动归纳分类、把常用 skill 编成专家团、第三方 key 收进系统钥匙串（入匙命令给你自己跑）。

<p align="center">
  <img src="icon.svg" width="88" alt="Skill Hub">
</p>

装完在 **设置 → 技能中枢** 里就有四个页签：技能总览 / 分类整理 / 专家团 / Key 管理。

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

**这个插件**：10 类自动归类，三层判定 —— 名字前缀规则 → 平台词提示（小红书/抖音/飞书/高德…）→ 描述关键词加权打分（名字命中权重 4、描述命中权重 1，ASCII 关键词按整词匹配，避免 `docker` 被 `doc` 误伤）。手改的分类写进 `config.json`，永远压过自动结果。

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
| **Key 管理** | 登记 key 元数据；粘贴密钥生成入匙命令；一键生成「加载全部 key」的 shell 片段 |

### Agent 侧工具

| 工具 | 用途 |
|---|---|
| `skill_hub_scan` | 列本机 skill（可按关键词 / 类别过滤），带分类统计 |
| `skill_hub_team` | 取某个专家团的完整 SOP（可只看某一阶段） |
| `skill_hub_key_script` | 生成入匙命令**模板**（只含 `__SECRET__` 占位符，拿不到真实密钥） |

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

## 安全边界

- 密钥永不离开浏览器：不上传、不落盘、不进日志、不进会话
- agent 工具拿到的永远是带 `__SECRET__` 的模板
- 入匙命令由用户自己执行；插件不写 `~/.zshrc`、不改任何 shell 启动文件
- 只读扫描 skill 目录，不修改、不移动、不删除任何 skill

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

50 条测试覆盖：front-matter 解析、多根扫描与遮蔽、10 类分类器、专家团归一化、三平台入匙脚本、真实 `node:http` 上的 `GET /state` 与 `POST /keys/add`、以及 `client.js` 在 vm 沙箱里的模块契约（只 require react、只注册 settings.section + 同名图标）。

## License

MIT
