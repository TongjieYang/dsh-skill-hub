// dsh-skill-hub — browser half.
//
// Hand-written lazy-CJS bundle (window.__ModuleLoader__.load with a factory
// returning cordis-plugin exports): no build step, no imports from dsh client
// packages except React from the module table. Registers one settings section
// ("技能中枢") plus its nav icon.
//
// The secret typed into Key 管理 never leaves this file's React state: the
// host hands back a script containing the literal placeholder __SECRET__ and
// the substitution happens here, for display and clipboard only.

window.__ModuleLoader__.load({
  id: 'dsh-skill-hub',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports

    var API = '/skill-hub/api'
    var PLACEHOLDER = '__SECRET__'
    var STYLE_ID = 'dsh-skill-hub-styles'

    var CSS = [
      '.sh-root{display:flex;flex-direction:column;height:100%;min-height:0;color:var(--dsw-alias-label-primary,#1a1a1a);font-size:13px;line-height:1.5}',
      '.sh-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:2px 0 10px}',
      '.sh-title{margin:0;font-size:17px;font-weight:600;letter-spacing:.2px}',
      '.sh-sub{margin:3px 0 0;color:var(--dsw-alias-label-secondary,#6b7280);font-size:12px}',
      '.sh-tabs{display:flex;gap:2px;border-bottom:1px solid var(--dsw-alias-border-l1,#e6e8eb);margin-bottom:12px;flex-wrap:wrap}',
      '.sh-tab{appearance:none;background:none;border:0;border-bottom:2px solid transparent;padding:7px 11px;margin-bottom:-1px;cursor:pointer;color:var(--dsw-alias-label-secondary,#6b7280);font-size:13px;font-family:inherit}',
      '.sh-tab:hover{color:var(--dsw-alias-label-primary,#1a1a1a)}',
      '.sh-tab.on{color:var(--dsw-alias-brand-primary,#2563eb);border-bottom-color:var(--dsw-alias-brand-primary,#2563eb);font-weight:600}',
      '.sh-body{flex:1;min-height:0;overflow:auto;padding-right:4px}',
      '.sh-btn{appearance:none;font-family:inherit;font-size:12px;padding:5px 10px;border-radius:6px;cursor:pointer;border:1px solid var(--dsw-alias-border-l2,#d5d9e0);background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1a1a1a)}',
      '.sh-btn:hover{border-color:var(--dsw-alias-brand-primary,#2563eb);color:var(--dsw-alias-brand-primary,#2563eb)}',
      '.sh-btn.primary{background:var(--dsw-alias-brand-primary,#2563eb);border-color:transparent;color:#fff}',
      '.sh-btn.primary:hover{opacity:.9;color:#fff}',
      '.sh-btn.danger{color:var(--dsw-alias-state-error-primary,#dc2626);border-color:var(--dsw-alias-border-l2,#d5d9e0)}',
      '.sh-btn:disabled{opacity:.45;cursor:not-allowed}',
      '.sh-input,.sh-select,.sh-area{width:100%;box-sizing:border-box;font-family:inherit;font-size:13px;padding:6px 9px;border-radius:6px;border:1px solid var(--dsw-alias-border-l2,#d5d9e0);background:var(--dsw-alias-bg-layer-1,#fff);color:inherit}',
      '.sh-input:focus,.sh-area:focus,.sh-select:focus{outline:none;border-color:var(--dsw-alias-brand-primary,#2563eb)}',
      '.sh-area{min-height:300px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.5;resize:vertical}',
      '.sh-chips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}',
      '.sh-chip{appearance:none;font-family:inherit;font-size:12px;padding:4px 9px;border-radius:999px;cursor:pointer;border:1px solid var(--dsw-alias-border-l1,#e6e8eb);background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-secondary,#6b7280)}',
      '.sh-chip.on{background:var(--dsw-alias-brand-primary,#2563eb);border-color:transparent;color:#fff}',
      '.sh-chip .n{opacity:.7;margin-left:4px;font-variant-numeric:tabular-nums}',
      '.sh-list{display:flex;flex-direction:column;gap:1px}',
      '.sh-item{padding:7px 9px;border-radius:6px;border:1px solid transparent}',
      '.sh-item:hover{background:var(--dsw-alias-bg-layer-2,#f4f6f8)}',
      '.sh-item-top{display:flex;align-items:center;gap:8px;justify-content:space-between}',
      '.sh-name{font-weight:600;font-size:13px}',
      '.sh-desc{color:var(--dsw-alias-label-secondary,#6b7280);font-size:12px;margin-top:1px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
      '.sh-badges{display:flex;gap:4px;align-items:center;flex-shrink:0}',
      '.sh-badge{font-size:11px;padding:1px 6px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1,#e6e8eb);color:var(--dsw-alias-label-secondary,#6b7280);white-space:nowrap}',
      '.sh-badge.auto{border-color:var(--dsw-alias-brand-primary,#2563eb);color:var(--dsw-alias-brand-primary,#2563eb)}',
      '.sh-badge.warn{border-color:var(--dsw-alias-state-warn-primary,#d97706);color:var(--dsw-alias-state-warn-primary,#d97706)}',
      '.sh-card{border:1px solid var(--dsw-alias-border-l1,#e6e8eb);border-radius:8px;padding:10px 12px;margin-bottom:8px;background:var(--dsw-alias-bg-layer-1,#fff)}',
      '.sh-card h4{margin:0 0 4px;font-size:13px}',
      '.sh-card p{margin:0 0 4px;color:var(--dsw-alias-label-secondary,#6b7280);font-size:12px}',
      '.sh-kv{display:grid;grid-template-columns:88px 1fr;gap:2px 10px;font-size:12px;margin-top:6px}',
      '.sh-kv dt{color:var(--dsw-alias-label-secondary,#6b7280)}',
      '.sh-kv dd{margin:0}',
      '.sh-flow{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 0}',
      '.sh-step{font-size:11px;padding:2px 8px;border-radius:999px;background:var(--dsw-alias-bg-layer-2,#f4f6f8);color:var(--dsw-alias-label-secondary,#6b7280)}',
      '.sh-sec-title{font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary,#6b7280);text-transform:none;letter-spacing:.4px;margin:14px 0 6px}',
      '.sh-note{font-size:12px;padding:8px 10px;border-radius:6px;margin:0 0 10px;border:1px solid var(--dsw-alias-border-l1,#e6e8eb);background:var(--dsw-alias-bg-layer-2,#f4f6f8);color:var(--dsw-alias-label-secondary,#6b7280)}',
      '.sh-note.warn{border-color:var(--dsw-alias-state-warn-primary,#d97706);color:var(--dsw-alias-state-warn-primary,#d97706);background:transparent}',
      '.sh-note.err{border-color:var(--dsw-alias-state-error-primary,#dc2626);color:var(--dsw-alias-state-error-primary,#dc2626);background:transparent}',
      '.sh-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
      '.sh-field{display:flex;flex-direction:column;gap:3px;font-size:12px;margin-bottom:8px}',
      '.sh-field label{color:var(--dsw-alias-label-secondary,#6b7280)}',
      '.sh-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;white-space:pre-wrap;word-break:break-all;background:var(--dsw-alias-bg-layer-2,#f4f6f8);border:1px solid var(--dsw-alias-border-l1,#e6e8eb);border-radius:6px;padding:8px 10px;margin:0;max-height:180px;overflow:auto}',
      '.sh-code-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:10px 0 4px}',
      '.sh-code-head span{font-size:12px;color:var(--dsw-alias-label-secondary,#6b7280)}',
      '.sh-empty{padding:24px 0;text-align:center;color:var(--dsw-alias-label-secondary,#6b7280);font-size:12px}',
      '.sh-rowline{display:flex;align-items:center;gap:8px}',
      '.sh-spacer{flex:1}',
      '.sh-scroll-x{overflow-x:auto}',
    ].join('\n')

    function ensureStyles() {
      if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
      var style = document.createElement('style')
      style.id = STYLE_ID
      style.textContent = CSS
      document.head.appendChild(style)
    }

    function dropStyles() {
      if (typeof document === 'undefined') return
      var node = document.getElementById(STYLE_ID)
      if (node && node.parentNode) node.parentNode.removeChild(node)
    }

    function makeIcon(React) {
      var h = React.createElement
      return function Icon(props) {
        var size = (props && props.size) || 16
        var color = props && props.active ? 'var(--dsw-alias-brand-primary,#2563eb)' : 'currentColor'
        return h(
          'svg',
          {
            width: size,
            height: size,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: color,
            strokeWidth: 1.7,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            'aria-hidden': 'true',
          },
          h('path', { d: 'M4 6h7v5H4z' }),
          h('path', { d: 'M13 6h7v5h-7z' }),
          h('path', { d: 'M4 13h7v5H4z' }),
          h('path', { d: 'M13 13h7v5h-7z' }),
        )
      }
    }

    function makeSection(React) {
      var h = React.createElement
      var useState = React.useState
      var useEffect = React.useEffect
      var useMemo = React.useMemo

      async function api(path, body) {
        var options = body === undefined ? {} : {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }
        var response = await fetch(API + '/' + path, options)
        var data = null
        try {
          data = await response.json()
        } catch (error) {
          throw new Error('接口返回的不是 JSON（HTTP ' + response.status + '）')
        }
        if (!response.ok || data.ok === false) throw new Error((data && data.error) || 'HTTP ' + response.status)
        return data
      }

      function copyText(value) {
        if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(value)
        return Promise.reject(new Error('当前环境不支持剪贴板'))
      }

      function short(text, max) {
        var one = String(text || '').replace(/\s+/g, ' ').trim()
        return one.length > max ? one.slice(0, max - 1) + '…' : one
      }

      var TABS = [
        { id: 'overview', label: '技能总览' },
        { id: 'classify', label: '分类整理' },
        { id: 'teams', label: '专家团' },
        { id: 'keys', label: 'Key 管理' },
      ]

      function Overview(props) {
        var state = props.state
        var [query, setQuery] = useState('')
        var [category, setCategory] = useState('')
        var skills = state.skills
        var filtered = useMemo(function () {
          var needle = query.trim().toLowerCase()
          return skills.filter(function (skill) {
            if (category && skill.category !== category) return false
            if (!needle) return true
            return (
              skill.name.toLowerCase().indexOf(needle) >= 0 ||
              String(skill.description || '').toLowerCase().indexOf(needle) >= 0
            )
          })
        }, [skills, query, category])
        var shown = filtered.slice(0, 300)

        return h(
          'div',
          null,
          h('input', {
            className: 'sh-input',
            placeholder: '搜索 skill 名或描述，例如 视频 / lark / 地图',
            value: query,
            onChange: function (event) { setQuery(event.target.value) },
            style: { marginBottom: '10px' },
          }),
          h(
            'div',
            { className: 'sh-chips' },
            h(
              'button',
              {
                type: 'button',
                className: 'sh-chip' + (category === '' ? ' on' : ''),
                onClick: function () { setCategory('') },
              },
              '全部',
              h('span', { className: 'n' }, String(skills.length)),
            ),
            state.categories.map(function (item) {
              if (!item.count) return null
              return h(
                'button',
                {
                  key: item.id,
                  type: 'button',
                  className: 'sh-chip' + (category === item.id ? ' on' : ''),
                  onClick: function () { setCategory(category === item.id ? '' : item.id) },
                },
                item.emoji + ' ' + item.zh,
                h('span', { className: 'n' }, String(item.count)),
              )
            }),
          ),
          h(
            'div',
            { className: 'sh-sub', style: { marginBottom: '6px' } },
            '命中 ' + filtered.length + ' 条' + (filtered.length > shown.length ? '，显示前 ' + shown.length + ' 条' : ''),
          ),
          h(
            'div',
            { className: 'sh-list' },
            shown.map(function (skill) {
              var cat = state.categories.find(function (c) { return c.id === skill.category })
              return h(
                'div',
                { key: skill.name + skill.dir, className: 'sh-item' },
                h(
                  'div',
                  { className: 'sh-item-top' },
                  h('span', { className: 'sh-name' }, skill.name),
                  h(
                    'span',
                    { className: 'sh-badges' },
                    skill.overridden ? h('span', { className: 'sh-badge auto' }, '手动') : null,
                    skill.container ? h('span', { className: 'sh-badge warn' }, '容器') : null,
                    h('span', { className: 'sh-badge' }, cat ? cat.zh : skill.category),
                    h('span', { className: 'sh-badge' }, skill.source),
                  ),
                ),
                skill.description ? h('div', { className: 'sh-desc' }, skill.description) : null,
              )
            }),
            shown.length === 0 ? h('div', { className: 'sh-empty' }, '没有符合条件的 skill') : null,
          ),
          state.containers.length
            ? h(
                'div',
                null,
                h('div', { className: 'sh-sec-title' }, '容器目录（内部含 skill，不单独计）'),
                state.containers.map(function (item) {
                  return h(
                    'div',
                    { key: item.dir, className: 'sh-item' },
                    h('div', { className: 'sh-rowline' }, h('span', { className: 'sh-name' }, item.dir.split('/').pop()), h('span', { className: 'sh-badge' }, item.children + ' 个')),
                  )
                }),
              )
            : null,
          state.shadowed.length
            ? h(
                'div',
                null,
                h('div', { className: 'sh-sec-title' }, '同名被遮蔽（rank 低者生效）'),
                state.shadowed.map(function (item) {
                  return h(
                    'div',
                    { key: item.dir, className: 'sh-item' },
                    h(
                      'div',
                      { className: 'sh-rowline' },
                      h('span', { className: 'sh-name' }, item.name),
                      h('span', { className: 'sh-badge' }, item.source + ' → 已用 ' + item.keptFrom),
                    ),
                  )
                }),
              )
            : null,
        )
      }

      function Classify(props) {
        var state = props.state
        var [busy, setBusy] = useState('')
        var [error, setError] = useState('')
        var [expanded, setExpanded] = useState('')
        var groups = useMemo(function () {
          return state.categories
            .map(function (cat) {
              return {
                cat: cat,
                items: state.skills.filter(function (s) { return s.category === cat.id }),
              }
            })
            .filter(function (group) { return group.items.length > 0 })
        }, [state.skills, state.categories])

        async function move(skill, next) {
          setBusy(skill.name)
          setError('')
          try {
            await api('classify', { name: skill.name, category: next })
            await props.reload()
          } catch (failure) {
            setError(failure.message)
          } finally {
            setBusy('')
          }
        }

        return h(
          'div',
          null,
          h('div', { className: 'sh-note' }, '自动分类按「名前缀规则 + 描述关键词」打分；你手动改过的条目会写入 config.json，永远优先于自动结果。'),
          error ? h('div', { className: 'sh-note err' }, error) : null,
          groups.map(function (group) {
            var open = expanded === '' || expanded === group.cat.id
            return h(
              'div',
              { key: group.cat.id, style: { marginBottom: '6px' } },
              h(
                'button',
                {
                  type: 'button',
                  className: 'sh-rowline',
                  onClick: function () { setExpanded(open && expanded === group.cat.id ? 'none' : group.cat.id) },
                  style: { background: 'none', border: 0, padding: '6px 0', cursor: 'pointer', width: '100%', font: 'inherit', color: 'inherit' },
                },
                h('span', { className: 'sh-name' }, group.cat.emoji + ' ' + group.cat.zh),
                h('span', { className: 'sh-badge' }, String(group.items.length)),
                h('span', { className: 'sh-spacer' }),
                h('span', { className: 'sh-sub' }, open ? '收起' : '展开'),
              ),
              open
                ? h(
                    'div',
                    { className: 'sh-list', style: { marginLeft: '8px' } },
                    group.items.map(function (skill) {
                      return h(
                        'div',
                        { key: skill.name, className: 'sh-item' },
                        h(
                          'div',
                          { className: 'sh-item-top' },
                          h('span', { className: 'sh-name' }, skill.name),
                          h(
                            'span',
                            { className: 'sh-badges' },
                            skill.overridden ? h('span', { className: 'sh-badge auto' }, '手动') : null,
                            h(
                              'select',
                              {
                                className: 'sh-select',
                                style: { width: 'auto', padding: '2px 6px', fontSize: '11px' },
                                value: skill.category,
                                disabled: busy === skill.name,
                                onChange: function (event) { move(skill, event.target.value) },
                              },
                              state.categories.map(function (cat) {
                                return h('option', { key: cat.id, value: cat.id }, cat.zh)
                              }),
                            ),
                            skill.overridden
                              ? h(
                                  'button',
                                  {
                                    type: 'button',
                                    className: 'sh-btn',
                                    style: { padding: '1px 7px', fontSize: '11px' },
                                    onClick: function () { move(skill, '') },
                                  },
                                  '恢复自动',
                                )
                              : null,
                          ),
                        ),
                      )
                    }),
                  )
                : null,
            )
          }),
        )
      }

      function Teams(props) {
        var state = props.state
        var [selectedId, setSelectedId] = useState(state.teams.length ? state.teams[0].id : '')
        var [draft, setDraft] = useState(null)
        var [error, setError] = useState('')
        var [busy, setBusy] = useState(false)
        var selected = state.teams.find(function (t) { return t.id === selectedId }) || state.teams[0]

        useEffect(function () {
          setDraft(null)
          setError('')
        }, [selectedId])

        async function save() {
          setBusy(true)
          setError('')
          try {
            var parsed = JSON.parse(draft)
            var result = await api('team/save', { team: parsed })
            setDraft(null)
            setSelectedId(result.team.id)
            await props.reload()
          } catch (failure) {
            setError(failure.message)
          } finally {
            setBusy(false)
          }
        }

        async function remove() {
          if (!selected || selected.builtin) return
          setBusy(true)
          setError('')
          try {
            await api('team/delete', { id: selected.id })
            setSelectedId('')
            await props.reload()
          } catch (failure) {
            setError(failure.message)
          } finally {
            setBusy(false)
          }
        }

        async function reset() {
          setBusy(true)
          setError('')
          try {
            await api('team/reset', { id: selected.id })
            setDraft(null)
            await props.reload()
          } catch (failure) {
            setError(failure.message)
          } finally {
            setBusy(false)
          }
        }

        function createNew() {
          var template = {
            id: '',
            title: '新专家团',
            emoji: '🧩',
            goal: '一句话说清这个团要交付什么',
            roles: [{ id: 'role-1', title: '角色名', duty: '这个角色负责什么', skills: [], deliverable: '交付物' }],
            stages: [{ id: 's1', title: '阶段一', deliverable: '交付物', roleIds: ['role-1'] }],
            guardrails: ['一条不容违反的规则'],
          }
          setSelectedId('')
          setDraft(JSON.stringify(template, null, 2))
        }

        return h(
          'div',
          null,
          h(
            'div',
            { className: 'sh-chips' },
            state.teams.map(function (team) {
              return h(
                'button',
                {
                  key: team.id,
                  type: 'button',
                  className: 'sh-chip' + (selected && selected.id === team.id ? ' on' : ''),
                  onClick: function () { setSelectedId(team.id) },
                },
                team.emoji + ' ' + team.title,
                team.builtin ? null : h('span', { className: 'n' }, '自建'),
                team.missingSkills.length ? h('span', { className: 'n' }, '⚠️') : null,
              )
            }),
            h('button', { type: 'button', className: 'sh-chip', onClick: createNew }, '+ 新建团'),
          ),
          error ? h('div', { className: 'sh-note err' }, error) : null,
          draft !== null
            ? h(
                'div',
                { className: 'sh-card' },
                h('h4', null, '编辑团定义（JSON）'),
                h('p', null, '结构化字段：id / title / goal / roles[{id,title,duty,skills,deliverable}] / stages[{id,title,deliverable,roleIds}] / guardrails。保存后写入 ~/.agents/skill-hub/teams/。'),
                h('textarea', {
                  className: 'sh-area',
                  value: draft,
                  onChange: function (event) { setDraft(event.target.value) },
                  spellCheck: false,
                }),
                h(
                  'div',
                  { className: 'sh-rowline', style: { marginTop: '8px' } },
                  h('button', { type: 'button', className: 'sh-btn primary', onClick: save, disabled: busy }, busy ? '保存中…' : '保存'),
                  h('button', { type: 'button', className: 'sh-btn', onClick: function () { setDraft(null); setError('') } }, '取消'),
                ),
              )
            : selected
              ? h(
                  'div',
                  null,
                  h(
                    'div',
                    { className: 'sh-card' },
                    h(
                      'div',
                      { className: 'sh-rowline' },
                      h('h4', { style: { margin: 0 } }, selected.emoji + ' ' + selected.title),
                      h('span', { className: 'sh-badge' }, selected.id),
                      selected.builtin ? h('span', { className: 'sh-badge auto' }, '内置') : h('span', { className: 'sh-badge' }, '自建'),
                      h('span', { className: 'sh-spacer' }),
                      h('button', { type: 'button', className: 'sh-btn', onClick: function () { setDraft(JSON.stringify(selected, null, 2)) } }, '编辑'),
                      selected.builtin
                        ? h('button', { type: 'button', className: 'sh-btn', onClick: reset, disabled: busy }, '恢复内置')
                        : h('button', { type: 'button', className: 'sh-btn danger', onClick: remove, disabled: busy }, '删除'),
                    ),
                    h('p', { style: { marginTop: '6px' } }, selected.goal),
                    selected.missingSkills.length
                      ? h('div', { className: 'sh-note warn' }, '⚠️ 绑定了本机没有的 skill：' + selected.missingSkills.join('、'))
                      : null,
                  ),
                  h('div', { className: 'sh-sec-title' }, '阶段'),
                  h(
                    'div',
                    { className: 'sh-flow' },
                    (selected.stages || []).map(function (stage) {
                      return h('span', { key: stage.id, className: 'sh-step' }, stage.title + ' → ' + (stage.deliverable || '未定义'))
                    }),
                  ),
                  h('div', { className: 'sh-sec-title' }, '角色（' + selected.roles.length + '）'),
                  selected.roles.map(function (role) {
                    return h(
                      'div',
                      { key: role.id, className: 'sh-card' },
                      h('h4', null, role.title),
                      h('p', null, role.duty || '（未填写职责）'),
                      h(
                        'div',
                        { className: 'sh-chips', style: { margin: '6px 0 0' } },
                        role.skills.length
                          ? role.skills.map(function (name) {
                              var missing = selected.missingSkills.indexOf(name) >= 0
                              return h(
                                'span',
                                { key: name, className: 'sh-badge' + (missing ? ' warn' : '') },
                                (missing ? '⚠️ ' : '') + name,
                              )
                            })
                          : h('span', { className: 'sh-badge' }, '未绑定 skill'),
                      ),
                      h('dl', { className: 'sh-kv' }, h('dt', null, '交付物'), h('dd', null, role.deliverable || '（未填写）')),
                    )
                  }),
                  (selected.guardrails || []).length
                    ? h(
                        'div',
                        null,
                        h('div', { className: 'sh-sec-title' }, '铁律'),
                        h(
                          'ul',
                          { style: { margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--dsw-alias-label-secondary,#6b7280)' } },
                          selected.guardrails.map(function (rule, index) {
                            return h('li', { key: index, style: { marginBottom: '3px' } }, rule)
                          }),
                        ),
                      )
                    : null,
                )
              : h('div', { className: 'sh-empty' }, '选一个团，或新建一个'),
        )
      }

      function Keys(props) {
        var state = props.state
        var [form, setForm] = useState({ env: '', service: '', account: '', note: '', platform: state.platform })
        var [secret, setSecret] = useState('')
        var [result, setResult] = useState(null)
        var [error, setError] = useState('')
        var [busy, setBusy] = useState(false)
        var [copied, setCopied] = useState('')

        function update(field, value) {
          var next = Object.assign({}, form)
          next[field] = value
          setForm(next)
        }

        async function generate() {
          setBusy(true)
          setError('')
          setResult(null)
          try {
            var payload = {
              env: form.env.trim(),
              service: form.service.trim() || form.env.trim().toLowerCase().replace(/_/g, '-'),
              account: form.account.trim(),
              note: form.note.trim(),
              platform: form.platform,
            }
            var data = await api('keys/add', { key: payload })
            setResult({ script: data.script, key: data.key, hasSecret: secret.length > 0 })
            await props.reload()
          } catch (failure) {
            setError(failure.message)
          } finally {
            setBusy(false)
          }
        }

        async function remove(entry) {
          setBusy(true)
          setError('')
          try {
            var data = await api('keys/remove', { env: entry.env })
            setResult({ script: data.script, key: entry, removed: true, hasSecret: false })
            await props.reload()
          } catch (failure) {
            setError(failure.message)
          } finally {
            setBusy(false)
          }
        }

        function withSecret(text) {
          if (!text) return ''
          return secret ? text.split(PLACEHOLDER).join(secret) : text
        }

        async function doCopy(label, text) {
          try {
            await copyText(text)
            setCopied(label)
            setTimeout(function () { setCopied('') }, 1600)
          } catch (failure) {
            setError(failure.message + '（可手动选中复制）')
          }
        }

        function block(label, text) {
          var value = withSecret(text)
          return h(
            'div',
            { key: label },
            h(
              'div',
              { className: 'sh-code-head' },
              h('span', null, label),
              h('button', { type: 'button', className: 'sh-btn', onClick: function () { doCopy(label, value) } }, copied === label ? '已复制' : '复制'),
            ),
            h('pre', { className: 'sh-code' }, value),
          )
        }

        return h(
          'div',
          null,
          h(
            'div',
            { className: 'sh-note warn' },
            '密钥只存在于这个输入框里：它不会发给后端、不写文件、不进日志。生成命令后，请你自己在终端执行 —— agent 不代跑入匙命令。',
          ),
          error ? h('div', { className: 'sh-note err' }, error) : null,
          h(
            'div',
            { className: 'sh-card' },
            h('h4', null, '登记一个 key'),
            h(
              'div',
              { className: 'sh-grid' },
              h('div', { className: 'sh-field' }, h('label', null, '环境变量名 *'), h('input', {
                className: 'sh-input', placeholder: 'WEREAD_API_KEY', value: form.env,
                onChange: function (event) { update('env', event.target.value) },
              })),
              h('div', { className: 'sh-field' }, h('label', null, '钥匙串服务名'), h('input', {
                className: 'sh-input', placeholder: 'weread / amap / openai', value: form.service,
                onChange: function (event) { update('service', event.target.value) },
              })),
              h('div', { className: 'sh-field' }, h('label', null, '账号'), h('input', {
                className: 'sh-input', placeholder: '默认当前用户', value: form.account,
                onChange: function (event) { update('account', event.target.value) },
              })),
              h('div', { className: 'sh-field' }, h('label', null, '平台'), h('select', {
                className: 'sh-select', value: form.platform,
                onChange: function (event) { update('platform', event.target.value) },
              }, state.platforms.map(function (item) {
                return h('option', { key: item.id, value: item.id }, item.label)
              }))),
            ),
            h('div', { className: 'sh-field' }, h('label', null, '备注'), h('input', {
              className: 'sh-input', placeholder: '微信读书 / 高德 / …', value: form.note,
              onChange: function (event) { update('note', event.target.value) },
            })),
            h('div', { className: 'sh-field' }, h('label', null, '密钥（只用于拼命令，不落盘）'), h('input', {
              className: 'sh-input',
              type: 'password',
              autoComplete: 'off',
              spellCheck: false,
              placeholder: 'wrk-xxxxxxxx（留空则命令里保留 __SECRET__ 占位符）',
              value: secret,
              onChange: function (event) { setSecret(event.target.value) },
            })),
            h(
              'div',
              { className: 'sh-rowline' },
              h('button', { type: 'button', className: 'sh-btn primary', onClick: generate, disabled: busy || !form.env.trim() }, busy ? '生成中…' : '生成命令'),
              secret ? h('button', { type: 'button', className: 'sh-btn', onClick: function () { setSecret('') } }, '清除密钥') : null,
            ),
          ),
          result
            ? h(
                'div',
                { className: 'sh-card' },
                h('h4', null, (result.removed ? '移除 ' : '入匙命令 · ') + (result.key && result.key.env ? result.key.env : '')),
                h('p', null, result.script.note),
                result.removed
                  ? block('从钥匙串删除', result.script.remove)
                  : h(
                      'div',
                      null,
                      block('1. 存入钥匙串（你自己跑）', result.script.add),
                      block('2. 验证（不打印密钥）', result.script.verify),
                      block('3. 需要时取回环境变量', result.script.export),
                    ),
                result.hasSecret ? null : h('div', { className: 'sh-note' }, '命令里保留着 __SECRET__ 占位符——把上面的密钥填进输入框再生成一次即可得到带真实值的命令。'),
              )
            : null,
          h('div', { className: 'sh-sec-title' }, '已登记（只有元数据，没有密钥）'),
          state.keys.length === 0
            ? h('div', { className: 'sh-empty' }, '还没有登记任何 key')
            : state.keys.map(function (entry) {
                return h(
                  'div',
                  { key: entry.env, className: 'sh-card' },
                  h(
                    'div',
                    { className: 'sh-rowline' },
                    h('span', { className: 'sh-name' }, entry.env),
                    h('span', { className: 'sh-badge' }, entry.service),
                    h('span', { className: 'sh-badge' }, entry.account),
                    h('span', { className: 'sh-badge' }, entry.platform),
                    h('span', { className: 'sh-spacer' }),
                    h('button', {
                      type: 'button',
                      className: 'sh-btn',
                      onClick: function () {
                        setForm({ env: entry.env, service: entry.service.replace(/^skill-hub:/, ''), account: entry.account, note: entry.note, platform: entry.platform })
                        setResult(null)
                      },
                    }, '填入表单'),
                    h('button', { type: 'button', className: 'sh-btn danger', onClick: function () { remove(entry) } }, '移除'),
                  ),
                  entry.note ? h('p', { style: { marginTop: '4px' } }, entry.note) : null,
                )
              }),
          state.loadAll && state.loadAll.script
            ? h(
                'div',
                null,
                h('div', { className: 'sh-sec-title' }, '一次性加载全部 key'),
                block('shell 片段', state.loadAll.script),
              )
            : null,
        )
      }

      return function SkillHubSection(props) {
        var [state, setState] = useState(null)
        var [loading, setLoading] = useState(true)
        var [error, setError] = useState('')
        var [tab, setTab] = useState('overview')

        async function reload() {
          setLoading(true)
          try {
            var data = await api('state')
            setState(data)
            setError('')
          } catch (failure) {
            setError(failure.message)
          } finally {
            setLoading(false)
          }
        }

        useEffect(function () {
          reload()
        }, [])

        var body = null
        if (loading && !state) {
          body = h('div', { className: 'sh-empty' }, '正在扫描 skill 库…')
        } else if (error && !state) {
          body = h('div', { className: 'sh-note err' }, '读取失败：' + error + '（确认 dsh-skill-hub 插件已启用，且当前 profile 有 webServer）')
        } else if (state) {
          if (tab === 'overview') body = h(Overview, { state: state, reload: reload })
          else if (tab === 'classify') body = h(Classify, { state: state, reload: reload })
          else if (tab === 'teams') body = h(Teams, { state: state, reload: reload })
          else body = h(Keys, { state: state, reload: reload })
        }

        return h(
          'div',
          { className: 'sh-root' },
          h(
            'div',
            { className: 'sh-head' },
            h(
              'div',
              null,
              h('h1', { className: 'sh-title' }, '技能中枢'),
              h(
                'p',
                { className: 'sh-sub' },
                state
                  ? state.skills.length + ' 个 skill · ' + state.teams.length + ' 个专家团 · ' + state.keys.length + ' 个已登记 key'
                  : '正在读取本机 skill 库',
              ),
            ),
            h(
              'div',
              { className: 'sh-rowline' },
              h('button', { type: 'button', className: 'sh-btn', onClick: reload, disabled: loading }, loading ? '刷新中…' : '刷新'),
              props && props.close ? h('button', { type: 'button', className: 'sh-btn', onClick: props.close }, '关闭') : null,
            ),
          ),
          h(
            'div',
            { className: 'sh-tabs' },
            TABS.map(function (item) {
              return h(
                'button',
                {
                  key: item.id,
                  type: 'button',
                  className: 'sh-tab' + (tab === item.id ? ' on' : ''),
                  onClick: function () { setTab(item.id) },
                },
                item.label,
              )
            }),
          ),
          error && state ? h('div', { className: 'sh-note err' }, error) : null,
          h('div', { className: 'sh-body' }, body),
          state && state.warnings.length
            ? h(
                'details',
                { style: { marginTop: '8px', fontSize: '11px', color: 'var(--dsw-alias-label-secondary,#6b7280)' } },
                h('summary', { style: { cursor: 'pointer' } }, state.warnings.length + ' 条扫描提示'),
                h(
                  'ul',
                  { style: { margin: '4px 0 0', paddingLeft: '16px' } },
                  state.warnings.slice(0, 20).map(function (text, index) {
                    return h('li', { key: index }, short(text, 160))
                  }),
                ),
              )
            : null,
        )
      }
    }

    function apply(ctx) {
      ensureStyles()

      if (typeof ctx.effect === 'function') {
        ctx.effect(function () {
          return function () { dropStyles() }
        }, 'skill-hub: styles')
      }

      if (typeof ctx.inject !== 'function') return

      ctx.inject(['slots'], function (scope) {
        var react
        try {
          react = require('react')
        } catch (error) {
          console.error('[skill-hub] settings section skipped: ' + error)
          return
        }
        var Section = makeSection(react)
        var Icon = makeIcon(react)

        scope.slots.inject('settings.section', function* () {
          yield scope.slots.register(
            { name: 'settings.section', id: 'skill-hub', order: 60, label: '技能中枢' },
            Section,
          )
        })

        scope.slots.inject('settings.section.icon', function* () {
          yield scope.slots.register(
            { name: 'settings.section.icon', id: 'skill-hub', order: 60, label: '技能中枢' },
            Icon,
          )
        })
      })
    }

    exports.apply = apply
    exports.inject = []
    return module.exports
  },
})
