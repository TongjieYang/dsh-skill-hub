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

class FakeComponent {
  constructor(props) {
    this.props = props
    this.state = {}
  }
}

const REACT_STUB = {
  createElement: () => null,
  Component: FakeComponent,
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

function mountPlugin(options = {}) {
  const { definition } = loadBundle()
  const plugin = definition.factory(() => REACT_STUB)
  const slots = []
  const injected = []
  const commands = []
  const opened = []
  const shellStore = { actions: { openSection: (id) => opened.push(id), open: () => opened.push('<open>') } }
  const slotsService = {
    entries: (name) => (name === 'sidebar.settings' ? [{ options: { store: { create: () => shellStore } } }] : []),
    inject: (name, generator) => {
      const iterator = generator()
      let step = iterator.next()
      while (!step.done) {
        slots.push({ name, value: step.value })
        step = iterator.next()
      }
    },
    register: (opts, component) => ({ options: opts, component }),
  }
  const shortcutsService = {
    register: (command) => {
      if (options.conflict && options.conflict(command)) throw new Error('overlapping default binding')
      commands.push(command)
      return () => {}
    },
  }
  const ctx = {
    effect: (factory) => factory(),
    inject: (services, callback) => {
      injected.push(services)
      if (services.includes('slots')) {
        callback({
          slots: slotsService,
          inject: (nested, next) => {
            // a cordis scope exposes the injected service as a property
            next({ shortcuts: shortcutsService, effect: (factory) => factory() })
          },
        })
      }
    },
  }
  plugin.apply(ctx)
  return { slots, injected, commands, opened, shortcutsService }
}

test('apply registers the settings section and its icon', () => {
  const { slots, injected } = mountPlugin()

  assert.equal(injected.length, 1, '只注入一个服务组')
  // arrays built inside the vm have a different realm prototype: compare item by item
  assert.equal(injected[0].length, 1, '直接注入只列 slots，避免被可选服务拖死')
  assert.equal(injected[0][0], 'slots')

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

test('注册一个能直接跳到技能中枢的全局快捷键', () => {
  const { commands, opened } = mountPlugin()
  assert.equal(commands.length, 1, '应当注册且只注册一个命令')
  const command = commands[0]
  assert.equal(command.id, 'skill-hub.open')
  assert.match(String(command.label()), /技能中枢/)
  assert.ok(command.aliases.includes('skills'))
  // 默认键位只给桌面：Web 端 Mod+Alt+<字母> 已被会话搜索等占用，跨 profile 冲突会让整条注册失败
  for (const profile of ['desktop:macos', 'desktop:windows', 'desktop:linux']) {
    const binding = command.defaults[profile]
    assert.ok(binding, `${profile} 应当有默认键位`)
    assert.equal(binding.code, 'KeyK', profile)
    assert.equal(binding.modifiers.length, 2, profile)
    assert.equal(binding.modifiers[0], 'primary', profile)
    assert.equal(binding.modifiers[1], 'shift', profile)
  }
  assert.equal(command.defaults['web:macos'], undefined)
  assert.equal(command.defaults['web:windows'], undefined)
  assert.equal(command.defaults['web:linux'], undefined)
  // 在输入框里也能用，但不能在别的弹窗上抢键
  assert.equal(command.regions.join(','), 'page,editable,terminal')
  assert.equal(command.modals.join(','), 'settings')

  const handled = command.resolve({ modal: null, region: 'editable' })
  assert.equal(handled.status, 'handled')
  handled.run()
  assert.equal(opened.length, 1)
  assert.equal(opened[0], 'skill-hub', '运行时应当打开设置并选中 skill-hub')

  const blocked = command.resolve({ modal: 'other', region: 'page' })
  assert.equal(blocked.status, 'blocked')
})

test('首选键位被占时换下一个候选，全都占了才退化为无键位', () => {
  // K 和 J 都被别的功能占了 → 应该落到 H
  const taken = new Set(['KeyK', 'KeyJ'])
  const { commands } = mountPlugin({
    conflict: (command) => {
      const first = Object.values(command.defaults)[0]
      return !!first && taken.has(first.code)
    },
  })
  assert.ok(commands.length >= 1)
  const accepted = commands[commands.length - 1]
  assert.equal(Object.values(accepted.defaults)[0].code, 'KeyH')

  // 全都被占 → 仍注册命令，只是没有默认键位
  const all = mountPlugin({ conflict: (command) => Object.keys(command.defaults).length > 0 })
  const last = all.commands[all.commands.length - 1]
  assert.equal(Object.keys(last.defaults).length, 0)
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

test('每个 className 在样式表里都有定义', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')

  // Every literal class token used in JSX-ish h(...) calls must exist in the CSS
  // block. Dynamic pieces (`'sh-x' + cond`) only contribute their literal part.
  const tokens = new Set()
  for (const match of source.matchAll(/className:\s*'([^']*)'/g)) {
    for (const token of match[1].split(/\s+/)) {
      // `sev-` is a prefix glued to a runtime value, not a class of its own.
      if (token && !token.includes('+') && !token.endsWith('-')) tokens.add(token)
    }
  }
  assert.ok(tokens.size > 20, `扫描到的类名太少（${tokens.size}），检查正则`)

  const missing = [...tokens].filter((token) => {
    const selector = '.' + token
    return (
      !source.includes(`${selector}{`) &&
      !source.includes(`${selector},`) &&
      !source.includes(`${selector} `) &&
      !source.includes(`${selector}:`)
    )
  })
  assert.deepEqual(missing, [], `这些类名没有对应样式：${missing.join(', ')}`)
})

test('prompt builders produce directly usable text (checked on real descriptions)', () => {
  const { definition } = loadBundle()
  const mod = definition.factory(() => REACT_STUB)
  assert.ok(mod.__prompts && mod.__prompts.skill && mod.__prompts.role)
  const { skill: skillPrompt, role: rolePrompt } = mod.__prompts

  const samples = [
    ['weread-skills', '微信读书助手 — 搜索书籍、管理书架、查看笔记划线、浏览书评、阅读统计、发现推荐好书', '用这个 skill 完成：'],
    ['amap', '通过脚本直连高德 Web Service API 完成地理编码、逆地理编码、IP 定位、天气、路径规划、距离测量和 POI 查询。', '用这个 skill 完成：'],
    ['agent-browser', 'Browser automation for AI agents via inference.sh. Navigate web pages, interact with elements using @e refs.', 'Use this skill to: '],
    ['impeccable', 'Use when the user wants to design, redesign, shape, critique, audit, polish, simplify, harden, animate.', 'Use this skill to: '],
    ['baoyu-image-gen', 'AI image generation with OpenAI GPT Image 2.5, Azure OpenAI, Google, OpenRouter, DashScope.', 'Use this skill to: '],
  ]
  for (const [name, description, marker] of samples) {
    const text = skillPrompt({ name }, description)
    assert.ok(text.startsWith('/' + name + ' '), name)
    assert.ok(text.includes(marker), name + ' → ' + text)
    assert.ok(!text.includes('undefined'), name)
    assert.ok(text.length > name.length + 8, name)
  }
  assert.equal(skillPrompt({ name: 'x' }, ''), '/x ')

  // 域名 / 版本号不能被当成句号切开
  const { sentence } = mod.__prompts
  assert.ok(sentence('Browser automation via inference.sh. Navigate pages.', 160).endsWith('inference.sh.'))
  assert.ok(sentence('AI image generation with GPT Image 2.5, Azure OpenAI.', 160).includes('2.5'))
  assert.ok(sentence('第一句。第二句。', 160) === '第一句。')

  // 团队整本任务书：一次点击就含全部角色/流程/skill/铁律
  const teamPrompt = mod.__prompts.team({
    title: '示例团',
    goal: '把输入做成成品。',
    roles: [
      { id: 'r1', title: '甲', duty: '做第一步。', deliverable: '稿子', skills: ['a', 'b'] },
      { id: 'r2', title: '乙', duty: '', deliverable: '', skills: [] },
    ],
    stages: [
      { id: 's1', title: '开工', deliverable: '稿子', roleIds: ['r1'] },
      { id: 's2', title: '收尾', deliverable: '成片', roleIds: ['r2'] },
    ],
    guardrails: ['不许编造'],
  })
  assert.ok(teamPrompt.includes('按「示例团」这个专家团来做'))
  assert.ok(teamPrompt.includes('甲：做第一步；交付：稿子；用这些 skill：a → b'))
  assert.ok(!teamPrompt.includes('。；'), '职责末尾的句号要先去掉再拼接')
  assert.ok(teamPrompt.includes('1. 开工 — 负责人：甲；产出：稿子'))
  assert.ok(teamPrompt.includes('铁律：不许编造'))
  assert.ok(teamPrompt.includes('三条自检'))
  assert.equal(skillPrompt({}, 'abc'), '')

  const role = rolePrompt(
    { title: '带货视频团' },
    { title: '脚本与钩子', duty: '写 5 条开头', deliverable: '口播稿', skills: ['baokuan-video', 'dbs-hook'] },
  )
  assert.ok(role.includes('按「带货视频团」里「脚本与钩子」这个角色来做。'))
  assert.ok(role.includes('职责：写 5 条开头'))
  assert.ok(role.includes('交付物：口播稿'))
  assert.ok(role.includes('baokuan-video → dbs-hook'))
  assert.ok(role.includes('①产出能独立交付'))
})
