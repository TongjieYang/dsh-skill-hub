import assert from 'node:assert/strict'
import test from 'node:test'
import http from 'node:http'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'

process.env.DSH_SKILL_HUB_DIR = new URL('../.tmp-test-hub', import.meta.url).pathname

const mod = await import('../index.js')

const ALLOWED = new Set([
  'type', 'properties', 'required', 'items', 'enum', 'const', 'additionalProperties', 'description',
])

function assertSupportedSchema(schema, where) {
  assert.ok(schema && typeof schema === 'object', `${where}: schema 必须是对象`)
  for (const key of Object.keys(schema)) {
    assert.ok(ALLOWED.has(key), `${where}: 不受支持的 schema 键 ${key}`)
  }
  assert.ok(typeof schema.type === 'string', `${where}: type 必须是单个字符串`)
  if (schema.properties) {
    assert.equal(schema.type, 'object', `${where}: 只有 object 才能有 properties`)
    for (const [name, child] of Object.entries(schema.properties)) {
      assertSupportedSchema(child, `${where}.${name}`)
    }
  }
  if (schema.items) assertSupportedSchema(schema.items, `${where}[]`)
}

function fakeCtx() {
  const tools = []
  const routes = []
  const effects = []
  const runEffect = (factory, label) => {
    const disposer = factory()
    effects.push({ disposer, label })
    return disposer
  }
  const ctx = {
    tools: { register: (definition) => tools.push(definition) },
    effect: runEffect,
    inject: (services, callback) => {
      if (services.includes('webServer')) {
        callback({
          effect: runEffect,
          webServer: { register: (route) => { routes.push(route); return () => {} } },
        })
      }
    },
  }
  return { ctx, tools, routes, effects }
}

test('导出契约：name / inject / apply', () => {
  assert.equal(mod.name, 'skill-hub')
  assert.deepEqual(mod.inject, ['tools'])
  assert.equal(typeof mod.apply, 'function')
})

test('注册六个工具，且 schema 只用受支持的键', () => {
  const { ctx, tools } = fakeCtx()
  mod.apply(ctx)
  assert.deepEqual(tools.map((t) => t.name), [
    'skill_hub_profile',
    'skill_hub_audit',
    'skill_hub_scan',
    'skill_hub_team',
    'skill_hub_team_export',
    'skill_hub_key_script',
    'skill_hub_install_skill',
  ])
  for (const tool of tools) {
    assert.equal(typeof tool.description, 'string')
    assert.ok(tool.description.length > 20, `${tool.name}: 描述太短`)
    assertSupportedSchema(tool.parameters, `${tool.name}.parameters`)
    assert.ok(tool.output && typeof tool.output.render === 'function', `${tool.name}: 缺 output.render`)
    assertSupportedSchema(tool.output.schema, `${tool.name}.output.schema`)
    assert.equal(typeof tool.execute, 'function')
  }
})

test('工具参数里没有 secret 之类的入参位', () => {
  const { ctx, tools } = fakeCtx()
  mod.apply(ctx)
  for (const tool of tools) {
    const names = Object.keys(tool.parameters.properties ?? {})
    for (const name of names) {
      assert.ok(!/secret|token|password|apikey|api_key/i.test(name), `${tool.name}: 不应接受 ${name}`)
    }
  }
})

/**
 * Drive the route's Node-style `handler(req, res)`. A `resource(request)` route
 * cannot serve POST at all — the webserver answers 405 before reading the body —
 * so every mutation goes through this shape and the test has to match it.
 */
function callRoute(route, { method = 'GET', path = '/skill-hub/api/state', body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const listeners = new Map()
    const req = {
      method,
      url: path,
      headers,
      on(event, fn) {
        const list = listeners.get(event) ?? []
        list.push(fn)
        listeners.set(event, list)
        return req
      },
      destroy() {},
    }
    const finish = (payload) => {
      const raw = payload === undefined || payload === null ? '' : String(payload)
      let parsed = null
      try {
        parsed = raw ? JSON.parse(raw) : null
      } catch (error) {
        reject(new Error(`响应不是 JSON：${raw.slice(0, 120)}`))
        return
      }
      resolve({ status: res.status, headers: res.headers, body: parsed })
    }
    const res = {
      status: 0,
      headers: {},
      writeHead(status, headers) {
        res.status = status
        res.headers = headers ?? {}
      },
      end: finish,
      destroy() {
        resolve({ status: 0, headers: {}, body: null })
      },
    }
    route.handler(req, res)
    setImmediate(() => {
      if (body !== undefined) {
        const chunk = Buffer.from(JSON.stringify(body))
        for (const fn of listeners.get('data') ?? []) fn(chunk)
      }
      for (const fn of listeners.get('end') ?? []) fn()
    })
  })
}

test('注册 /skill-hub/api 前缀路由，且用 handler 而不是 resource', () => {
  const { ctx, routes } = fakeCtx()
  mod.apply(ctx)
  assert.equal(routes.length, 1)
  assert.equal(routes[0].kind, 'prefix')
  assert.equal(routes[0].path, '/skill-hub/api')
  assert.equal(typeof routes[0].handler, 'function', 'POST 需要 handler(req,res)；resource 只收 GET/HEAD')
  assert.equal(routes[0].resource, undefined)
})

test('GET /state 返回 200 JSON', async () => {
  const { ctx, routes } = fakeCtx()
  mod.apply(ctx)
  const response = await callRoute(routes[0])
  assert.equal(response.status, 200)
  assert.match(String(response.headers['content-type']), /application\/json/)
  assert.ok(Array.isArray(response.body.skills))
  assert.ok(Array.isArray(response.body.teams))
  assert.ok(Array.isArray(response.body.keys))
  assert.ok(Array.isArray(response.body.categories))
  assert.equal(response.body.categories.length, 12)
})

test('GET /audit 返回体检结果', async () => {
  const { ctx, routes } = fakeCtx()
  mod.apply(ctx)
  const response = await callRoute(routes[0], { path: '/skill-hub/api/audit' })
  assert.equal(response.status, 200, JSON.stringify(response.body))
  assert.equal(response.body.ok, true)
  assert.equal(typeof response.body.skillCount, 'number')
  assert.ok(response.body.bySeverity && typeof response.body.bySeverity.high === 'number')
  assert.ok(Array.isArray(response.body.findings))
})

test('HEAD/其它方法打 /audit 一律 405', async () => {
  const { ctx, routes } = fakeCtx()
  mod.apply(ctx)
  const response = await callRoute(routes[0], { method: 'POST', path: '/skill-hub/api/audit' })
  assert.equal(response.status, 405)
})

test('POST /keys/add 登记元数据并给出占位符脚本', async () => {
  const { ctx, routes } = fakeCtx()
  mod.apply(ctx)
  const response = await callRoute(routes[0], {
    method: 'POST',
    path: '/skill-hub/api/keys/add',
    headers: { 'content-type': 'application/json' },
    body: { key: { env: 'WEREAD_API_KEY', service: 'weread', account: 'tester', platform: 'darwin' } },
  })
  assert.equal(response.status, 200)
  assert.equal(response.body.ok, true)
  assert.match(response.body.script.add, /__SECRET__/)
  assert.doesNotMatch(response.body.script.addPrompt, /__SECRET__/)
  assert.match(response.body.script.add, /security add-generic-password/)
  assert.equal(response.body.key.env, 'WEREAD_API_KEY')
  assert.ok(!('secret' in response.body.key), '登记项里不能出现 secret 字段')
})

test('POST /keys/add 带上 shell 时按该 shell 生成 export 与持久化文件', async () => {
  const { ctx, routes } = fakeCtx()
  mod.apply(ctx)
  const response = await callRoute(routes[0], {
    method: 'POST',
    path: '/skill-hub/api/keys/add',
    headers: { 'content-type': 'application/json' },
    body: { key: { env: 'WEREAD_API_KEY', service: 'weread', account: 'tester', platform: 'darwin', shell: 'fish' } },
  })
  assert.equal(response.status, 200)
  assert.match(response.body.script.export, /^set -gx WEREAD_API_KEY /)
  assert.equal(response.body.script.persist.fileLabel, '~/.config/fish/config.fish')
  assert.equal(response.body.key.shell, 'fish')
})

test('POST /keys/script 接受 shell 且返回 persist 块', async () => {
  const { ctx, routes } = fakeCtx()
  mod.apply(ctx)
  const response = await callRoute(routes[0], {
    method: 'POST',
    path: '/skill-hub/api/keys/script',
    headers: { 'content-type': 'application/json' },
    body: { env: 'ARK_API_KEY', service: 'ark', account: 'tester', platform: 'darwin', shell: 'zsh' },
  })
  assert.equal(response.status, 200)
  assert.equal(response.body.ok, true)
  // /keys/script flattens the script onto the response (ok + env + export + …)
  assert.match(response.body.export, /^export ARK_API_KEY="\$\(security find-generic-password/)
  assert.equal(response.body.persist.fileLabel, '~/.zshenv')
})

test('POST /classify 写入分类覆盖', async () => {
  const { ctx, routes } = fakeCtx()
  mod.apply(ctx)
  const response = await callRoute(routes[0], {
    method: 'POST',
    path: '/skill-hub/api/classify',
    headers: { 'content-type': 'application/json' },
    body: { name: 'weread-skills', category: 'commerce-ops' },
  })
  assert.equal(response.status, 200)
  assert.equal(response.body.category, 'commerce-ops')
  const state = await callRoute(routes[0])
  const skill = state.body.skills.find((item) => item.name === 'weread-skills')
  if (skill) assert.equal(skill.category, 'commerce-ops')
})

test('未知接口 404、错方法 405、跨站 403、坏 JSON 400', async () => {
  const { ctx, routes } = fakeCtx()
  mod.apply(ctx)
  const missing = await callRoute(routes[0], { method: 'POST', path: '/skill-hub/api/nope', body: {} })
  assert.equal(missing.status, 404)
  const badMethod = await callRoute(routes[0], { method: 'DELETE', path: '/skill-hub/api/state' })
  assert.equal(badMethod.status, 405)
  const crossSite = await callRoute(routes[0], {
    method: 'POST',
    path: '/skill-hub/api/keys/add',
    headers: { 'sec-fetch-site': 'cross-site' },
    body: {},
  })
  assert.equal(crossSite.status, 403)
})

test('真实 http 上 POST 也能拿到 200（不只是假 req/res）', async () => {
  const { ctx, routes } = fakeCtx()
  mod.apply(ctx)
  const route = routes[0]
  const server = http.createServer((req, res) => route.handler(req, res))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  const base = `http://127.0.0.1:${port}/skill-hub/api`

  try {
    const added = await fetch(`${base}/keys/add`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify({ key: { env: 'AMAP_KEY', service: 'amap', account: 'tester', platform: 'darwin' } }),
    })
    assert.equal(added.status, 200)
    const body = await added.json()
    assert.equal(body.ok, true)
    assert.match(body.script.add, /__SECRET__/)

    const state = await fetch(`${base}/state`).then((r) => r.json())
    assert.ok(state.keys.some((entry) => entry.env === 'AMAP_KEY'))

    const removed = await fetch(`${base}/keys/remove`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ env: 'AMAP_KEY' }),
    })
    assert.equal(removed.status, 200)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('POST /keys/detect：从选中 skill 的正文里找出变量名', async () => {
  const hubDir = process.env.DSH_SKILL_HUB_DIR
  const fixture = join(hubDir, 'fixture-root')
  await mkdir(join(fixture, 'demo-skill'), { recursive: true })
  await writeFile(join(fixture, 'demo-skill', 'SKILL.md'), '---\nname: demo-skill\ndescription: 用来测检测\n---\n\n先 export FIXTURE_API_KEY=xxx\n', 'utf8')
  await writeFile(join(hubDir, 'config.json'), JSON.stringify({
    version: 1,
    overrides: {},
    roots: [{ path: fixture, label: 'test', rank: 100, title: '测试根' }],
    keys: [],
    settings: {},
  }), 'utf8')

  try {
    const { ctx, routes } = fakeCtx()
    mod.apply(ctx)
    const response = await callRoute(routes[0], {
      method: 'POST',
      path: '/skill-hub/api/keys/detect',
      body: { skill: 'demo-skill' },
    })
    assert.equal(response.status, 200)
    assert.equal(response.body.ok, true)
    assert.equal(response.body.skill.name, 'demo-skill')
    assert.ok(response.body.vars.some((item) => item.env === 'FIXTURE_API_KEY'))
    assert.ok(response.body.vars[0].service, '应给出建议的服务名')

    const missing = await callRoute(routes[0], {
      method: 'POST',
      path: '/skill-hub/api/keys/detect',
      body: { skill: 'not-here' },
    })
    assert.equal(missing.body.ok, false)
    assert.match(missing.body.error, /没有这个 skill/)
  } finally {
    await rm(join(hubDir, 'config.json'), { force: true })
    await rm(fixture, { recursive: true, force: true })
  }
})

test('POST /skills/preview 拒绝本地路径；/skills/install 没预览就报错', async () => {
  const { ctx, routes } = fakeCtx()
  mod.apply(ctx)

  const bad = await callRoute(routes[0], { method: 'POST', path: '/skill-hub/api/skills/preview', body: { source: '/tmp/x' } })
  assert.equal(bad.body.ok, false)
  assert.match(bad.body.error, /本地路径/)

  const orphan = await callRoute(routes[0], { method: 'POST', path: '/skill-hub/api/skills/install', body: { source: 'o/r', names: ['x'] } })
  assert.equal(orphan.body.ok, false)
  assert.match(orphan.body.error, /预览/)
})
