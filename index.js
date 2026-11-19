// dsh-skill-hub — host half.
//
// Registers five agent tools and one HTTP route under /skill-hub/api.
// Tool definitions are hand-written "compiled" objects (name / description /
// parameters JSON Schema / output.render / execute) so this bundle needs no
// dependency on @deepseek-ai/dsh-tools and installs from a plain directory.

import {
  buildState, searchSkills, renderTeam, setOverride, saveTeam, deleteTeam,
  addKey, removeKey, keyScript, detectSkillKeys, previewInstall, installFromPreview,
} from './lib/hub.js'
import { auditLibrary } from './lib/audit.js'

export const name = 'skill-hub'
export const inject = ['tools']

const API_PREFIX = '/skill-hub/api'

const text = (value) => [{ type: 'text', text: String(value ?? '') }]

const output = (schema) => ({ schema, render: (_args, value) => text(value) })
const STRING_OUTPUT = output({ type: 'string' })

const TOOLS = [
  {
    name: 'skill_hub_audit',
    description: [
      '体检本机技能库，按本机约定找出不合规的地方：主库里出现软链、DSH 端不空（会遮蔽主库）、',
      '端侧存了实体副本、目录名与 SKILL.md 的 name 不一致、没有 description、容器目录、仍未分类。',
      '用户问「我的 skill 库有没有问题」「安装的东西合规吗」「为什么会撞名」时用它。',
      '插件拦不住别的安装器写盘，所以这是事后审计：只读，不改任何文件。',
    ].join(''),
    parameters: { type: 'object', additionalProperties: false, properties: {} },
    output: STRING_OUTPUT,
    async execute() {
      const report = await auditLibrary()
      const severityLabel = { high: '严重', middle: '注意', low: '提示' }
      const lines = [
        `## 技能库体检：${report.clean ? '没有发现问题' : `${report.findings.length} 条`}`,
        '',
        `- 扫描到 ${report.skillCount} 个 skill，规则来自本机约定（主库唯一实体 / 端侧只放软链 / DSH 端留空）`,
        `- 严重 ${report.bySeverity.high} · 注意 ${report.bySeverity.middle} · 提示 ${report.bySeverity.low}`,
        '',
      ]
      if (report.clean) {
        lines.push('所有条目都符合约定。')
      } else {
        for (const item of report.findings) {
          lines.push(`### [${severityLabel[item.severity] ?? item.severity}] ${item.message}`)
          if (item.refs?.length) lines.push(`> ${item.refs.join(' / ')}`)
          lines.push('')
        }
      }
      lines.push('插件只能审计、不能拦截：别的安装器直接写盘，它看到的是结果。')
      return lines.join('\n')
    },
  },
  {
    name: 'skill_hub_scan',
    description: [
      '列出本机已安装的 skill 并按 10 个类别归纳（内容与视频 / 写作与文案 / 图像与设计 / 开发与工程 /',
      ' / 飞书与协作 / 检索与知识 / 文档办公 / 地图与出行 / 电商与运营 / 其他）。',
      '当用户问「我有哪些 skill」「有没有能做 X 的 skill」「这个任务该用哪些 skill」时先调用它。',
      '返回类别统计 + 命中的 skill（名字 / 来源 / 类别 / 描述首行）。',
    ].join(''),
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        query: { type: 'string', description: '关键词，匹配 skill 名或描述；留空列全部。' },
        category: {
          type: 'string',
          description: '只列某一类：content-video / writing / image-design / dev / collab / research / office-docs / map-travel / commerce-ops / other。',
        },
        limit: { type: 'integer', description: '最多列出多少条，默认 40，上限 200。' },
      },
    },
    output: STRING_OUTPUT,
    async execute(args) {
      const state = await buildState()
      const found = searchSkills(state, {
        query: args?.query,
        category: args?.category,
        limit: args?.limit,
      })
      const lines = []
      lines.push(`## 本机 skill 共 ${state.skills.length} 条（扫描根 ${state.roots.filter((r) => r.exists).length} 个）`)
      lines.push('')
      lines.push('### 分类统计')
      for (const category of state.categories) {
        lines.push(`- ${category.emoji} ${category.zh}（${category.id}）：${category.count}`)
      }
      lines.push('')
      lines.push(`### 命中 ${found.total} 条${found.total > found.shown.length ? `（显示前 ${found.shown.length} 条）` : ''}`)
      for (const skill of found.shown) {
        const overridden = skill.overridden ? '（手动分类）' : ''
        lines.push(`- ${skill.name}${overridden} · ${skill.source} · ${skill.category} — ${skill.description || '无描述'}`)
      }
      if (found.total === 0) lines.push('- （没有命中）')
      lines.push('')
      lines.push('要看某个专家团怎么组合这些 skill，调用 skill_hub_team。')
      return lines.join('\n')
    },
  },
  {
    name: 'skill_hub_team',
    description: [
      '取一个「专家团」的完整 SOP：目标、角色（职责 / 绑定的 skill / 交付物）、阶段顺序、铁律。',
      '内置四个团：daohuo-video（带货视频）、kepu-video（科普视频）、app-builder（应用开发）、',
      'xhs-ops（小红书运营）；用户自建团也会出现在列表里。',
      '当用户说「做成带货视频 / 科普视频 / 上个应用 / 运营小红书」「这件事该怎么排」时，',
      '先取对应团的 SOP，再按阶段逐个装载它绑定的 skill。',
    ].join(''),
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        team: {
          type: 'string',
          description: '团 id。留空则只列出所有团和各自目标，让你挑一个。',
        },
        stage: { type: 'string', description: '只看某个阶段的角色，如 s1 / s2。' },
      },
    },
    output: STRING_OUTPUT,
    async execute(args) {
      const state = await buildState()
      const wanted = String(args?.team ?? '').trim()
      if (!wanted) {
        const lines = ['## 专家团']
        for (const team of state.teams) {
          const roles = team.roles.map((r) => r.title).join(' → ')
          lines.push(`- ${team.emoji} ${team.title}（${team.id}）：${team.goal}`)
          lines.push(`  角色：${roles}`)
          if (team.missingSkills.length) lines.push(`  ⚠️ 缺失 skill：${team.missingSkills.join('、')}`)
        }
        return lines.join('\n')
      }
      const team = state.teams.find((t) => t.id === wanted || t.title === wanted)
      if (!team) {
        return `没有找到专家团「${wanted}」。可用：${state.teams.map((t) => t.id).join('、')}`
      }
      return renderTeam(team, String(args?.stage ?? '').trim())
    },
  },
  {
    name: 'skill_hub_key_script',
    description: [
      '生成把一个第三方 API key 存进系统钥匙串（macOS security / Windows DPAPI / Linux secret-tool）的命令。',
      '这些命令里带的是占位符 __SECRET__，真实密钥必须由用户在设置面板「技能中枢 → Key 管理」里自己填，',
      '再在终端自己执行 —— 不要向用户索取密钥，也不要把密钥写进任何文件、环境变量或 skill 正文。',
      '当用户要给某个服务配 key（微信读书 / 高德 / 百度地图 / 第三方 AI）时调用，然后把命令原样交给用户。',
    ].join(''),
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        skill: { type: 'string', description: '本机已安装的 skill 名；给了它就自动从该 skill 的正文里找变量名，不用猜。' },
        env: { type: 'string', description: '环境变量名，如 WEREAD_API_KEY。给了 skill 且 env 留空时自动取检测到的那一个。' },
        service: { type: 'string', description: '钥匙串里的服务名，如 weread / amap / baidu-map / openai。' },
        account: { type: 'string', description: '钥匙串里的账号名，默认取当前用户名。' },
        platform: {
          type: 'string',
          enum: ['darwin', 'win32', 'linux'],
          description: '目标平台，留空按当前系统。',
        },
        note: { type: 'string', description: '一句话备注，方便以后认出这是谁的 key。' },
      },
      required: [],
    },
    output: STRING_OUTPUT,
    async execute(args) {
      let env = String(args?.env ?? '').trim()
      let service = String(args?.service ?? '').trim()
      let note = String(args?.note ?? '').trim()
      let detected = null

      if (!env && args?.skill) {
        detected = await detectSkillKeys({ skill: args.skill, platform: args.platform })
        if (!detected.ok) return `检测失败：${detected.error}`
        if (detected.vars.length === 0) {
          return `skill \`${detected.skill.name}\` 的正文里没有出现形如 $FOO_KEY 的变量名，请把 env 直接给它。`
        }
        if (detected.vars.length > 1) {
          return [
            `skill \`${detected.skill.name}\` 里找到 ${detected.vars.length} 个变量，选一个再把 env 传给我：`,
            '',
            ...detected.vars.map((item) => `- \`${item.env}\`（出现 ${item.hits} 次，建议服务名 ${item.service}）`),
          ].join('\n')
        }
        env = detected.vars[0].env
        service = service || detected.vars[0].service
        note = note || `来自 skill ${detected.skill.name}`
      }

      if (!env) return '缺少 env：要么直接给环境变量名，要么给一个可用 skill 让它自动检测。'

      const script = keyScript({
        env,
        service,
        account: args?.account,
        platform: args?.platform,
        note,
      })
      if (!script.ok) return `无法生成脚本：${script.error}`
      return [
        `## ${script.env} → ${script.service}`,
        '',
        '把 __SECRET__ 换成真实密钥后，在**你自己的终端**执行：',
        '```bash',
        script.add,
        '```',
        '',
        '验证（不要打印密钥）：',
        '```bash',
        script.verify,
        '```',
        '',
        '需要用时临时取回环境变量：',
        '```bash',
        script.export,
        '```',
        '',
        script.note,
        '',
        '提示：真实密钥请让用户在设置面板里填，它会留在浏览器里、只用于拼命令。',
      ].join('\n')
    },
  },
  {
    name: 'skill_hub_install_skill',
    description: [
      '把一个开源 skill 从 GitHub 装进本机共享技能库 ~/.agents/skills。',
      '用户说「装一下这个 skill」「把 github.com/xxx/yyy 里的 skill 装上」时用它。',
      '规则follow本机约定：装成真实目录（不用软链），身份取 SKILL.md front-matter 的 name，',
      '同名已存在就跳过、绝不覆盖；安装前 git clone 到临时目录，装完即删。',
      '不给 names 时先只做预览、把仓库里的候选 skill 列给用户挑；只有一个候选时直接装。',
    ].join(''),
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        source: { type: 'string', description: 'GitHub 地址：owner/repo 或 https://github.com/owner/repo（可带 /tree/branch/subdir）。' },
        names: {
          type: 'array',
          items: { type: 'string' },
          description: '要安装的 skill 名（front-matter 的 name）。留空=只预览，或仓库只有一个 skill 时直接装它。',
        },
        dryRun: { type: 'boolean', description: 'true 时只预览不安装。' },
      },
      required: ['source'],
    },
    output: STRING_OUTPUT,
    async execute(args) {
      const source = String(args?.source ?? '').trim()
      if (!source) return '缺少 source：给一个 owner/repo 或 GitHub 地址。'

      const preview = await previewInstall({ source })
      if (!preview.ok) return `预览失败：${preview.error}`
      if (preview.total === 0) return `${source} 里没有找到 SKILL.md，装不了。`

      const wanted = (args?.names ?? []).map((item) => String(item)).filter(Boolean)
      const lines = [
        `## ${preview.source.owner}/${preview.source.repo}`,
        '',
        `仓库里找到 ${preview.total} 个 skill${preview.duplicateCount ? `（另合并 ${preview.duplicateCount} 份同名副本）` : ''}：`,
        '',
        ...preview.candidates.map((item) => `- \`${item.name}\` — ${item.relPath}${item.description ? `：${item.description}` : ''}`),
        '',
        `装到：\`${preview.target}\``,
      ]

      const shouldInstall = !args?.dryRun && (wanted.length > 0 || preview.total === 1)
      if (!shouldInstall) {
        lines.push('', wanted.length === 0 && preview.total > 1
          ? '仓库里有多个 skill，把要装的名字放进 names 再调一次。'
          : '（dryRun：没有写入任何文件。）')
        return lines.join('\n')
      }

      const names = wanted.length > 0 ? wanted : [preview.candidates[0].name]
      const result = await installFromPreview({ source, names })
      if (!result.ok && result.installed?.length === 0) {
        lines.push('', `安装失败：${result.error ?? result.skipped.map((item) => `${item.name}: ${item.reason}`).join('；')}`)
        return lines.join('\n')
      }

      lines.push('', '### 已安装')
      for (const item of result.installed) lines.push(`- \`${item.name}\` → ${item.path}`)
      if (result.skipped?.length) {
        lines.push('', '### 跳过')
        for (const item of result.skipped) lines.push(`- \`${item.name}\`：${item.reason}`)
      }
      lines.push('', 'DSH 会直接读 ~/.agents/skills，重启或新开一个会话说「用 xxx skill」即可。')
      return lines.join('\n')
    },
  },
]


// ---------------------------------------------------------------------------
// HTTP surface
//
// A `resource(request)` route only answers GET/HEAD: the webserver turns every
// other method into 405 with `Allow: GET, HEAD` before the body is read. Every
// mutation here is a POST, so the route is registered with the Node-style
// `handler(req, res)` form instead and reads the body itself.
// ---------------------------------------------------------------------------

const MAX_BODY_BYTES = 1 << 20

function send(res, status, body) {
  const payload = Buffer.from(JSON.stringify(body), 'utf8')
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(payload.length),
    'cache-control': 'no-store',
  })
  res.end(payload)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('请求体过大'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function dispatch(method, sub, body) {
  if (sub === '' || sub === 'state' || sub === 'audit') {
    if (method !== 'GET' && method !== 'HEAD') return { status: 405, body: { ok: false, error: '该接口只支持 GET' } }
    if (sub === 'audit') return { status: 200, body: await auditLibrary() }
    return { status: 200, body: await buildState() }
  }
  if (method !== 'POST') return { status: 405, body: { ok: false, error: '该接口只支持 POST' } }

  switch (sub) {
    case 'classify':
      return { status: 200, body: await setOverride({ name: body.name, category: body.category }) }
    case 'team/save':
      return { status: 200, body: await saveTeam({ team: body.team }) }
    case 'team/delete':
      return { status: 200, body: await deleteTeam({ id: body.id }) }
    case 'team/reset':
      return { status: 200, body: await deleteTeam({ id: body.id }) }
    case 'keys/detect':
      return { status: 200, body: await detectSkillKeys({ skill: body.skill }) }
    case 'keys/add':
      return { status: 200, body: await addKey({ key: body.key ?? body }) }
    case 'keys/remove':
      return { status: 200, body: await removeKey({ env: body.env }) }
    case 'keys/script':
      return { status: 200, body: keyScript(body) }
    case 'skills/preview':
      return { status: 200, body: await previewInstall({ source: body.source }) }
    case 'skills/install':
      return { status: 200, body: await installFromPreview({ source: body.source, names: body.names }) }
    default:
      return { status: 404, body: { ok: false, error: `未知接口：${sub}` } }
  }
}

async function serve(req, res) {
  try {
    // Cross-site writes are refused: the route is loopback-only and carries no
    // credentials of its own, so a browser page on another origin must not be
    // able to register keys or rewrite teams.
    const site = req.headers['sec-fetch-site']
    if (typeof site === 'string' && site.toLowerCase() === 'cross-site') {
      send(res, 403, { ok: false, error: '跨站请求被拒绝' })
      return
    }

    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    const sub = url.pathname.startsWith(API_PREFIX)
      ? url.pathname.slice(API_PREFIX.length).replace(/^\/+/, '')
      : ''
    const method = String(req.method ?? 'GET').toUpperCase()

    let body = {}
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      const raw = await readBody(req)
      if (raw) {
        try {
          body = JSON.parse(raw)
        } catch {
          send(res, 400, { ok: false, error: '请求体不是 JSON' })
          return
        }
      }
    }

    const result = await dispatch(method, sub, body ?? {})
    send(res, result.status, result.body)
  } catch (error) {
    try {
      send(res, 500, { ok: false, error: error?.message ?? String(error) })
    } catch {
      res.destroy()
    }
  }
}

export function apply(ctx) {
  for (const tool of TOOLS) ctx.tools.register(tool)

  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(
      () => webCtx.webServer.register({ kind: 'prefix', path: API_PREFIX, handler: serve }),
      'skill-hub: http api',
    )
  })
}
