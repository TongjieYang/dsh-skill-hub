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
      '.sh-hint{font-size:11px;line-height:1.5;margin:8px 0 0;color:var(--dsw-alias-label-secondary,#6b7280)}',
      '.sh-row{display:flex;align-items:center;justify-content:space-between;gap:10px}',
      '.sh-error{margin-top:8px;padding:8px 10px;border-radius:6px;background:var(--dsw-alias-state-error-primary,#fdecec);color:#9b1c1c;font-size:12px;line-height:1.5}',
      '.sh-audit{margin-top:8px;display:flex;flex-direction:column;gap:4px;max-height:260px;overflow:auto}',
      '.sh-audit-row{display:flex;gap:8px;align-items:flex-start;font-size:11px;line-height:1.5;padding:4px 6px;border-radius:5px;background:var(--dsw-alias-bg-layer-2,#f6f7f8)}',
      '.sh-audit-sev{flex:0 0 auto;font-weight:600;padding:0 5px;border-radius:4px;background:var(--dsw-alias-bg-base,#fff)}',
      '.sh-audit-row.sev-high .sh-audit-sev{color:#9b1c1c}',
      '.sh-audit-row.sev-middle .sh-audit-sev{color:#a16207}',
      '.sh-audit-row.sev-low .sh-audit-sev{color:#4b5563}',
      '.sh-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
      '.sh-field{display:flex;flex-direction:column;gap:3px;font-size:12px;margin-bottom:8px}',
      '.sh-field label{color:var(--dsw-alias-label-secondary,#6b7280)}',
      '.sh-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;white-space:pre-wrap;word-break:break-all;background:var(--dsw-alias-bg-layer-2,#f4f6f8);border:1px solid var(--dsw-alias-border-l1,#e6e8eb);border-radius:6px;padding:8px 10px;margin:0;max-height:180px;overflow:auto}',
      '.sh-code-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:10px 0 4px}',
      '.sh-code-head span{font-size:12px;color:var(--dsw-alias-label-secondary,#6b7280)}',
      '.sh-empty{padding:24px 0;text-align:center;color:var(--dsw-alias-label-secondary,#6b7280);font-size:12px}',
      '.sh-rowline{display:flex;align-items:center;gap:8px}',
      '.sh-spacer{flex:1}',
      '.sh-muted{color:var(--dsw-alias-label-secondary,#6b7280);font-size:12px}',
      '.sh-label{font-size:12px;color:var(--dsw-alias-label-secondary,#6b7280);margin-bottom:6px}',
      '.sh-fixed{padding:7px 10px;border:1px solid var(--dsw-alias-border-l1,#e6e8eb);border-radius:8px;background:var(--dsw-alias-bg-layer-2,#f6f7f9);color:var(--dsw-alias-label-secondary,#6b7280)}',
      '.sh-picked{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1,#e6e8eb);border-radius:8px;background:var(--dsw-alias-bg-layer-1,#fafbfc)}',
      '.sh-picked-name{font-weight:600}',
      '.sh-picklist{display:flex;flex-direction:column;gap:2px;margin-top:8px;max-height:210px;overflow:auto}',
      '.sh-pickrow{display:flex;align-items:baseline;gap:6px;width:100%;text-align:left;background:none;border:0;border-radius:6px;padding:6px 8px;cursor:pointer;font:inherit;color:inherit}',
      '.sh-pickrow:hover{background:var(--dsw-alias-bg-layer-2,#f2f4f7)}',
      '.sh-existing{flex:none;font-size:11px;line-height:18px;padding:0 6px;border-radius:6px;background:var(--dsw-alias-state-warn-primary,#b26a00);color:#fff;opacity:.9}',
      '.sh-replace{display:flex;gap:8px;align-items:flex-start;margin:10px 0 0;font-size:12px;color:var(--dsw-alias-label-secondary,#666);line-height:1.6}',
      '.sh-replace input{margin-top:2px}',
      '.sh-pickrow-name{font-weight:600;font-family:var(--dsw-code-font-family,ui-monospace,SFMono-Regular,monospace);font-size:12px}',
      '.sh-pickrow-desc{flex:1;min-width:0;color:var(--dsw-alias-label-secondary,#6b7280);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.sh-keyrow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--dsw-alias-border-l1,#eef0f3)}',
      '.sh-keyrow:last-child{border-bottom:0}',
      '.sh-keyrow-env{font-family:var(--dsw-code-font-family,ui-monospace,SFMono-Regular,monospace);font-size:12px}',
      '.sh-done-row{padding:5px 0;color:var(--dsw-alias-state-success-primary,#15803d)}',
      '.sh-skip-row{padding:5px 0;color:var(--dsw-alias-label-secondary,#6b7280)}',
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
        { id: 'install', label: '安装 skill' },
      ]

      function Overview(props) {
        var state = props.state
        var [query, setQuery] = useState('')
        var [category, setCategory] = useState('')
        var [audit, setAudit] = useState(null)
        var [auditBusy, setAuditBusy] = useState(false)
        var [auditError, setAuditError] = useState('')
        var runAudit = async function () {
          setAuditBusy(true)
          setAuditError('')
          try {
            setAudit(await api('audit'))
          } catch (error) {
            setAuditError(String(error && error.message ? error.message : error))
          } finally {
            setAuditBusy(false)
          }
        }
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

        var severityLabel = { high: '严重', middle: '注意', low: '提示' }
        return h(
          'div',
          null,
          h(
            'div',
            { className: 'sh-card', style: { marginBottom: '12px' } },
            h(
              'div',
              { className: 'sh-row' },
              h('div', { className: 'sh-label' }, '技能库体检'),
              h(
                'button',
                { type: 'button', className: 'sh-btn', disabled: auditBusy, onClick: runAudit },
                auditBusy ? '正在体检…' : '按本机约定体检',
              ),
            ),
            h(
              'div',
              { className: 'sh-hint' },
              '检查主库是否出现软链、DSH 端是否为空、端侧是否存了实体副本、目录名与 SKILL.md 是否一致。只读，不改任何文件。',
            ),
            auditError ? h('div', { className: 'sh-error' }, auditError) : null,
            audit
              ? h(
                  'div',
                  null,
                  h(
                    'div',
                    { className: 'sh-sub', style: { marginTop: '8px' } },
                    audit.clean
                      ? '没有发现不合规的地方' + (audit.findings.length ? '（另有 ' + audit.findings.length + ' 条提示）' : '')
                      : '严重 ' + audit.bySeverity.high + ' · 注意 ' + audit.bySeverity.middle + ' · 提示 ' + audit.bySeverity.low,
                  ),
                  audit.findings.length
                    ? h(
                        'div',
                        { className: 'sh-audit' },
                        audit.findings.slice(0, 40).map(function (item, index) {
                          return h(
                            'div',
                            { key: index, className: 'sh-audit-row sev-' + item.severity },
                            h('span', { className: 'sh-audit-sev' }, severityLabel[item.severity] || item.severity),
                            h('span', null, item.message),
                          )
                        }),
                      )
                    : null,
                  audit.findings.length > 40
                    ? h('div', { className: 'sh-hint' }, '只列出前 40 条，共 ' + audit.findings.length + ' 条。')
                    : null,
                )
              : null,
          ),
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
        var platformLabel = '未知平台'
        for (var i = 0; i < state.platforms.length; i += 1) {
          if (state.platforms[i].id === state.platform) platformLabel = state.platforms[i].label
        }

        var [query, setQuery] = useState('')
        var [pickedSkill, setPickedSkill] = useState('')
        var [detected, setDetected] = useState(null)
        var [detecting, setDetecting] = useState(false)
        var [form, setForm] = useState({ env: '', service: '', account: '', note: '' })
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

        function useVar(item) {
          setForm({
            env: item.env,
            service: item.service || '',
            account: form.account,
            note: '来自 skill ' + pickedSkill,
          })
        }

        async function pickSkill(name) {
          setPickedSkill(name)
          setDetected(null)
          setDetecting(true)
          setError('')
          setResult(null)
          try {
            var data = await api('keys/detect', { skill: name })
            setDetected(data)
            if (data && data.ok && data.vars.length === 1) useVar(data.vars[0])
          } catch (failure) {
            setError(failure.message)
          } finally {
            setDetecting(false)
          }
        }

        function resetSkill() {
          setPickedSkill('')
          setDetected(null)
          setQuery('')
          setError('')
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
              platform: state.platform,
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
              h('button', { type: 'button', className: 'sh-btn', onClick: function () { doCopy(label, value) } }, copied === label ? '已复制' : '待复制'),
            ),
            h('pre', { className: 'sh-code' }, value),
          )
        }

        var needle = query.trim().toLowerCase()
        var matches = state.skills.filter(function (skill) {
          if (!needle) return true
          return (
            skill.name.toLowerCase().indexOf(needle) >= 0 ||
            (skill.description || '').toLowerCase().indexOf(needle) >= 0
          )
        })

        var picker = pickedSkill
          ? h(
              'div',
              { className: 'sh-picked' },
              h('span', { className: 'sh-picked-name' }, pickedSkill),
              detected && detected.skill ? h('span', { className: 'sh-muted' }, ' · ' + (detected.skill.source || '') + ' · ' + detected.skill.category) : null,
              h('button', { type: 'button', className: 'sh-btn', onClick: resetSkill }, '换一个'),
            )
          : h(
              'div',
              null,
              h('input', {
                className: 'sh-input',
                placeholder: '搜一个 skill，例如 weread / amap / 高德',
                value: query,
                onChange: function (event) { setQuery(event.target.value) },
              }),
              h(
                'div',
                { className: 'sh-picklist' },
                matches.slice(0, 8).map(function (skill) {
                  return h(
                    'button',
                    {
                      key: skill.name,
                      type: 'button',
                      className: 'sh-pickrow',
                      onClick: function () { pickSkill(skill.name) },
                    },
                    h('span', { className: 'sh-pickrow-name' }, skill.name),
                    h('span', { className: 'sh-muted' }, ' · ' + skill.category),
                    h('span', { className: 'sh-pickrow-desc' }, short(skill.description, 90)),
                  )
                }),
                matches.length === 0 ? h('div', { className: 'sh-empty' }, '没有匹配的 skill') : null,
              ),
            )

        var detectedBlock = null
        if (detecting) detectedBlock = h('div', { className: 'sh-empty' }, '正在读这个 skill 的正文…')
        else if (detected && detected.ok) {
          detectedBlock = h(
            'div',
            null,
            detected.vars.length
              ? h(
                  'div',
                  null,
                  h('div', { className: 'sh-label' }, '这个 skill 里出现的变量（点一下自动填）'),
                  h(
                    'div',
                    { className: 'sh-chips' },
                    detected.vars.map(function (item) {
                      return h(
                        'button',
                        {
                          key: item.env,
                          type: 'button',
                          className: 'sh-chip' + (form.env === item.env ? ' on' : ''),
                          onClick: function () { useVar(item) },
                          title: item.samples[0] || '',
                        },
                        item.env,
                        h('span', { className: 'sh-muted' }, ' ×' + item.hits),
                      )
                    }),
                  ),
                )
              : h('div', { className: 'sh-note' }, detected.hint || '这个 skill 正文里没有变量名，手动填吧'),
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
            h('h4', null, '① 选一个 skill'),
            picker,
            detectedBlock,
          ),
          h(
            'div',
            { className: 'sh-card' },
            h('h4', null, '② 填 key'),
            h(
              'div',
              { className: 'sh-grid' },
              h('div', { className: 'sh-field' }, h('label', null, '环境变量名 *'), h('input', {
                className: 'sh-input', placeholder: '例如 WEREAD_API_KEY', value: form.env,
                onChange: function (event) { update('env', event.target.value) },
              })),
              h('div', { className: 'sh-field' }, h('label', null, '钥匙串服务名'), h('input', {
                className: 'sh-input', placeholder: '例如 weread / amap / openai', value: form.service,
                onChange: function (event) { update('service', event.target.value) },
              })),
              h('div', { className: 'sh-field' }, h('label', null, '账号'), h('input', {
                className: 'sh-input', placeholder: '默认当前用户', value: form.account,
                onChange: function (event) { update('account', event.target.value) },
              })),
              h('div', { className: 'sh-field' }, h('label', null, '平台（自动识别）'), h('div', { className: 'sh-fixed' }, platformLabel)),
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
              h('button', { type: 'button', className: 'sh-btn primary', onClick: generate, disabled: busy || !form.env.trim() }, busy ? '生成中…' : '③ 生成命令'),
              secret ? h('button', { type: 'button', className: 'sh-btn', onClick: function () { setSecret('') } }, '清除密钥') : null,
            ),
            !form.env.trim()
              ? h(
                  'p',
                  { className: 'sh-hint' },
                  '先选 skill（会自动带出变量名），或直接填「环境变量名」，再点生成。密钥框可以留空，那样命令里保留 __SECRET__，你自己替换。',
                )
              : null,
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
                      block('3. 用时取回（export）', result.script.export),
                    ),
              )
            : null,
          h(
            'div',
            { className: 'sh-card' },
            h('h4', null, '已登记（只有元数据，没有密钥）'),
            state.keys.length === 0
              ? h('div', { className: 'sh-empty' }, '还没有登记任何 key')
              : h(
                  'div',
                  { className: 'sh-list' },
                  state.keys.map(function (entry) {
                    return h(
                      'div',
                      { key: entry.env, className: 'sh-keyrow' },
                      h('div', null,
                        h('div', { className: 'sh-keyrow-env' }, entry.env),
                        h('div', { className: 'sh-muted' }, entry.service + ' · ' + entry.platform + (entry.note ? ' · ' + entry.note : '')),
                      ),
                      h('button', { type: 'button', className: 'sh-btn', onClick: function () { remove(entry) }, disabled: busy }, '移除'),
                    )
                  }),
                ),
          ),
          state.loadAll && state.loadAll.script
            ? h(
                'div',
                { className: 'sh-card' },
                h('h4', null, '一次性加载全部 key'),
                block('shell 片段', state.loadAll.script),
              )
            : null,
        )
      }

      function Install(props) {
        var state = props.state
        var [source, setSource] = useState('')
        var [preview, setPreview] = useState(null)
        var [picked, setPicked] = useState({})
        var [busy, setBusy] = useState('')
        var [error, setError] = useState('')
        var [done, setDone] = useState(null)
        // A skill can only be replaced, never merged: when something in the
        // library already has this name, swapping it is the whole point.
        var [replaceOn, setReplaceOn] = useState(true)

        async function runPreview() {
          setBusy('preview')
          setError('')
          setDone(null)
          setPreview(null)
          try {
            var data = await api('skills/preview', { source: source.trim() })
            if (!data.ok) {
              setError(data.error || '预览失败')
              return
            }
            setPreview(data)
            var next = {}
            if (data.total === 1) next[data.candidates[0].name] = true
            setPicked(next)
          } catch (failure) {
            setError(failure.message)
          } finally {
            setBusy('')
          }
        }

        async function runInstall() {
          var names = Object.keys(picked).filter(function (name) { return picked[name] })
          if (names.length === 0) {
            setError('先勾选要装的 skill')
            return
          }
          setBusy('install')
          setError('')
          try {
            var clashes = names.filter(function (name) { return (preview.existing || []).indexOf(name) >= 0 })
            var data = await api('skills/install', {
              source: preview.source.raw,
              names: names,
              replace: replaceOn && clashes.length > 0,
            })
            if (!data.ok && (!data.installed || data.installed.length === 0)) {
              setError(data.error || (data.skipped || []).map(function (item) { return item.name + '：' + item.reason }).join('；'))
              return
            }
            setDone(data)
            setPreview(null)
            await props.reload()
          } catch (failure) {
            setError(failure.message)
          } finally {
            setBusy('')
          }
        }

        var clashingNames = preview
          ? Object.keys(picked).filter(function (name) {
              return picked[name] && (preview.existing || []).indexOf(name) >= 0
            })
          : []

        function toggle(name) {
          var next = Object.assign({}, picked)
          next[name] = !next[name]
          setPicked(next)
        }

        return h(
          'div',
          null,
          h(
            'div',
            { className: 'sh-note' },
            '装到 ~/.agents/skills/<name>：真实目录、不用软链，身份取 SKILL.md 的 name。同名已存在时只能替换、不能合并——旧目录先移到 ~/.agents/_trash/<日期>/skill-hub/，再装新版，随时可回退。安装时 git clone 到临时目录，装完即删。',
          ),
          error ? h('div', { className: 'sh-note err' }, error) : null,
          h(
            'div',
            { className: 'sh-card' },
            h('h4', null, '从 GitHub 装一个 skill'),
            h('div', { className: 'sh-field' }, h('label', null, '仓库地址或 owner/repo'), h('input', {
              className: 'sh-input',
              placeholder: '例如 TongjieYang/dsh-skill-hub 或 https://github.com/owner/repo',
              value: source,
              onChange: function (event) { setSource(event.target.value) },
            })),
            h(
              'div',
              { className: 'sh-rowline' },
              h('button', { type: 'button', className: 'sh-btn primary', onClick: runPreview, disabled: busy !== '' || !source.trim() }, busy === 'preview' ? '预览中…' : '预览仓库里的 skill'),
            ),
          ),
          preview
            ? h(
                'div',
                { className: 'sh-card' },
                h('h4', null, preview.source.owner + '/' + preview.source.repo + '（' + preview.total + ' 个 skill'
                  + (preview.duplicateCount ? '；仓库里有 ' + (preview.duplicateCount + 1) + ' 份同名副本，已择一，其余忽略' : '') + '）'),
                h(
                  'div',
                  { className: 'sh-list' },
                  preview.candidates.map(function (item) {
                    return h(
                      'label',
                      { key: item.name, className: 'sh-pickrow' },
                      h('input', {
                        type: 'checkbox',
                        checked: !!picked[item.name],
                        onChange: function () { toggle(item.name) },
                      }),
                      h('span', { className: 'sh-pickrow-name' }, item.name),
                      h('span', { className: 'sh-pickrow-desc' }, (item.description || item.relPath)
                        + (item.duplicates && item.duplicates.length ? '（仓库里同名 ' + item.duplicates.length + ' 份）' : '')),
                      (preview.existing || []).indexOf(item.name) >= 0
                        ? h('span', { className: 'sh-existing' }, '主库已有')
                        : null,
                    )
                  }),
                ),
                clashingNames.length > 0
                  ? h(
                      'label',
                      { className: 'sh-replace' },
                      h('input', {
                        type: 'checkbox',
                        checked: replaceOn,
                        onChange: function () { setReplaceOn(!replaceOn) },
                      }),
                      h('span', null, '替换主库里的同名 skill：旧目录先移到 ~/.agents/_trash/，不勾就跳过这些名字'),
                    )
                  : null,
                h(
                  'div',
                  { className: 'sh-rowline' },
                  h('button', { type: 'button', className: 'sh-btn primary', onClick: runInstall, disabled: busy !== '' },
                    busy === 'install' ? '安装中…' : (clashingNames.length > 0 && replaceOn ? '替换同名并安装' : '装到 ~/.agents/skills')),
                  h('span', { className: 'sh-muted' }, '目标：' + preview.target),
                ),
              )
            : null,
          done
            ? h(
                'div',
                { className: 'sh-card' },
                h('h4', null, '安装结果'),
                (done.installed || []).map(function (item) {
                  var backup = (done.replaced || []).filter(function (row) { return row.name === item.name })[0]
                  return h('div', { key: item.name, className: 'sh-done-row' },
                    (backup ? '↻ ' + item.name + ' 已替换 → ' + item.path + '（旧版在 ' + backup.backup + '）'
                            : '✓ ' + item.name + ' → ' + item.path))
                }),
                (done.skipped || []).map(function (item) {
                  return h('div', { key: item.name, className: 'sh-skip-row' }, '— ' + item.name + '：' + item.reason)
                }),
                h('p', { className: 'sh-hint' }, 'DSH 读的是 ~/.agents/skills，新开一个会话说「用 xxx skill」即可；当前会话的工具表要重启才会刷新。'),
              )
            : null,
        )
      }

      function SkillHubSection(props) {
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
          else if (tab === 'install') body = h(Install, { state: state, reload: reload })
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

      /**
       * A section that throws leaves the settings pane empty, which reads to a
       * user as "the plugin is not installed". Catch the render and show the
       * message plus the stack head instead.
       */
      function withBoundary(Inner) {
        if (typeof React.Component !== 'function') return Inner

        return class SkillHubBoundary extends React.Component {
          constructor(props) {
            super(props)
            this.state = { error: null }
          }

          static getDerivedStateFromError(error) {
            return { error: error }
          }

          componentDidCatch(error, info) {
            try {
              console.error('[skill-hub] section render failed', error, info)
            } catch (ignored) {
              /* console may be unavailable in a locked-down shell */
            }
          }

          render() {
            var failure = this.state.error
            if (!failure) return React.createElement(Inner, this.props)
            var message = String((failure && failure.message) || failure)
            var stack = String((failure && failure.stack) || '')
            return h(
              'div',
              { className: 'sh-root' },
              h(
                'div',
                { className: 'sh-head' },
                h('h1', { className: 'sh-title' }, '技能中枢'),
                h('p', { className: 'sh-sub' }, '界面渲染出错了，把下面这段发给我就能定位。'),
              ),
              h('div', { className: 'sh-note err' }, message),
              h('pre', { className: 'sh-code' }, stack.slice(0, 4000)),
            )
          }
        }
      }

      return withBoundary(SkillHubSection)
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
