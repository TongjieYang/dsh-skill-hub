// Skill taxonomy: 10 buckets, name-prefix rules first, then keyword scoring.

export const CATEGORIES = [
  {
    id: 'content-video',
    zh: '内容与视频',
    en: 'Content & Video',
    emoji: '🎬',
    keywords: [
      '视频', '短视频', '口播', '分镜', '剪辑', '成片', '抖音', '视频号', '快手', 'b站', '播客',
      '字幕', '配音', '动效', '动画', '爆款', '带货', '选题', '脚本', 'storyboard', 'video',
      'clip', 'render', 'motion', 'tts', 'subtitle', 'youtube', 'bilibili', 'reels', 'shorts',
      '音乐', '音频', '歌曲', 'music', 'audio', 'sound',
    ],
  },
  {
    id: 'writing',
    zh: '写作与文案',
    en: 'Writing & Copy',
    emoji: '✍️',
    keywords: [
      '文案', '写作', '写稿', '改稿', '标题', '翻译', '笔记', '公众号', '文章', '排版', '博客',
      'copywriting', 'article', 'writing', 'translate', 'markdown', 'blog', 'newsletter', 'seo',
      'headline', 'proofread', 'story', '小说', '剧本',
    ],
  },
  {
    id: 'image-design',
    zh: '图像与设计',
    en: 'Image & Design',
    emoji: '🎨',
    keywords: [
      '图像', '图片', '设计', '海报', '封面', '插画', '配色', '字体', '图标', '视觉', 'ui', 'ux',
      'image', 'design', 'poster', 'illustration', 'figma', 'logo', 'banner', 'mockup', 'layout',
      'typography', 'brand', 'infographic', '信息图',
    ],
  },
  {
    id: 'dev',
    zh: '开发与工程',
    en: 'Dev & Engineering',
    emoji: '🛠',
    keywords: [
      '代码', '开发', '重构', '测试', '调试', '部署', '架构', '接口', '插件', '工程', '编译',
      'code', 'coding', 'debug', 'refactor', 'test', 'tdd', 'deploy', 'docker', 'api', 'cli',
      'plugin', 'typescript', 'python', 'rust', 'react', 'git', 'ci', 'lint', 'review', 'bug',
    ],
  },
  {
    id: 'collab',
    zh: '飞书与协作',
    en: 'Lark & Collaboration',
    emoji: '🧩',
    keywords: [
      '飞书', 'lark', '多维表格', 'bitable', '日程', '日历', '审批', '会议', '纪要',
      'okr', '云文档', '云盘', '知识库', 'wiki', '白板', 'whiteboard', '邮箱', 'mail',
      'calendar', 'meeting', 'approval',
    ],
  },
  {
    id: 'research',
    zh: '检索与知识',
    en: 'Research & Knowledge',
    emoji: '🔍',
    keywords: [
      '检索', '搜索', '研究', '知识库', '网页', '抓取', '论文', '资料', '爬取', '监控',
      'search', 'research', 'rag', 'retrieval', 'crawl', 'scrape', 'browse', 'browser', 'fetch',
      'paper', 'arxiv', 'memory', 'obsidian', '知识',
    ],
  },
  {
    id: 'office-docs',
    zh: '文档办公',
    en: 'Office & Documents',
    emoji: '📄',
    keywords: [
      '文档', '表格', '演示', '报告', '幻灯片', 'office', 'docx', 'pptx', 'xlsx', 'excel',
      'word', 'powerpoint', 'pdf', 'sheet', 'slide', 'deck', 'spreadsheet', 'doc',
      'ppt', 'presentation', 'slides', 'keynote', '演示文稿',
    ],
  },
  {
    id: 'map-travel',
    zh: '地图与出行',
    en: 'Maps & Travel',
    emoji: '🗺',
    keywords: [
      '地图', '高德', '百度地图', '导航', '路线', '天气', '出行', '旅行', '酒店', '机票', '打车',
      '景点', 'map', 'amap', 'geocode', 'route', 'poi', 'travel', 'trip', 'weather', 'itinerary',
    ],
  },
  {
    id: 'commerce-ops',
    zh: '电商与运营',
    en: 'Commerce & Ops',
    emoji: '📈',
    keywords: [
      '电商', '运营', '选品', '店铺', '转化', '成交', '私域', '涨粉', '起号', '账号', '投放',
      '流量', '知乎', '微博', '微信', '推文', '贴图', '种草', '客户', '营销',
      'commerce', 'shop', 'ecommerce', 'gmai', 'growth', 'marketing', 'campaign', 'weibo',
      'wechat', 'tweet', 'twitter', 'social', 'xhs', '小红书',
    ],
  },
  {
    id: 'agent-workflow',
    zh: '智能体与工作流',
    en: 'Agents & Workflow',
    emoji: '🤖',
    keywords: [
      '子智能体', '编排', '工作流', '交接', '分派', '验收', '工单', '需求', '提案', '评审', '提问', '教学',
      'subagent', 'orchestrat', 'workflow', 'handoff', 'brainstorm', 'triage', 'ticket', 'delegate',
      'superpowers', 'spec', 'plan', 'implement', 'teach', 'scratchpad', 'pipeline',
    ],
  },
  {
    id: 'business',
    zh: '商业与决策',
    en: 'Business & Decisions',
    emoji: '📈',
    keywords: [
      '商业', '生意', '诊断', '决策', '增长', '定价', '谈判', '对标', '创业者', '变现', '获客',
      '转化', '利润', '成本', '商业模式', '预测', '激励',
      'business', 'startup', 'revenue', 'pricing', 'strategy', 'consulting', 'growth', 'funnel', 'roi', 'market', 'oracle',
    ],
  },
  { id: 'other', zh: '其他', en: 'Other', emoji: '📦', keywords: [] },
]

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id)
const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]))
export const categoryById = (id) => BY_ID.get(id)

// Strong rules: matched against the skill name only. First match wins.
const NAME_RULES = [
  [/^lark-/, 'collab'],
  [/^(amap|baidu-?map|map-|travel-|trip-)/i, 'map-travel'],
  [/^office(-|$)/i, 'office-docs'],
  [/^(banner-design|ui-ux-pro-max|ui-styling|design-system|design)$/i, 'image-design'],
  [/^design(-|$)/i, 'image-design'],
  [/^baoyu-(xhs-images|cover-image|infographic|slide-deck|comic|article-illustrator|diagram|image-gen|compress-image)/, 'image-design'],
  [/^baoyu-(translate|format-markdown|markdown-to-html)/, 'writing'],
  [/^baoyu-(post-to|wechat-summary)/, 'commerce-ops'],
  [/^baoyu-/, 'writing'],
  [/^(dsh-|plugin-|code-|git-|tdd|playwright|vercel-|modern-web|docker-|migrate-|setup-|scaffold-|typed-|api-docs|agent-dx|maintain-model|release-)/, 'dev'],
  [/^(jianghushuo|baokuan|cheat-|rea-video|adu-|onetake|hyperframes|motion-|jianying|web-video|video-frames|hackathon|qihao|xyq-)/, 'content-video'],
  [/^(weread|greenbubbles|kb-retriever|openviking|obsidian|web-search|kv-|cache-)/, 'research'],
  [/^(dbs|digital-oracle|self-motivate)/, 'business'],
  [/^(agent-|chief-of-staff|claude-handoff|handoff|dispatching-|executing-plans|subagent-)/, 'agent-workflow'],
  [/^(using-superpowers|skill-auditor|moltguard|guard|unfreeze|verification-before|finishing-a-)/, 'agent-workflow'],
  [/^(implement|triage|to-spec|to-tickets|to-questionnaire|pre-impl|loop-me|teach|wait-what|ask-matt|related-skill)/, 'agent-workflow'],
  [/^brain$/, 'research'],
  [/^lottie/, 'image-design'],
  [/^(submit-pr|improve-codebase|gstack-)/, 'dev'],
  [/^error-driven/, 'agent-workflow'],
  [/^ima-skills$/, 'research'],
]

// Platform / product hints beat generic keyword counts: "小红书笔记" is ops,
// not writing, even though 笔记 is a writing word.
const HINT_RULES = [
  [/小红书|xhs|rednote/, 'commerce-ops'],
  [/抖音|视频号|快手|b站|bilibili|youtube|shorts|reels/, 'content-video'],
  [/飞书|larksuite|\blark\b/, 'collab'],
  [/公众号|wechat|微信读书|weibo|微博/, 'commerce-ops'],
  [/高德|百度地图|amap|导航|路线规划|geocod/, 'map-travel'],
]

const ASCII_WORD = /^[a-z0-9][a-z0-9._-]*$/i
const REGEX_ESCAPE = /[.*+?^${}()|[\]\\]/g
const regexCache = new Map()

function keywordMatcher(keyword) {
  const cached = regexCache.get(keyword)
  if (cached) return cached
  const lowered = keyword.toLowerCase()
  let matcher
  if (ASCII_WORD.test(lowered)) {
    // Plural-tolerant: "video" should also hit "videos" / "renders".
    const stem = lowered.replace(REGEX_ESCAPE, '\\$&')
    matcher = new RegExp(`(^|[^a-z0-9])${stem}(s|es|ing|ed)?([^a-z0-9]|$)`)
  } else {
    matcher = { test: (haystack) => haystack.includes(lowered) }
  }
  regexCache.set(keyword, matcher)
  return matcher
}

function matches(haystack, keyword) {
  return haystack.length > 0 && keywordMatcher(keyword).test(haystack)
}

/**
 * Classify one skill. `name` decides strong rules; `name + description`
 * decides keyword scoring.
 */
export function classify(skill) {
  const name = String(skill?.name ?? '')
  const description = String(skill?.description ?? '')
  for (const [re, id] of NAME_RULES) {
    if (re.test(name)) return id
  }
  const lowerDescription = description.toLowerCase()
  for (const [re, id] of HINT_RULES) {
    if (re.test(lowerDescription)) return id
  }
  const lowerName = name.toLowerCase()
  let best = { id: 'other', score: 0 }
  for (const category of CATEGORIES) {
    let score = 0
    for (const keyword of category.keywords) {
      // The name is a far stronger signal than prose, and single ASCII words
      // ("doc", "api", "test") must match whole tokens — otherwise "docker"
      // scores for office-docs and "documentation" scores for doc tools.
      if (matches(lowerName, keyword)) score += 4
      else if (matches(lowerDescription, keyword)) score += 1
    }
    if (score > best.score) best = { id: category.id, score }
  }
  return best.id
}

export function categoryCounts(skills) {
  const counts = new Map(CATEGORY_IDS.map((id) => [id, 0]))
  for (const skill of skills) {
    counts.set(skill.category, (counts.get(skill.category) ?? 0) + 1)
  }
  return CATEGORIES.map((c) => ({ id: c.id, zh: c.zh, en: c.en, emoji: c.emoji, count: counts.get(c.id) ?? 0 }))
}
