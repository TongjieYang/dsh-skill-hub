// Expert teams ("专家团"): an ordered set of roles, each bound to local skills,
// plus stages that say what gets delivered when.

export const BUILTIN_TEAMS = [
  {
    id: 'daohuo-video',
    title: '带货视频团',
    emoji: '🛒',
    goal: '把一个商品变成一条能挂车、能转化、能复投的竖版带货短视频。',
    builtin: true,
    roles: [
      {
        id: 'scout',
        title: '选品情报',
        duty: '看竞品怎么卖这个品、卖点是什么、用户在哪一步流失，落成 3 条可验证的卖点假设。',
        skills: ['research', 'baoyu-url-to-markdown'],
        deliverable: '卖点假设表（卖点 / 证据链接 / 目标人群 / 风险）',
      },
      {
        id: 'hook',
        title: '脚本与钩子',
        duty: '写 5 条不同机制的开头，选 1 条展开成 15–45 秒口播稿，前 3 秒必须给出具体利益或反差。',
        skills: ['baokuan-video', 'dbs-hook', 'copywriting'],
        deliverable: '口播稿 + 5 个开头备选 + 逐句时间轴',
      },
      {
        id: 'board',
        title: '分镜与素材',
        duty: '把口播稿拆成分镜，标出实拍 / 商品图 / 屏幕录制 / 动效各自出处，缺口列成拍摄清单。',
        skills: ['baokuan-video', 'rea-video'],
        deliverable: '分镜表 + 素材缺口清单',
      },
      {
        id: 'produce',
        title: '配音与成片',
        duty: '按分镜出画面与配音，统一动效语气，导出 1080×1920 成片并自查音量与首帧。',
        skills: ['text-to-speech', 'adu-motion-video', 'onetake'],
        deliverable: 'MP4 成片 + 封面帧',
      },
      {
        id: 'ship',
        title: '发布与投放',
        duty: '写标题、话题、评论区引导，给出挂车位置与首轮投放预算建议。',
        skills: ['qihao', 'dbs-xhs-title'],
        deliverable: '发布清单（标题 / 话题 / 封面 / 挂车位 / 预算）',
      },
    ],
    stages: [
      { id: 's1', title: '选品情报', deliverable: '卖点假设表', roleIds: ['scout'] },
      { id: 's2', title: '脚本定稿', deliverable: '口播稿', roleIds: ['hook'] },
      { id: 's3', title: '分镜', deliverable: '分镜表 + 拍摄清单', roleIds: ['board'] },
      { id: 's4', title: '成片', deliverable: 'MP4', roleIds: ['produce'] },
      { id: 's5', title: '发布', deliverable: '发布清单', roleIds: ['ship'] },
    ],
    guardrails: [
      '开头 3 秒必须出现具体数字、对比或反常识结论，禁止「大家好」起手。',
      '卖点必须有证据链接，不许编造参数。',
      '成片交付前跑一遍禁词与平台红线检查。',
    ],
  },
  {
    id: 'kepu-video',
    title: '科普视频团',
    emoji: '🔬',
    goal: '把一个知识问题讲清楚：先保证对，再保证听得懂，最后保证看得下去。',
    builtin: true,
    roles: [
      {
        id: 'verify',
        title: '知识考据',
        duty: '找一手来源，把结论、数字、存疑点分开列；凡是争议结论必须给两方说法。',
        skills: ['research', 'kb-retriever', 'web-search'],
        deliverable: '事实卡（结论 / 来源 / 置信度 / 争议）',
      },
      {
        id: 'explain',
        title: '结构化讲解',
        duty: '用「一个反常识切口 + 三层递进」组织 60–180 秒讲解稿，每个概念配一个日常类比。',
        skills: ['jianghushuo-oral-skill', 'copywriting'],
        deliverable: '讲解稿 + 类比清单',
      },
      {
        id: 'visual',
        title: '视觉化',
        duty: '为每个抽象概念选一种可视化（示意动画 / 信息图 / 实拍演示），并给出画面描述。',
        skills: ['baoyu-infographic', 'adu-motion-video', 'gpt-image-2'],
        deliverable: '可视化方案 + 关键帧',
      },
      {
        id: 'qa',
        title: '成片质检',
        duty: '逐条对照事实卡核查成片，标出任何未加限定的绝对化表述。',
        skills: ['motion-video-ops', 'verification-before-completion'],
        deliverable: '质检单（事实 / 表述 / 音画）',
      },
    ],
    stages: [
      { id: 's1', title: '考据', deliverable: '事实卡', roleIds: ['verify'] },
      { id: 's2', title: '成稿', deliverable: '讲解稿', roleIds: ['explain'] },
      { id: 's3', title: '视觉化', deliverable: '可视化方案', roleIds: ['visual'] },
      { id: 's4', title: '质检', deliverable: '质检单', roleIds: ['qa'] },
    ],
    guardrails: [
      '没有一手来源的数字不进稿。',
      '争议结论必须并列两方，禁止单边断言。',
      '每个专业名词第一次出现时必须给类比解释。',
    ],
  },
  {
    id: 'app-builder',
    title: '应用开发团',
    emoji: '🏗',
    goal: '把一个想法做成能跑、能验收、能交付的应用，每一步都能返回退出码。',
    builtin: true,
    roles: [
      {
        id: 'clarify',
        title: '需求澄清',
        duty: '把模糊愿望改成可验收的需求：谁用、解决什么、验收动作是什么、不做什么。',
        skills: ['team-software-dev', 'brainstorming'],
        deliverable: '01-需求.md（含判据命令）',
      },
      {
        id: 'design',
        title: '架构与接口',
        duty: '定数据结构、接口契约、失败模式；画出模块边界，写清谁调谁。',
        skills: ['team-software-dev', 'writing-plans', 'codebase-design'],
        deliverable: '02-设计.md + 03-任务清单.md',
      },
      {
        id: 'build',
        title: '实现',
        duty: '按任务清单逐项实现，先落测试再落实现，未交文件不得进入下一步。',
        skills: ['tdd', 'executing-plans'],
        deliverable: '可运行代码 + 04-red.log / 04-green.log',
      },
      {
        id: 'review',
        title: '评审与验收',
        duty: '对照需求逐条验收，跑全量测试，指出未覆盖的分支。',
        skills: ['code-review', 'verification-before-completion'],
        deliverable: '验收记录（需求 → 证据）',
      },
      {
        id: 'ship',
        title: '发布',
        duty: '写 README、版本号、变更记录，打 tag 或推仓库。',
        skills: ['release-skills', 'dsh-badge'],
        deliverable: 'README + release notes',
      },
    ],
    stages: [
      { id: 's1', title: '说清楚', deliverable: '01-需求.md', roleIds: ['clarify'] },
      { id: 's2', title: '定方案', deliverable: '02-设计.md', roleIds: ['design'] },
      { id: 's3', title: '拆任务', deliverable: '03-任务清单.md', roleIds: ['design'] },
      { id: 's4', title: '实现', deliverable: '代码 + 测试日志', roleIds: ['build'] },
      { id: 's5', title: '提交', deliverable: '验收记录 + release', roleIds: ['review', 'ship'] },
    ],
    guardrails: [
      '任何一步没有落文件，不得进入下一步。',
      '每步判据必须是一条能返回退出码的命令。',
      '不做需求之外的功能，超出的需求写进 01 的「不做」段落。',
    ],
  },
  {
    id: 'xhs-ops',
    title: '小红书运营团',
    emoji: '📕',
    goal: '把账号当成一个持续产出的系统：选题不断、笔记能爆、数据能复盘。',
    builtin: true,
    roles: [
      {
        id: 'calendar',
        title: '选题日历',
        duty: '按账号定位出 7–14 天的选题排期，每个选题标注爆款对标与差异点。',
        skills: ['dbs-benchmark', 'dbs-content'],
        deliverable: '选题日历表',
      },
      {
        id: 'note',
        title: '图文笔记',
        duty: '把选题写成笔记：首图钩子、正文结构、结尾互动，配 3–9 张图的分镜说明。',
        skills: ['baoyu-xhs-images', 'copywriting'],
        deliverable: '笔记正文 + 图片分镜',
      },
      {
        id: 'title',
        title: '标题与封面',
        duty: '按公式出 10 个标题候选并排序，选 1 个配封面。',
        skills: ['dbs-xhs-title', 'baoyu-cover-image'],
        deliverable: '标题候选表 + 封面图',
      },
      {
        id: 'retro',
        title: '数据复盘',
        duty: '看完播/收藏/涨粉，判定这条属于 A/B/C 级，给出下一条的调整点。',
        skills: ['dbs-content', 'qihao'],
        deliverable: '复盘卡（数据 / 判级 / 下一步）',
      },
    ],
    stages: [
      { id: 's1', title: '选题', deliverable: '选题日历', roleIds: ['calendar'] },
      { id: 's2', title: '成稿', deliverable: '笔记正文', roleIds: ['note'] },
      { id: 's3', title: '包装', deliverable: '标题 + 封面', roleIds: ['title'] },
      { id: 's4', title: '复盘', deliverable: '复盘卡', roleIds: ['retro'] },
    ],
    guardrails: [
      '标题不许用未验证的绝对化承诺（最/第一/必爆）。',
      '封面首图必须能独立看懂，不依赖正文。',
      '每条笔记发布后 48 小时内必须复盘一次。',
    ],
  },

  {
    id: 'baoyu-wechat-article',
    title: '长文与公众号团',
    emoji: '📰',
    goal: '把一个选题做成一篇能直接发公众号的长文：有素材、有配图、有排版、能一键发布。',
    builtin: true,
    source: { repo: 'JimLiu/baoyu-skills', note: '围绕 baoyu-* 系列 skill 的一条龙产线' },
    roles: [
      {
        id: 'gather',
        title: '选题与素材',
        duty: '把选题落成可写的素材包：关键事实、数据、引用来源、可复用的旧文；视频/长文/群聊一律先转成 markdown 再引用。',
        skills: ['baoyu-url-to-markdown', 'baoyu-youtube-transcript', 'baoyu-wechat-summary'],
        deliverable: '素材包（事实 / 数据 / 出处链接 / 可引用原句）',
      },
      {
        id: 'write',
        title: '结构与非虚构写作',
        duty: '定标题、小标题与叙事顺序，写出完整正文；每个断言都要能指回素材包里的出处，不编数据。',
        skills: ['copywriting', 'baoyu-format-markdown'],
        deliverable: '正文 markdown + 标题 5 条备选',
      },
      {
        id: 'visual',
        title: '配图与信息图',
        duty: '按文章结构决定哪里需要图：开头封面、每个小节的解释图或信息图；图要服务理解，不做装饰。',
        skills: ['baoyu-cover-image', 'baoyu-article-illustrator', 'baoyu-infographic'],
        deliverable: '封面 1 张 + 正文配图 N 张（含图注）',
      },
      {
        id: 'layout',
        title: '排版与发布',
        duty: '把 markdown 转成公众号可用的 HTML，处理外链改底部引用、代码高亮、图片顺序；确认预览无误后发布。',
        skills: ['baoyu-markdown-to-html', 'baoyu-post-to-wechat'],
        deliverable: '公众号草稿（已预览）+ 发布记录',
      },
    ],
    stages: [
      { id: 's1', title: '选题与素材', deliverable: '素材包', roleIds: ['gather'] },
      { id: 's2', title: '成稿', deliverable: '正文 markdown', roleIds: ['write'] },
      { id: 's3', title: '配图', deliverable: '封面 + 配图', roleIds: ['visual'] },
      { id: 's4', title: '排版与发布', deliverable: '已发公众号文章', roleIds: ['layout'] },
    ],
    guardrails: [
      '每个事实、数据、引用必须有出处；找不到就不写。',
      '外链按公众号习惯改成文末引用，不在正文留裸链。',
      '配图不能出现未授权的第三方素材；AI 生成图要标注来源。',
    ],
  },
  {
    id: 'baoyu-visual-explain',
    title: '图解与知识漫画团',
    emoji: '🧠',
    goal: '把一个概念或一本书，做成能看懂的视觉解释：知识漫画、信息图或演示幻灯片。',
    builtin: true,
    source: { repo: 'JimLiu/baoyu-skills', note: '重视觉、轻发布的解释型产线' },
    roles: [
      {
        id: 'deconstruct',
        title: '概念拆解',
        duty: '把概念拆成 3–7 个必须讲清的点，排出讲解顺序，标出哪些点必须靠图才能讲明白。',
        skills: ['brainstorming', 'baoyu-diagram'],
        deliverable: '知识点清单 + 讲解顺序 + 需要图解的节点',
      },
      {
        id: 'comic',
        title: '知识漫画',
        duty: '把知识点写成 4–8 格漫画脚本（画面 / 对白 / 情绪），保持同一画风与人物设定。',
        skills: ['baoyu-comic'],
        deliverable: '分格脚本 + 成图',
      },
      {
        id: 'infographic',
        title: '信息图与图解',
        duty: '把数据与关系做成信息图或结构图；版式服务结论，一屏一个观点。',
        skills: ['baoyu-infographic', 'baoyu-diagram'],
        deliverable: '信息图 / 结构图（PNG 或 HTML）',
      },
      {
        id: 'deck',
        title: '幻灯片',
        duty: '需要讲解时把上面两者收成一套幻灯片：每页一个观点，图文比例稳定。',
        skills: ['baoyu-slide-deck', 'html-ppt'],
        deliverable: '幻灯片（图集或 HTML）',
      },
    ],
    stages: [
      { id: 's1', title: '拆概念', deliverable: '知识点与顺序', roleIds: ['deconstruct'] },
      { id: 's2', title: '出图', deliverable: '漫画 / 信息图', roleIds: ['comic', 'infographic'] },
      { id: 's3', title: '收成演示', deliverable: '幻灯片', roleIds: ['deck'] },
    ],
    guardrails: [
      '先定讲解顺序再画，不要一边画一边想结构。',
      '每张图只讲一个点；讲不完就再拆一张。',
      '数据图必须能指回原始出处。',
    ],
  },
  {
    id: 'baoyu-multichannel',
    title: '一稿多平台分发团',
    emoji: '📡',
    goal: '一份内容，改写成小红书 / 微博 / X / 公众号各自的形态，一次排版多平台发出。',
    builtin: true,
    source: { repo: 'JimLiu/baoyu-skills', note: '改写与分发型产线' },
    roles: [
      {
        id: 'source',
        title: '母稿采集',
        duty: '把原始素材（文章、推文、视频）转成一份干净的 markdown 母稿：事实齐全、出处可查、长短可裁剪。',
        skills: ['baoyu-url-to-markdown', 'baoyu-danger-x-to-markdown', 'baoyu-youtube-transcript'],
        deliverable: '母稿 markdown + 出处清单',
      },
      {
        id: 'adapt',
        title: '平台改写',
        duty: '按各平台口味改写：小红书口语 + 钩子前置，微博一句话结论，X 英文短句；同一事实不换说法。',
        skills: ['copywriting', 'baoyu-translate'],
        deliverable: '各平台文案（小红书 / 微博 / X）',
      },
      {
        id: 'cards',
        title: '图文卡片',
        duty: '把改写稿做成小红书图文卡片：封面抓眼、内页一页一点、最后一页收口。',
        skills: ['baoyu-xhs-images', 'baoyu-cover-image'],
        deliverable: '卡片图集（含封面）',
      },
      {
        id: 'publish',
        title: '分发与回收',
        duty: '按平台依次发布，记录链接与首日数据；哪一版跑得好，回流成下一轮的改写模板。',
        skills: ['baoyu-post-to-wechat', 'baoyu-post-to-weibo', 'baoyu-post-to-x'],
        deliverable: '发布链接表 + 首日数据',
      },
    ],
    stages: [
      { id: 's1', title: '母稿', deliverable: '母稿 markdown', roleIds: ['source'] },
      { id: 's2', title: '改写与卡片', deliverable: '各平台文案 + 卡片', roleIds: ['adapt', 'cards'] },
      { id: 's3', title: '分发', deliverable: '发布记录', roleIds: ['publish'] },
    ],
    guardrails: [
      '同一事实在不同平台不许改口，措辞可以变、结论不能变。',
      '发布前逐平台检查字数、话题标签与外链规则。',
      'AI 生成图要标注来源，不伪造实拍。',
    ],
  }
,

  {
    id: 'baoyu-video-cover',
    title: '视频封面团',
    emoji: '🎬',
    goal: '给一条视频做出能被人点开的封面：读书号走「书封 + 手写体标题」，vlog 走「实拍感画面 + 大字标题」，16:9 与竖版各一套。',
    builtin: true,
    source: { repo: 'JimLiu/baoyu-skills', note: '封面由 baoyu-cover-image / baoyu-image-gen 出图，本团负责定调与验收' },
    roles: [
      {
        id: 'ref',
        title: '参考与基调',
        duty: '先定这条是「读书号」还是「vlog」，收到 3–5 张同赛道对标封面（截图或链接），写清目标平台与画幅（B站/YouTube 16:9、小红书 3:4、抖音/视频号 9:16）。',
        skills: ['baoyu-url-to-markdown', 'research'],
        deliverable: '基调卡：赛道 / 平台 / 画幅 / 3 条可复用的视觉规则',
      },
      {
        id: 'brief',
        title: '封面构思',
        duty: '按 5 维（type / palette / rendering / text / mood）写 3 个候选 brief。读书号推荐 type=typography|metaphor、palette=warm|earth|elegant、rendering=painterly|flat-vector；vlog 推荐 type=scene|hero、palette=vivid|earth|cool、rendering=digital|painterly。每个 brief 标好主标题字数（≤8 字、最多 2 行）。',
        skills: ['baoyu-cover-image', 'copywriting'],
        deliverable: '3 个封面 brief（含 5 维与标题文案）',
      },
      {
        id: 'render',
        title: '出图',
        duty: '用 baoyu-cover-image 出 16:9；竖版用 baoyu-image-gen 指定尺寸。每个 prompt 必须先落到 prompts/NN-{type}-[slug].md 再交给后端；同名同 seed 不重复调。只出位图，不许用 SVG/HTML/Canvas 顶替。',
        skills: ['baoyu-cover-image', 'baoyu-image-gen', 'baoyu-infographic'],
        deliverable: '封面候选图（16:9 + 竖版）+ prompts 目录',
      },
      {
        id: 'check',
        title: '自检与交付',
        duty: '缩到 320px 宽看标题还认不认得出；检查主体是否被平台 UI 挡住（右下角时长、左下角标题区）；统一命名 封面-{赛道}-{日期}-{序号}.png，压到平台上限内。',
        skills: ['baoyu-compress-image'],
        deliverable: '定稿封面 + 尺寸/命名说明 + 一条「下次怎么改」的记录',
      },
    ],
    stages: [
      { id: 'c1', title: '定基调', deliverable: '基调卡', roleIds: ['ref'] },
      { id: 'c2', title: '出 brief', deliverable: '3 个候选 brief', roleIds: ['brief'] },
      { id: 'c3', title: '出图', deliverable: '候选封面', roleIds: ['render'] },
      { id: 'c4', title: '验收交付', deliverable: '定稿封面', roleIds: ['check'] },
    ],
    guardrails: [
      '只出位图：禁止用 SVG / HTML / Canvas 代替；出不了图就明说，不糊一张代码图。',
      '禁止在成品图上叠字改字（包括 ImageMagick / Pillow）：要改文字就改 prompt 重生成。',
      '读书号不许伪造书名、作者、出版社或评分；引用原书封面需注明来源。',
      '标题与主体必须互相指认：封面大字说的是谁，画面主体就得是谁。',
    ],
  },
  {
    id: 'short-video',
    title: '短视频团',
    emoji: '🎞',
    goal: '把一个选题做成 15–60 秒竖版短视频：钩子、分镜、成片、封面，一条线走完。',
    builtin: true,
    source: { repo: 'JimLiu/baoyu-skills', note: '封面/信息图由 baoyu-* 负责，成片走本机 onetake / adu-motion-video' },
    roles: [
      {
        id: 'hook',
        title: '选题与钩子',
        duty: '挑一个能在 3 秒内说清利益或反差的选题，写 5 个开头备选，选 1 个展开成 15–60 秒口播稿。',
        skills: ['baokuan-video', 'dbs-hook', 'copywriting'],
        deliverable: '选题卡 + 5 个开头 + 口播稿',
      },
      {
        id: 'board',
        title: '分镜与素材',
        duty: '把口播稿拆成分镜，标清实拍 / 商品图 / 录屏 / 动效出处；需要解释数据时插一张 baoyu 信息图。',
        skills: ['rea-video', 'baoyu-infographic'],
        deliverable: '分镜表 + 素材缺口清单',
      },
      {
        id: 'render',
        title: '成片',
        duty: '按分镜出画面与配音，1080×1920、−14 LUFS，首帧 1 秒内出现钩子；导出 MP4 并自查音量与首帧。',
        skills: ['onetake', 'adu-motion-video', 'text-to-speech'],
        deliverable: 'MP4 成片 + 首帧图',
      },
      {
        id: 'pack',
        title: '封面与发布',
        duty: '用封面团的两套 preset 出封面（竖版 9:16 + 平台转码），写标题/话题/评论区引导，按平台规则发布并记录首日数据。',
        skills: ['baoyu-cover-image', 'baoyu-xhs-images', 'qihao'],
        deliverable: '封面 + 发布记录 + 首日数据',
      },
    ],
    stages: [
      { id: 'v1', title: '选题与稿', deliverable: '口播稿', roleIds: ['hook'] },
      { id: 'v2', title: '分镜', deliverable: '分镜表', roleIds: ['board'] },
      { id: 'v3', title: '成片', deliverable: 'MP4', roleIds: ['render'] },
      { id: 'v4', title: '封面与发布', deliverable: '已发布链接', roleIds: ['pack'] },
    ],
    guardrails: [
      '前 3 秒必须给出具体利益或反差，不许用「大家好」开头。',
      '成片 1080×1920、−14 LUFS、首帧不许是黑屏或纯字卡。',
      '封面标题与视频钩子必须是同一句主张，不换概念。',
    ],
  },

]

export const TEAM_IDS = BUILTIN_TEAMS.map((t) => t.id)
export const builtinTeam = (id) => BUILTIN_TEAMS.find((t) => t.id === id)

/** Stable, filesystem-safe id from a title. */
export function slugify(title) {
  const ascii = String(title ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return ascii || `team-${Date.now().toString(36)}`
}

export function emptyTeam() {
  return {
    id: '',
    title: '',
    emoji: '🧩',
    goal: '',
    builtin: false,
    roles: [
      { id: 'role-1', title: '负责人', duty: '', skills: [], deliverable: '' },
    ],
    stages: [],
    guardrails: [],
  }
}

/** Normalize arbitrary input into the team shape the UI and tools expect. */
export function normalizeTeam(input) {
  const team = input && typeof input === 'object' ? input : {}
  const roles = Array.isArray(team.roles) ? team.roles : []
  const stages = Array.isArray(team.stages) ? team.stages : []
  return {
    id: typeof team.id === 'string' && team.id ? team.id : slugify(team.title),
    title: typeof team.title === 'string' ? team.title.trim() : '',
    emoji: typeof team.emoji === 'string' && team.emoji ? team.emoji : '🧩',
    goal: typeof team.goal === 'string' ? team.goal.trim() : '',
    builtin: Boolean(team.builtin),
    roles: roles
      .filter((r) => r && typeof r === 'object')
      .map((r, index) => ({
        id: typeof r.id === 'string' && r.id ? r.id : `role-${index + 1}`,
        title: typeof r.title === 'string' ? r.title.trim() : `角色 ${index + 1}`,
        duty: typeof r.duty === 'string' ? r.duty.trim() : '',
        skills: Array.isArray(r.skills) ? r.skills.filter((s) => typeof s === 'string' && s) : [],
        deliverable: typeof r.deliverable === 'string' ? r.deliverable.trim() : '',
      })),
    stages: stages
      .filter((s) => s && typeof s === 'object')
      .map((s, index) => ({
        id: typeof s.id === 'string' && s.id ? s.id : `stage-${index + 1}`,
        title: typeof s.title === 'string' ? s.title.trim() : `阶段 ${index + 1}`,
        deliverable: typeof s.deliverable === 'string' ? s.deliverable.trim() : '',
        roleIds: Array.isArray(s.roleIds) ? s.roleIds.filter((x) => typeof x === 'string' && x) : [],
      })),
    guardrails: Array.isArray(team.guardrails) ? team.guardrails.filter((g) => typeof g === 'string' && g.trim()) : [],
  }
}

/** Builtin teams, each overlaid by a user team with the same id. */
export function mergeTeams(userTeams = []) {
  const users = new Map()
  for (const raw of userTeams) {
    if (!raw || typeof raw !== 'object') continue
    if (!raw.id && !raw.title) continue
    const team = normalizeTeam(raw)
    if (team.id) users.set(team.id, team)
  }
  const merged = []
  for (const builtin of BUILTIN_TEAMS) {
    merged.push(users.has(builtin.id) ? { ...users.get(builtin.id), builtin: true } : { ...builtin })
    users.delete(builtin.id)
  }
  for (const team of users.values()) merged.push(team)
  return merged
}

/** Which bound skills are absent from the local library. */
export function missingSkills(team, skillNames) {
  const known = skillNames instanceof Set ? skillNames : new Set(skillNames ?? [])
  const missing = new Set()
  for (const role of team.roles ?? []) {
    for (const skill of role.skills ?? []) {
      if (!known.has(skill)) missing.add(skill)
    }
  }
  return [...missing]
}

/**
 * Fill the blanks so a half-written team still reads as a plan.
 * Never invents new roles/stages — only completes what the user started.
 */
export function autoCompose(input) {
  const team = normalizeTeam(input)
  const changes = []
  const roles = team.roles.length ? team.roles : []
  if (!roles.length) return { team, changes }

  // 1) No stages at all → one stage per role, in order.
  if (!team.stages.length) {
    team.stages = roles.map((role, index) => ({
      id: `stage-${index + 1}`,
      title: role.deliverable || role.title,
      deliverable: role.deliverable || `${role.title} 的产出`,
      roleIds: [role.id],
    }))
    changes.push(`按角色顺序生成了 ${team.stages.length} 个阶段`)
  }

  const roleById = new Map(roles.map((r) => [r.id, r]))
  const tokens = (text) =>
    String(text ?? '')
      .toLowerCase()
      .split(/[\s、,，/（）()]+/)
      .filter((w) => w.length >= 2)

  // 2) Assign an owner to every stage that has none.
  team.stages.forEach((stage, index) => {
    if (stage.roleIds.length && stage.roleIds.every((id) => roleById.has(id))) return
    const titleTokens = new Set(tokens(stage.title))
    let best = null
    let bestScore = 0
    for (const role of roles) {
      const score =
        tokens(role.title).filter((w) => titleTokens.has(w)).length * 2 +
        tokens(role.deliverable).filter((w) => titleTokens.has(w)).length
      if (score > bestScore) {
        best = role
        bestScore = score
      }
    }
    if (!best) best = roles[Math.min(index, roles.length - 1)]
    stage.roleIds = [best.id]
    changes.push(`阶段「${stage.title}」指派给 ${best.title}`)
  })

  // 3) Stage title / deliverable fallbacks.
  team.stages.forEach((stage) => {
    const owners = stage.roleIds.map((id) => roleById.get(id)).filter(Boolean)
    if (!stage.deliverable) {
      const fromRole = owners.map((r) => r.deliverable).find(Boolean)
      stage.deliverable = fromRole || `${stage.title || '本阶段'} 的产出`
      changes.push(`阶段「${stage.title}」补了交付物`)
    }
    if (!stage.title) {
      stage.title = owners.map((r) => r.title).join(' + ') || '阶段'
      changes.push('补了阶段标题')
    }
  })

  // 4) Role duty / deliverable fallbacks, derived from the stages they own.
  for (const role of roles) {
    const owned = team.stages.filter((s) => s.roleIds.includes(role.id))
    if (!role.deliverable) {
      role.deliverable = owned.map((s) => s.deliverable).filter(Boolean)[0] || `${role.title} 的产出`
      changes.push(`角色「${role.title}」补了交付物`)
    }
    if (!role.duty) {
      const where = owned.map((s) => `「${s.title}」`).join('') || '全流程'
      role.duty = `${where}阶段负责 ${role.deliverable}，产出交给下一阶段；缺输入时先向上一阶段要，不要自己编。`
      changes.push(`角色「${role.title}」补了职责`)
    }
  }

  // 5) Team-level fallbacks.
  if (!team.goal) {
    team.goal = `用 ${team.title || '这个团'} 把输入做成可交付的成品。`
    changes.push('补了目标')
  }
  if (!team.guardrails.length) {
    team.guardrails = [
      '先给结论，再给依据；没有依据的结论标「推测」。',
      '每个阶段先落文件再进入下一阶段，产物路径写进交付物。',
      '引用前序产物时给路径，不复述整篇。',
    ]
    changes.push('补了 3 条铁律')
  }
  return { team, changes }
}

/** Markdown body for one team, shaped as a runnable SOP. */
export function renderTeamSop(team, { stageId = '', skillNames = null } = {}) {
  const known = skillNames instanceof Set ? skillNames : skillNames ? new Set(skillNames) : null
  const nameOf = (id) => team.roles.find((r) => r.id === id)?.title ?? id
  const out = []
  out.push(`# ${team.emoji || '🧩'} ${team.title}`)
  out.push('')
  out.push(`**目标**：${team.goal || '（未填写）'}`)
  out.push('')

  out.push('## 分工')
  out.push('')
  out.push('| 角色 | 职责 | 交付物 | 绑定 skill | 出场阶段 |')
  out.push('| --- | --- | --- | --- | --- |')
  for (const role of team.roles) {
    const stages = team.stages.filter((s) => s.roleIds.includes(role.id)).map((s) => s.title).join(' → ')
    const skills = role.skills.length ? role.skills.map((s) => `\`${s}\``).join(' ') : '—'
    out.push(`| ${role.title} | ${oneLine(role.duty)} | ${oneLine(role.deliverable)} | ${skills} | ${oneLine(stages) || '—'} |`)
  }
  out.push('')

  out.push('## 流程')
  out.push('')
  team.stages.forEach((stage, index) => {
    const owners = stage.roleIds.map(nameOf).join(' + ') || '未指派'
    out.push(`### ${index + 1}. ${stage.title}`)
    out.push(`- 谁做：${owners}`)
    const skills = stage.roleIds
      .flatMap((id) => team.roles.find((r) => r.id === id)?.skills ?? [])
      .filter((s, i, all) => all.indexOf(s) === i)
    if (skills.length) {
      out.push(`- 用什么：按顺序装载 ${skills.map((s) => `\`${s}\``).join(' → ')}`)
      if (known) {
        const missing = skills.filter((s) => !known.has(s))
        if (missing.length) out.push(`- ⚠️ 本地没装：${missing.join('、')}（先在「安装 skill」页签装上，再跑这一阶段）`)
      }
    } else {
      out.push('- 用什么：暂未绑定 skill，用通用能力（读文件/写文件/命令）完成')
    }
    out.push(`- 产出：${stage.deliverable || '未定义'}`)
    const next = team.stages[index + 1]
    out.push(`- 交给：${next ? next.title + '（' + (next.roleIds.map(nameOf).join(' + ') || '未指派') + '）' : '最终交付'}`)
    out.push('')
  })

  out.push('## 复盘')
  out.push('')
  for (const stage of team.stages) {
    out.push(`- ${stage.title}：产出是否可独立交付？有没有把「推测」写成「事实」？缺的参数有没有向上游要？`)
  }
  out.push('- 全流程：哪一步返工最多？下次该把这一步的输入约束写进上一阶段的交付物定义。')
  out.push('')

  const missing = team.missingSkills ?? []
  if (missing.length) {
    out.push(`## ⚠️ 缺失 skill（本地未安装）：${missing.join('、')}`)
    out.push('')
  }

  if (team.guardrails.length) {
    out.push('## 铁律')
    out.push('')
    for (const g of team.guardrails) out.push(`- ${g}`)
    out.push('')
  }

  out.push('## 和内置能力怎么配合')
  out.push('')
  out.push('- 装载 skill：`skill` 工具按名字加载；斜杠命令（如 `/impeccable`）等价于装载对应 skill。')
  out.push('- 并行/隔离：需要多个角色同时干活时用 `subagent`（各自独立上下文），或 `workflow` 做批量。')
  out.push('- 长流程：用 `todo_write` 建任务清单，一个阶段一条，完成一条划一条。')
  out.push('- 产物：每一阶段的交付物落成文件（md/json/图片），下一阶段只读文件，不在对话里复述。')
  out.push('- 外部工具：地图/搜索/文档等走已安装的 MCP 或 skill，不自己编造接口。')
  if (stageId) {
    const stage = team.stages.find((s) => s.id === stageId)
    if (stage) out.push(`\n> 当前阶段：${stage.title}`)
  }
  return out.join('\n')
}

function oneLine(text, max = 120) {
  const flat = String(text ?? '').replace(/\s+/g, ' ').trim()
  return flat.length > max ? flat.slice(0, max - 1) + '…' : flat || '—'
}

/** SKILL.md text so Codex / WorkBuddy / Claude can consume the team as a skill. */
export function renderTeamSkill(team, { skillNames = null } = {}) {
  const description = `${team.goal || team.title}（专家团：${team.roles.length} 个角色、${team.stages.length} 个阶段）`
  const lines = [
    '---',
    `name: ${team.skillName || team.id}`,
    `description: ${description}`,
    '---',
    '',
    renderTeamSop(team, { skillNames }),
    '',
    '## 怎么用这个 skill',
    '',
    '1. 先读上面的「分工」，确认这一轮你需要扮演哪个角色（或哪几个）。',
    '2. 按「流程」推进；每一步先装载该角色绑定的 skill，再动手。',
    '3. 每步产物落文件，路径写进交付物；进入下一步只引用路径。',
    '4. 收尾按「复盘」逐条自检，再给用户交付。',
  ]
  return lines.join('\n')
}
