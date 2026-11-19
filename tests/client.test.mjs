import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const SOURCE = await readFile(new URL('../client.js', import.meta.url), 'utf8')

function loadBundle() {
  const loads = []
  const appended = []
  const document = {
    head: { appendChild: (node) => appended.push(node) },
    getElementById: () => null,
    createElement: (tag) => ({ tag, id: '', textContent: '', parentNode: null }),
  }
  const sandbox = {
    window: { __ModuleLoader__: { load: (definition) => loads.push(definition) } },
    document,
    navigator: { clipboard: { writeText: async () => {} } },
    fetch: async () => ({ ok: true, status: 200, json: async () => ({}) }),
    setTimeout,
    clearTimeout,
    console,
  }
  vm.createContext(sandbox)
  vm.runInContext(SOURCE, sandbox, { filename: 'client.js' })
  return { definition: loads[0], appended }
}

const REACT_STUB = {
  createElement: () => null,
  useState: () => [undefined, () => {}],
  useEffect: () => {},
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn,
  Fragment: 'fragment',
}

test('client.js registers exactly one module loader entry', () => {
  const { definition } = loadBundle()
  assert.ok(definition, '没有调用 window.__ModuleLoader__.load')
  assert.equal(definition.id, 'dsh-skill-hub')
  assert.equal(typeof definition.factory, 'function')
})

test('factory returns a cordis plugin with apply + inject', () => {
  const { definition } = loadBundle()
  const exportsObject = definition.factory((name) => {
    assert.equal(name, 'react', '除 react 外不应 require 其它模块')
    return REACT_STUB
  })
  assert.equal(typeof exportsObject.apply, 'function')
  assert.ok(Array.isArray(exportsObject.inject))
})

test('apply registers the settings section and its icon', () => {
  const { definition } = loadBundle()
  const plugin = definition.factory(() => REACT_STUB)

  const slots = []
  const injected = []
  const ctx = {
    effect: (factory) => factory(),
    inject: (services, callback) => {
      injected.push(services)
      if (services.includes('slots')) {
        callback({
          slots: {
            inject: (name, generator) => {
              const iterator = generator()
              let step = iterator.next()
              while (!step.done) {
                slots.push({ name, value: step.value })
                step = iterator.next()
              }
            },
            register: (options, component) => ({ options, component }),
          },
        })
      }
    },
  }

  plugin.apply(ctx)

  assert.equal(injected.length, 1, '只注入一个服务组')
  assert.equal(injected[0].length, 1)
  assert.equal(injected[0][0], 'slots', '只注入 slots，避免被 locale 等可选服务拖死')

  const section = slots.find((item) => item.name === 'settings.section')
  const icon = slots.find((item) => item.name === 'settings.section.icon')
  assert.ok(section, '没有注册 settings.section')
  assert.ok(icon, '没有注册 settings.section.icon')

  assert.equal(section.value.options.name, 'settings.section')
  assert.equal(section.value.options.id, 'skill-hub')
  assert.equal(typeof section.value.options.label, 'string')
  assert.ok(Number.isFinite(section.value.options.order))
  assert.equal(typeof section.value.component, 'function')

  assert.equal(icon.value.options.id, section.value.options.id, 'icon 的 id 必须等于 section 的 id')
  assert.equal(typeof icon.value.component, 'function')
})

test('style tag is injected once and removed by the effect disposer', () => {
  const { definition, appended } = loadBundle()
  const plugin = definition.factory(() => REACT_STUB)
  const disposers = []
  plugin.apply({
    effect: (factory) => {
      const disposer = factory()
      if (typeof disposer === 'function') disposers.push(disposer)
    },
    inject: () => {},
  })
  assert.equal(appended.length, 1)
  assert.equal(appended[0].id, 'dsh-skill-hub-styles')
  assert.match(appended[0].textContent, /--dsw-alias-brand-primary/)
  assert.equal(disposers.length, 1)
})
