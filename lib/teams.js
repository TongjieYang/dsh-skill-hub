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
