

// UI 与动效审核：不依赖浏览器，直接审 client.js 里的样式表与渲染代码。
// 这一组测试盯的是「用户能看见的东西」：弹层几何、动效时长、图标形式、配色对比度。
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { CATEGORIES } from '../lib/classify.js'
import { BUILTIN_TEAMS } from '../lib/teams.js'

const SOURCE = await readFile(new URL('../client.js', import.meta.url), 'utf8')

// ---- 取出样式表：STYLES 数组里的每个字符串 ----
function stylesheet() {
  const start = SOURCE.indexOf('var CSS = [')
  assert.ok(start > 0, '找不到 CSS 数组')
  const end = SOURCE.indexOf('\n    ]', start)
  const block = SOURCE.slice(start, end)
  const rules = []
  const re = /'([^']*)'/g
  let match
  while ((match = re.exec(block))) rules.push(match[1])
  return rules.join('\n')
}

const CSS = stylesheet()

function rule(selector, needle = '') {
  let from = 0
  for (;;) {
    const index = CSS.indexOf(selector + '{', from)
    assert.ok(index >= 0, `样式表里没有 ${selector}${needle ? `（含 ${needle}）` : ''}`)
    const close = CSS.indexOf('}', index)
    const text = CSS.slice(index, close + 1)
    if (!needle || text.includes(needle)) return text
    from = index + 1
  }
}

// ---- WCAG 对比度 ----
function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function themeTokens(mode) {
  const marker = `[data-sh-theme="${mode}"]`
  const index = CSS.indexOf(marker)
  assert.ok(index >= 0, `没有 ${mode} 主题`)
  const end = CSS.indexOf('}', index)
  const block = CSS.slice(index, end)
  const tokens = {}
  const re = /--dsw-alias-([a-z0-9-]+):(#[0-9a-fA-F]{3,8})/g
  let match
  while ((match = re.exec(block))) tokens[match[1]] = match[2]
  return tokens
}

function bundleExports() {
  const loads = []
  const sandbox = {
    window: { __ModuleLoader__: { load: (definition) => loads.push(definition) } },
    document: { head: { appendChild: () => {} }, getElementById: () => null, createElement: () => ({}) },
    navigator: {},
    fetch: async () => ({ json: async () => ({}) }),
    setTimeout,
    clearTimeout,
    console,
  }
  vm.createContext(sandbox)
  vm.runInContext(SOURCE, sandbox, { filename: 'client.js' })
  const react = {
    createElement: () => null,
    Component: class {},
    useState: () => [undefined, () => {}],
    useEffect: () => {},
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn,
    Fragment: 'fragment',
  }
  return loads[0].factory(() => react)
}

// ---------------------------------------------------------------------------
// 1. 弹层几何：百分比 + clamp，且 JS 不再算像素
// ---------------------------------------------------------------------------
test('弹层尺寸是百分比 + clamp(最小, 弹性, 最大)，不是写死像素', () => {
  const menu = rule('.sh-menu', 'position:fixed')
  assert.match(menu, /width:clamp\(/, '宽度必须是 clamp()')
  assert.match(menu, /max-height:min\(/, '高度必须是 min() 百分比上限')
  assert.match(menu, /\d+vw/, '宽度里要出现 vw')
  assert.match(menu, /\d+vh/, '高度里要出现 vh')
  assert.doesNotMatch(menu, /width:\d+px/, '宽度不允许写死像素')
  assert.doesNotMatch(menu, /max-height:\d+px/, '高度不允许写死像素')
})

test('弹层用居中相对定位（left:50% + translateX），不依赖按钮坐标', () => {
  const menu = rule('.sh-menu', 'position:fixed')
  assert.match(menu, /position:fixed/)
  assert.match(menu, /left:50%/)
  assert.match(menu, /transform:translateX\(-50%\)/)
  assert.match(menu, /bottom:clamp\(/, '纵向也要 clamp，不能是固定 px')
})

test('存在窄屏与矮屏兜底，保证任何窗口都不溢出', () => {
  assert.match(CSS, /@media \(max-height:620px\)\{\s*\.sh-menu\{/, '缺少矮屏兜底')
  assert.match(CSS, /@media \(max-width:520px\)\{\s*\.sh-menu\{/, '缺少窄屏兜底')
})

test('client.js 不再用 JS 计算弹层坐标/尺寸', () => {
  for (const banned of ['computeLayout(', 'fitMenu(', 'pos.left', 'pos.width', 'pos.maxHeight', 'setPos(']) {
    assert.equal(SOURCE.includes(banned), false, `仍然残留 JS 几何：${banned}`)
  }
})

// ---------------------------------------------------------------------------
// 2. 动效：一套 token，不许各写各的时长
// ---------------------------------------------------------------------------
test('所有动画/过渡时长来自 --sh-d1/d2/d3', () => {
  const declarations = CSS.match(/(?:animation|transition)(?:-[a-z]+)?:[^;'}]+/g) || []
  const offenders = []
  for (const declaration of declarations) {
    if (/var\(--sh-d[123]\)/.test(declaration)) continue
    if (/animation\s*:\s*none/.test(declaration)) continue
    if (/animation-name\s*:/.test(declaration)) continue
    if (!/\d+m?s/.test(declaration)) continue
    if (/\b0m?s\b/.test(declaration) && !/\d+m?s/.test(declaration.replace(/\b0m?s\b/g, ''))) continue
    offenders.push(declaration.trim())
  }
  assert.deepEqual(offenders, [], `这些动效没有用 token：\n${offenders.join('\n')}`)
})

test('关键帧动效只保留一套弹层入场，且带 reduced-motion 关闭', () => {
  const keyframes = CSS.match(/@keyframes\s+([a-z-]+)/g) || []
  const names = keyframes.map((item) => item.replace(/@keyframes\s+/, '')).sort()
  assert.deepEqual(names, ['sh-menu-in', 'sh-menu-in-narrow', 'sh-soft-in'], `关键帧集合变了：${names.join(', ')}`)
  assert.match(CSS, /prefers-reduced-motion[^}]*\{[^}]*animation:none!important/, 'reduced-motion 必须真的关掉动画')
})

// ---------------------------------------------------------------------------
// 3. 图标：单色矢量，不许 emoji / 图片
// ---------------------------------------------------------------------------
test('渲染代码里不再有 emoji 图标位', () => {
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
  assert.equal(emoji.test(SOURCE), false, '源码里仍然出现 emoji 字符')
  for (const banned of ['sh-team-pill-emoji', 'sh-col-emoji', 'emoji +']) {
    assert.equal(SOURCE.includes(banned), false, `仍然在用 ${banned}`)
  }
})

test('每个分类与每个内置专家团都能映射到一个单色图标', () => {
  const { paths, categories, teams } = bundleExports().__glyphs
  for (const category of CATEGORIES) {
    const name = categories[category.id]
    assert.ok(name, `分类 ${category.id} 没有图标映射`)
    assert.ok(paths[name], `分类 ${category.id} 映射到不存在的图标 ${name}`)
  }
  for (const team of BUILTIN_TEAMS) {
    const name = teams[team.id]
    assert.ok(name, `专家团 ${team.id} 没有图标映射`)
    assert.ok(paths[name], `专家团 ${team.id} 映射到不存在的图标 ${name}`)
  }
})

test('图标只画路径，颜色一律 currentColor', () => {
  const glyph = rule('.sh-glyph')
  assert.match(glyph, /stroke:currentColor/)
  assert.match(glyph, /fill:none/)
  assert.doesNotMatch(glyph, /fill:#|stroke:#/)
})

// ---------------------------------------------------------------------------
// 4. 配色：两套主题都要过对比度，且不能靠彩色底与图标撞色
// ---------------------------------------------------------------------------
for (const mode of ['light', 'dark']) {
  test(`${mode} 主题文字对比度达 WCAG AA`, () => {
    const tokens = themeTokens(mode)
    const surface = tokens['bg-overlay']
    assert.ok(surface, `${mode} 缺少 bg-overlay`)
    const checks = [
      ['label-primary', tokens['label-primary'], 7],
      ['label-secondary', tokens['label-secondary'], 4.5],
      ['brand-primary', tokens['brand-primary'], 4.5],
    ]
    for (const [name, color, minimum] of checks) {
      assert.ok(color, `${mode} 缺少 ${name}`)
      const ratio = contrast(color, surface)
      assert.ok(ratio >= minimum, `${mode} 的 ${name} 对比度 ${ratio.toFixed(2)} 低于 ${minimum}`)
    }
  })

  test(`${mode} 主题的次要文字在 layer-1 上也够读`, () => {
    const tokens = themeTokens(mode)
    const ratio = contrast(tokens['label-secondary'], tokens['bg-layer-1'])
    assert.ok(ratio >= 4.5, `${mode} 的 label-secondary 在 layer-1 上只有 ${ratio.toFixed(2)}`)
  })
}

test('主题切换只重定义 alias token，不写 :root', () => {
  assert.equal(/:root\s*\{[^}]*--dsw-alias/.test(CSS), false, '不能在 :root 上覆盖宿主变量')
  assert.match(CSS, /\.sh-root\[data-sh-theme="light"\]/, '缺少浅色主题作用域')
  assert.match(CSS, /\.sh-menu\[data-sh-theme="dark"\]/, '缺少深色主题作用域')
})

// ---------------------------------------------------------------------------
// 5. 组件里用到的每个类名都要有样式（防止「写了类名但看不见」）
// ---------------------------------------------------------------------------
test('渲染代码里用到的 className 都在样式表里有规则', () => {
  const used = new Set()
  const re = /className:\s*'([^']+)'/g
  let match
  while ((match = re.exec(SOURCE))) {
    for (const name of match[1].split(/\s+/)) {
      if (name && /^sh-/.test(name)) used.add(name)
    }
  }
  const missing = [...used].filter((name) => !CSS.includes('.' + name))
  assert.deepEqual(missing, [], `这些类名没有样式：${missing.join(', ')}`)
})

// ---------------------------------------------------------------------------
// 6. 图标调用约定：glyph(id, kind[, extra])，不允许把 React 当第一个参数
// （曾经写成 glyph(h, id, …) 导致设置页整块抛 "h is not a function"）
// ---------------------------------------------------------------------------
test('图标调用只传 id/kind/extra，不传 React，也不超过三个参数', () => {
  const calls = [...SOURCE.matchAll(/(?<!function )glyph\(([^)]*)\)/g)].map((m) => m[1].trim())
  assert.ok(calls.length >= 5, `调用点太少了：${calls.length}`)
  for (const args of calls) {
    const parts = args.split(',').map((part) => part.trim()).filter(Boolean)
    assert.ok(parts.length <= 3, `glyph 参数过多：glyph(${args})`)
    assert.notEqual(parts[0], 'h', `不允许把 h 传进 glyph：glyph(${args})`)
    assert.notEqual(parts[0], 'react', `不允许把 react 传进 glyph：glyph(${args})`)
  }
  assert.match(SOURCE, /function glyph\(id, kind, extraClass\)/, 'glyph 的签名必须是 (id, kind, extraClass)')
  assert.match(SOURCE, /var h = GLYPH_EL/, 'glyph 必须用工厂里捕获的 createElement')
})

// ---------------------------------------------------------------------------
// 7. 页签切换的高度过渡：三个页的内容高度差很大，弹层必须在固定长度之间插值，
//    不能用 auto（auto 没有可插值的端点，切页签会直接跳）。
// ---------------------------------------------------------------------------
test('弹层高度是长度值并可过渡，三个页签各有一个高度', () => {
  const menuRule =
    [...CSS.matchAll(/\.sh-menu\{([^}]*)\}/g)]
      .map((m) => m[1])
      .find((body) => /position:fixed/.test(body)) || ''
  assert.match(menuRule, /height:min\(|height:clamp\(/, '弹层必须给定长度 height，不能是 auto')
  assert.match(menuRule, /transition:[^;]*height/, '弹层 transition 必须包含 height')
  assert.match(SOURCE, /'data-tab': tab/, '面板要带上当前页签，供 CSS 选高度')

  const perTab = [...SOURCE.matchAll(/\.sh-menu\[data-tab="([a-z]+)"\]\{height:([^}]+)\}/g)]
  assert.ok(perTab.length >= 2, `至少要有两个页签的高度规则，现在 ${perTab.length} 条`)
  for (const [, name, value] of perTab) {
    assert.ok(/^(min|clamp)\(/.test(value.trim()), `页签 ${name} 的高度必须是长度表达式：${value}`)
  }
})

test('reduced-motion 下关掉高度过渡', () => {
  const block = CSS.match(/@media \(prefers-reduced-motion: reduce\)\{([^@]*)\}/)?.[1] || ''
  assert.ok(block.length > 0, '必须存在 prefers-reduced-motion 块')
  assert.match(block, /\.sh-menu\{[^}]*transition:none/, 'reduced-motion 必须把弹层过渡关掉')
})

test('弹层正文区用 flex 撑满并自己滚动，不在面板上再套一层滚动', () => {
  const body = CSS.match(/\.sh-menu-body\{([^}]*)\}/)?.[1] || ''
  assert.match(body, /flex:1 1 auto/, '正文区必须 flex:1 1 auto 才能吃满固定高度')
  assert.match(body, /min-height:0/, '正文区必须 min-height:0，否则 flex 子项不肯收缩')
  assert.match(body, /overflow:auto/, '正文区必须自己滚动')
})

// ---------------------------------------------------------------------------
// 8. 输入框里的入口必须是**一个**模块：技能与安装共用一个边框，
//    安装是图标段，不是第二个独立按钮。
// ---------------------------------------------------------------------------
test('技能与安装是同一个分段控件，安装是图标段', () => {
  const group = CSS.match(/\.sh-dockgroup\{([^}]*)\}/)?.[1] || ''
  assert.match(group, /display:inline-flex/, '分段控件必须是 inline-flex')
  assert.match(group, /border:1px solid/, '两个分段要共用一圈边框，才像一个模块')
  assert.match(group, /overflow:hidden/, '共用边框需要 overflow:hidden 才不会出现双线')

  const seg = CSS.match(/\.sh-dockseg\{([^}]*)\}/)?.[1] || ''
  assert.match(seg, /border:0/, '分段自身不能再画边框')
  assert.ok(/\.sh-dockseg \+ \.sh-dockseg\{border-left:/.test(CSS), '分段之间用一条分隔线')

  // 图标尺寸要对齐输入框里的其它按钮，不能再是 13px 的小一号
  const icon = CSS.match(/\.sh-dockseg svg\{([^}]*)\}/)?.[1] || ''
  assert.match(icon, /width:14px/, `入口图标应与其他按钮同档（14px），现在是：${icon}`)

  assert.match(SOURCE, /className: 'sh-dockseg sh-dockseg-icon'/, '安装段必须同时带分段与图标段样式')
  assert.ok(!/sh-dockbtn-mini/.test(SOURCE), '旧的两个独立按钮（sh-dockbtn-mini）必须移除')
  assert.ok(
    !/className: 'sh-dockbtn'/.test(SOURCE),
    '旧的独立技能按钮（sh-dockbtn）必须移除，改由分段控件承载',
  )
})

test('安装页在「仓库里 0 个 skill」时给出可操作的空态说明', () => {
  const src = SOURCE
  assert.match(src, /preview\.total === 0/, '需要判断 total===0')
  assert.match(src, /这个仓库里没有 SKILL\.md/, '要说明这不是 skill 仓库')
  assert.match(src, /brew install yt-dlp/, '要给出命令行的正确装法示例')
  assert.match(src, /owner\/repo\/tree\/<branch>\/<子目录>/, '要说明子目录写法')
})

test('HTTP 路由先过 DSH 的连接信任校验，再走 sec-fetch-site 兜底', () => {
  return readFile(new URL('../index.js', import.meta.url), 'utf8').then((src) => {
    assert.match(src, /ctx\.inject\(\['connection'\]/, '要注入 connection 服务')
    assert.match(src, /connection\.requestRejection\(req\)/, '要调用 requestRejection')
    assert.match(src, /const rejection = trustRejection\(req\)/, 'handler 开头要先判信任')
    assert.match(src, /sec-fetch-site/, '保留跨站兜底')
  })
})

test('Key 管理已移除：客户端不再读 state.keys / loadAll / keyTool', () => {
  const src = SOURCE
  for (const dead of ['state.keys', 'state.loadAll', 'state.keyTool', 'Key 管理']) {
    assert.equal(src.includes(dead), false, `客户端仍在引用已删除的 key 管理：${dead}`)
  }
  const tabs = src.match(/var TABS = \[([\s\S]*?)\]/)[1]
  assert.equal(/id: 'keys'/.test(tabs), false, 'TABS 里不应再有 keys 页签')
})
