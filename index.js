// dsh-skill-hub — host half.
//
// Registers three agent tools and one HTTP route under /skill-hub/api.
// Tool definitions are hand-written "compiled" objects (name / description /
// parameters JSON Schema / output.render / execute) so this bundle needs no
// dependency on @deepseek-ai/dsh-tools and installs from a plain directory.

import {
  buildState, searchSkills, renderTeam, setOverride, saveTeam, deleteTeam,
  addKey, removeKey, keyScript,
} from './lib/hub.js'

export const name = 'skill-hub'
export const inject = ['tools']

const API_PREFIX = '/skill-hub/api'

const text = (value) => [{ type: 'text', text: String(value ?? '') }]

const output = (schema) => ({ schema, render: (_args, value) => text(value) })
const STRING_OUTPUT = output({ type: 'string' })

const TOOLS = [
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
        env: { type: 'string', description: '环境变量名，如 WEREAD_API_KEY。' },
        service: { type: 'string', description: '钥匙串里的服务名，如 weread / amap / baidu-map / openai。' },
        account: { type: 'string', description: '钥匙串里的账号名，默认取当前用户名。' },
        platform: {
          type: 'string',
          enum: ['darwin', 'win32', 'linux'],
          description: '目标平台，留空按当前系统。',
        },
        note: { type: 'string', description: '一句话备注，方便以后认出这是谁的 key。' },
      },
      required: ['env'],
    },
    output: STRING_OUTPUT,
    async execute(args) {
      const script = keyScript({
        env: args?.env,
        service: args?.service,
        account: args?.account,
        platform: args?.platform,
        note: args?.note,
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
  if (sub === '' || sub === 'state') {
    if (method !== 'GET' && method !== 'HEAD') return { status: 405, body: { ok: false, error: '该接口只支持 GET' } }
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
    case 'keys/add':
      return { status: 200, body: await addKey({ key: body.key ?? body }) }
    case 'keys/remove':
      return { status: 200, body: await removeKey({ env: body.env }) }
    case 'keys/script':
      return { status: 200, body: keyScript(body) }
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
