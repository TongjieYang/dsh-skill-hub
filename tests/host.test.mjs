import assert from 'node:assert/strict'
import test from 'node:test'

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

test('注册三个工具，且 schema 只用受支持的键', () => {
  const { ctx, tools } = fakeCtx()
  mod.apply(ctx)
  assert.deepEqual(tools.map((t) => t.name), ['skill_hub_scan', 'skill_hub_team', 'skill_hub_key_script'])
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

test('注册 /skill-hub/api 前缀路由', () => {
  const { ctx, routes } = fakeCtx()
  mod.apply(ctx)
  assert.equal(routes.length, 1)
  assert.equal(routes[0].kind, 'prefix')
  assert.equal(routes[0].path, '/skill-hub/api')
  assert.equal(typeof routes[0].resource, 'function')
})

test('GET /state 返回 200 JSON', async () => {
  const { ctx, routes } = fakeCtx()
  mod.apply(ctx)
  const response = await routes[0].resource(
    new Request('http://127.0.0.1/skill-hub/api/state', { method: 'GET' }),
  )
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /application\/json/)
  const body = await response.json()
  assert.ok(Array.isArray(body.skills))
  assert.ok(Array.isArray(body.teams))
  assert.ok(Array.isArray(body.keys))
  assert.ok(Array.isArray(body.categories))
  assert.equal(body.categories.length, 10)
})

test('未知接口返回 404，非 GET/POST 返回 405', async () => {
  const { ctx, routes } = fakeCtx()
  mod.apply(ctx)
  const missing = await routes[0].resource(new Request('http://127.0.0.1/skill-hub/api/nope', { method: 'POST', body: '{}' }))
  assert.equal(missing.status, 404)
  const bad = await routes[0].resource(new Request('http://127.0.0.1/skill-hub/api/state', { method: 'DELETE' }))
  assert.equal(bad.status, 405)
})

test('skill_hub_key_script 只产出占位符模板', async () => {
  const { ctx, tools } = fakeCtx()
  mod.apply(ctx)
  const tool = tools.find((t) => t.name === 'skill_hub_key_script')
  const text = await tool.execute({ env: 'WEREAD_API_KEY', service: 'weread', account: 'tester', platform: 'darwin' })
  assert.match(text, /__SECRET__/)
  assert.match(text, /security add-generic-password/)
  const rendered = tool.output.render({}, text)
  assert.equal(rendered[0].type, 'text')
  assert.equal(rendered[0].text, text)
})
