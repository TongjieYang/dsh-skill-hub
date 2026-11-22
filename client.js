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
    var GLYPH_EL = require('react').createElement
    // 主题：auto = 跟随宿主；light / dark = 强制。存在 localStorage，只作用于本插件容器。
    var THEME_KEY = 'skill-hub-theme'
    var CURRENT_THEME = 'auto'
    try {
      var savedTheme = window.localStorage.getItem(THEME_KEY)
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto') CURRENT_THEME = savedTheme
    } catch (themeReadError) {}
    var THEME_LABELS = { auto: '跟随', light: '浅色', dark: '深色' }
    var THEME_NEXT = { auto: 'light', light: 'dark', dark: 'auto' }

    var PLACEHOLDER = '__SECRET__'
    var STYLE_ID = 'dsh-skill-hub-styles'

    var CSS = [
      // ---- 配色：浅色 / 深色 / 跟随宿主。只作用于本插件的两块容器，
      // 不影响宿主与其它插件（变量在容器内重定义，不写 :root）。
      '.sh-root[data-sh-theme="light"], .sh-menu[data-sh-theme="light"]{--dsw-alias-bg-base:#ffffff;--dsw-alias-bg-layer-1:#ffffff;--dsw-alias-bg-layer-2:#f4f6f9;--dsw-alias-bg-overlay:#ffffff;--dsw-alias-border-l1:#e4e8ee;--dsw-alias-border-l2:#cfd6df;--dsw-alias-label-primary:#171b21;--dsw-alias-label-secondary:#5b6672;--dsw-alias-brand-primary:#2563eb;--dsw-alias-state-success-primary:#14804a;--dsw-alias-state-error-primary:#c62f2f;--dsw-alias-state-warn-primary:#a86400}',
      '.sh-root[data-sh-theme="dark"], .sh-menu[data-sh-theme="dark"]{--dsw-alias-bg-base:#0e1116;--dsw-alias-bg-layer-1:#161b22;--dsw-alias-bg-layer-2:#1e242d;--dsw-alias-bg-overlay:#171c24;--dsw-alias-border-l1:#2a323c;--dsw-alias-border-l2:#3b4552;--dsw-alias-label-primary:#e8edf4;--dsw-alias-label-secondary:#9aa6b4;--dsw-alias-brand-primary:#6d9bff;--dsw-alias-state-success-primary:#4ade80;--dsw-alias-state-error-primary:#f87171;--dsw-alias-state-warn-primary:#fbbf24}',
      // ---- 动效：一套 token，三种时长。高频反馈 120ms，状态切换 180ms，整块入场 260ms。
      '.sh-root, .sh-menu{--sh-d1:120ms;--sh-d2:180ms;--sh-d3:260ms;--sh-ease:cubic-bezier(.16,1,.3,1);--sh-ease-out:cubic-bezier(.4,0,1,1)}',
      '@keyframes sh-menu-in{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}',
      '@keyframes sh-soft-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}',
      '.sh-root{--sh-ease:cubic-bezier(.16,1,.3,1);display:flex;flex-direction:column;height:100%;min-height:0;color:var(--dsw-alias-label-primary,#1a1a1a);font-size:13px;line-height:1.5}',
      '.sh-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:2px 0 10px}',
      '.sh-themebtn{min-width:96px;font-variant-numeric:tabular-nums}',
      '.sh-tabfx{animation:sh-soft-in var(--sh-d2) var(--sh-ease) both}',
      '.sh-chip-dot{width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.5;flex:0 0 auto}',
      '.sh-teamname{display:inline-flex;align-items:center;gap:6px}',
      '.sh-title{margin:0;font-size:17px;font-weight:600;letter-spacing:.2px}',
      '.sh-sub{margin:3px 0 0;color:var(--dsw-alias-label-secondary,#6b7280);font-size:12px}',
      '.sh-dockgroup{display:inline-flex;align-items:stretch;height:28px;border:1px solid var(--dsw-alias-border-l1,#e3e6ea);border-radius:8px;background:var(--dsw-alias-bg-layer-1,#fff);overflow:hidden}',
      '.sh-dockseg{display:inline-flex;align-items:center;gap:5px;height:100%;padding:0 9px;border:0;background:transparent;color:var(--dsw-alias-label-primary,#1f2328);font:inherit;font-size:12.5px;line-height:1;cursor:pointer;transition:background var(--sh-d1) var(--sh-ease)}',
      '.sh-dockseg + .sh-dockseg{border-left:1px solid var(--dsw-alias-border-l1,#e3e6ea)}',
      '.sh-dockseg:hover{background:var(--dsw-alias-bg-layer-2,#f4f5f7)}',
      '.sh-dockseg.on{background:var(--dsw-alias-bg-layer-2,#f4f5f7)}',
      '.sh-dockseg svg{width:14px;height:14px;flex:0 0 auto;opacity:.82}',
      '.sh-dockseg-icon{padding:0 7px}',
      '.sh-dockseg-caret{font-size:9px;line-height:1;color:var(--dsw-alias-label-secondary,#8b93a1)}',
      '.sh-tabs{display:flex;gap:2px;border-bottom:1px solid var(--dsw-alias-border-l1,#e6e8eb);margin-bottom:12px;flex-wrap:wrap}',
      '.sh-tab{appearance:none;background:none;border:0;border-bottom:2px solid transparent;padding:7px 11px;margin-bottom:-1px;cursor:pointer;color:var(--dsw-alias-label-secondary,#6b7280);font-size:13px;font-family:inherit}',
      '.sh-tab:hover{color:var(--dsw-alias-label-primary,#1a1a1a)}',
      '.sh-tab.on{color:var(--dsw-alias-brand-primary,#2563eb);border-bottom-color:var(--dsw-alias-brand-primary,#2563eb);font-weight:600}',
      '.sh-body{flex:1;min-height:0;overflow:auto;padding-right:4px}',
      '.sh-btn{appearance:none;transition:background var(--sh-d1) var(--sh-ease),border-color var(--sh-d1) var(--sh-ease),color var(--sh-d1) var(--sh-ease),box-shadow var(--sh-d2) var(--sh-ease);font-family:inherit;font-size:12px;padding:5px 10px;border-radius:6px;cursor:pointer;border:1px solid var(--dsw-alias-border-l2,#d5d9e0);background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1a1a1a)}',
      '.sh-btn:hover{border-color:var(--dsw-alias-brand-primary,#2563eb);color:var(--dsw-alias-brand-primary,#2563eb)}',
      '.sh-btn.primary{background:var(--dsw-alias-brand-primary,#2563eb);border-color:transparent;color:#fff}',
      '.sh-btn.primary:hover{opacity:.9;color:#fff}',
      '.sh-btn.danger{color:var(--dsw-alias-state-error-primary,#dc2626);border-color:var(--dsw-alias-border-l2,#d5d9e0)}',
      '.sh-btn:disabled{opacity:.45;cursor:not-allowed}',
      '.sh-textarea{width:100%;box-sizing:border-box;font:inherit;font-size:12.5px;line-height:1.55;padding:8px 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,#d5d9e0);background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;resize:vertical}',
      '.sh-textarea:focus{outline:none;border-color:var(--dsw-alias-brand-primary,#2563eb)}',
      '.sh-input,.sh-select,.sh-area{width:100%;box-sizing:border-box;font-family:inherit;font-size:13px;padding:6px 9px;border-radius:6px;border:1px solid var(--dsw-alias-border-l2,#d5d9e0);background:var(--dsw-alias-bg-layer-1,#fff);color:inherit}',
      '.sh-input:focus,.sh-area:focus,.sh-select:focus{outline:none;border-color:var(--dsw-alias-brand-primary,#2563eb)}',
      '.sh-area{min-height:300px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.5;resize:vertical}',
      '.sh-chips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}',
      '.sh-chip{appearance:none;display:inline-flex;align-items:center;gap:4px;min-width:0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:inherit;font-size:12px;padding:4px 9px;border-radius:999px;cursor:pointer;border:1px solid var(--dsw-alias-border-l1,#e6e8eb);background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-secondary,#6b7280)}',
      '.sh-chip.on{background:color-mix(in srgb, var(--dsw-alias-brand-primary,#2f6bff) 13%, transparent);border-color:color-mix(in srgb, var(--dsw-alias-brand-primary,#2f6bff) 46%, transparent);color:var(--dsw-alias-brand-primary,#2f6bff);font-weight:560}',
      '.sh-chip .n{opacity:.7;margin-left:4px;font-variant-numeric:tabular-nums}',
      '.sh-list{display:flex;flex-direction:column;gap:1px}',
      '.sh-list-2{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:2px 12px;align-items:start}',
      '.sh-list-2 .sh-item{padding:8px 10px}',
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
      '.sh-toolbar{display:flex;align-items:center;gap:10px;margin:0 0 10px;flex-wrap:wrap}',
      '.sh-savebar{position:sticky;top:-2px;z-index:4;display:flex;flex-wrap:nowrap;align-items:center;gap:8px;padding:8px 10px;margin:0 0 4px;border:1px solid var(--dsw-alias-border-l1,#e6e8eb);border-radius:12px;background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:0 2px 8px rgba(16,24,40,.05)}',
      '.sh-sumtables{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}',
      '.sh-sumtable{min-width:0;border:1px solid var(--dsw-alias-border-l1,#eceef1);border-radius:10px;overflow:hidden}',
      '.sh-sumhead{padding:6px 9px;font-size:11px;font-weight:600;color:var(--dsw-alias-label-secondary,#6b7280);background:var(--dsw-alias-bg-layer-2,#f6f7f8)}',
      '.sh-sumrow{display:flex;align-items:center;gap:6px;padding:5px 9px;font-size:11.5px;border-top:1px solid var(--dsw-alias-border-l1,#f1f3f5);min-width:0}',
      '.sh-sumname{flex:0 0 auto;max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}',
      '.sh-summeta{flex:0 0 auto;color:var(--dsw-alias-label-secondary,#8b93a1);font-size:10.5px;white-space:nowrap}',
      '.sh-summeta.ellipsis{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}',
      '.sh-sumidx{flex:0 0 auto;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-bg-layer-2,#f1f3f5);color:var(--dsw-alias-label-secondary,#6b7280);font-size:10px;display:inline-flex;align-items:center;justify-content:center}',
      '.sh-tiny{padding:3px 6px !important;font-size:11.5px !important;min-width:0}',
      '.sh-savebar .sh-btn{white-space:nowrap;flex:0 0 auto}',
      '.sh-savebar .sh-hint{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}',
      '.sh-team{display:flex;flex-direction:column;gap:16px}',
      '.sh-team-switch{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:2px 0 4px}',
      '.sh-team-switch-label{font-size:11px;letter-spacing:.08em;color:var(--dsw-alias-label-secondary,#6b7280);flex:0 0 auto;text-transform:uppercase}',
      '.sh-team-pill{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border:1px solid var(--dsw-alias-border-l1,#e6e8eb);border-radius:999px;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#111827);font:inherit;font-size:12.5px;cursor:pointer;white-space:nowrap;flex:0 0 auto;transition:background var(--sh-d1) var(--sh-ease),border-color var(--sh-d1) var(--sh-ease),color var(--sh-d1) var(--sh-ease)}',
      '.sh-team-pill:hover{background:var(--dsw-alias-bg-layer-2,#f4f5f7)}',
      '.sh-team-pill.on{background:var(--dsw-alias-brand-primary,#2f6bff);border-color:var(--dsw-alias-brand-primary,#2f6bff);color:#fff}',
      '.sh-team-pill-name{max-width:120px;overflow:hidden;text-overflow:ellipsis}',
      '.sh-team-pill-dot{width:5px;height:5px;border-radius:50%;background:currentColor;opacity:.55}',
      '.sh-team-pill.add{color:var(--dsw-alias-label-secondary,#6b7280);border-style:dashed}',
      '.sh-panel{border:1px solid var(--dsw-alias-border-l1,#e6e8eb);border-radius:14px;background:var(--dsw-alias-bg-layer-1,#fff);padding:12px;box-shadow:0 1px 2px rgba(16,24,40,.04)}',
      '.sh-panel-head{display:flex;align-items:center;gap:8px;margin-bottom:8px;min-width:0}',
      '.sh-panel-title{font-size:13px;font-weight:600;letter-spacing:.01em;white-space:nowrap}',
      '.sh-panel-note{font-size:11px;color:var(--dsw-alias-label-secondary,#6b7280);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}',
      '.sh-panel-actions{display:flex;gap:8px;flex:0 0 auto}',
      '.sh-basic{display:grid;grid-template-columns:56px minmax(0,1fr);gap:8px}',
      '.sh-basic-icon{grid-column:1}',
      '.sh-picker{margin-top:8px;border:1px solid var(--dsw-alias-border-l1,#e6e8eb);border-radius:10px;padding:8px;background:var(--dsw-alias-bg-base,#fff)}',
      '.sh-note.ok{color:var(--dsw-alias-state-success-primary,#15803d)}',
      '.sh-runbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0 4px}',
      '.sh-menu-form{display:flex;gap:6px;align-items:center}',

      '.sh-menu-form .sh-input{flex:1;min-width:0}',
      '.sh-check{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--dsw-alias-label-secondary,#6b7280);cursor:pointer}',
      '.sh-root :focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#2f6bff);outline-offset:1px}',
      '@media (prefers-reduced-motion: reduce){.sh-fade,.sh-menu{animation:none!important}.sh-menu{transition:none!important}}',
      '@media (max-height:620px){.sh-menu{bottom:12px;max-height:calc(100vh - 24px)}}',
      '@media (max-width:520px){.sh-menu{width:calc(100vw - 24px);left:12px;transform:none;animation-name:sh-menu-in-narrow}@keyframes sh-menu-in-narrow{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}}',
      '.sh-glyph{width:14px;height:14px;flex:0 0 auto;stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;opacity:.85}',
      '.sh-glyph.lg{width:18px;height:18px}',
      '.sh-glyphbox{display:flex;align-items:center;gap:8px;height:30px;padding:0 10px;border:1px solid var(--dsw-alias-border-l1,#e6e8eb);border-radius:8px;background:var(--dsw-alias-bg-layer-2,#f4f6f8);color:var(--dsw-alias-label-secondary,#5b6672)}',
      '.sh-linkbtn{border:0;background:none;color:var(--dsw-alias-label-secondary,#6b7280);font:inherit;font-size:11px;cursor:pointer;padding:2px 4px;border-radius:6px}',
      '.sh-linkbtn:hover{background:var(--dsw-alias-bg-layer-2,#f4f5f7);color:var(--dsw-alias-label-primary,#111827)}',
      '.sh-linkbtn.danger:hover{color:var(--dsw-alias-state-error-primary,#b42318)}',
      '.sh-node-tools{display:flex;align-items:center;gap:4px}',
      '.sh-node-title{font-weight:600}',
      '.sh-node{background:var(--dsw-alias-bg-layer-1,#fff)}',
      '.sh-node+.sh-node::before{background:var(--dsw-alias-border-l2,#d5d9e0)}',
      '.sh-menu-row-desc{display:block;font-size:11px;color:var(--dsw-alias-label-secondary,#6b7280);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.sh-chip-x{border:0;background:none;color:inherit;cursor:pointer;padding:0 1px;font-size:12px;line-height:1;opacity:.65;border-radius:4px}',
      '.sh-chip-x:hover{opacity:1}',
      '.sh-empty{padding:28px 8px;text-align:center;color:var(--dsw-alias-label-secondary,#6b7280);font-size:12.5px}',
      '.sh-board{display:grid;grid-template-columns:repeat(auto-fill,minmax(236px,1fr));gap:10px;align-items:start}',
      '.sh-col{display:flex;flex-direction:column;min-width:0;border:1px solid var(--dsw-alias-border-l1,#e6e8eb);border-radius:14px;background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:0 1px 2px rgba(16,24,40,.04)}',
      '.sh-col-head{display:flex;width:100%;align-items:center;gap:8px;padding:11px 12px 10px;border:0;border-bottom:1px solid var(--dsw-alias-border-l1,#eef0f3);position:sticky;top:0;z-index:2;background:var(--dsw-alias-bg-layer-1,#fff);border-radius:14px 14px 0 0;font:inherit;color:inherit;cursor:pointer;text-align:left;transition:background var(--sh-d1) var(--sh-ease)}',
      '.sh-col-head:hover{background:var(--dsw-alias-bg-layer-2,#f4f5f7)}',
      '.sh-col-head.on{border-bottom-color:transparent}',
      '.sh-col-caret{margin-left:auto;font-size:10px;color:var(--dsw-alias-label-secondary,#6b7280)}',
      '.sh-col.on{grid-column:1 / -1}',
      '.sh-col.on .sh-col-body{display:grid;grid-template-columns:repeat(auto-fill,minmax(208px,1fr));gap:8px;padding:8px;max-height:min(46vh,430px);overflow:auto}',
      '.sh-col-name{font-size:13px;font-weight:600;letter-spacing:.01em}',
      '.sh-col-count{margin-left:auto;font-size:11px;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary,#6b7280);background:var(--dsw-alias-bg-layer-2,#f4f6f8);border-radius:999px;padding:1px 8px}',
      '.sh-col-body{overflow:auto;max-height:min(58vh,540px);padding:6px;display:flex;flex-direction:column;gap:2px}',
      '.sh-skillcard{padding:7px 9px;border-radius:10px;transition:background var(--sh-d1) var(--sh-ease,cubic-bezier(.16,1,.3,1))}',
      '.sh-skillcard:hover{background:var(--dsw-alias-bg-layer-2,#f4f6f8)}',
      '.sh-skillcard-top{display:flex;align-items:center;gap:6px;min-width:0}',
      '.sh-skillcard-name{font-size:12.5px;font-weight:560;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.sh-skillcard-desc{margin-top:2px;font-size:11.5px;line-height:1.45;color:var(--dsw-alias-label-secondary,#6b7280);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
      '.sh-skillcard-foot{display:flex;align-items:center;gap:6px;margin-top:5px}',
      '.sh-skillcard-foot .sh-select{max-width:112px;text-overflow:ellipsis}',
      '.sh-src{font-family:var(--dsw-code-font-family,ui-monospace,Menlo,monospace);font-size:10.5px;color:var(--dsw-alias-label-secondary,#8b93a1)}',
      '.sh-split{display:grid;grid-template-columns:152px minmax(0,1fr);gap:14px;align-items:start}',
      '.sh-rail{display:flex;flex-direction:column;gap:3px;border-right:1px solid var(--dsw-alias-border-l1,#eef0f3);padding-right:12px}',
      '.sh-rail-item{display:flex;align-items:center;gap:7px;padding:7px 9px;border:0;border-radius:9px;background:none;font:inherit;font-size:12.5px;color:inherit;cursor:pointer;text-align:left;transition:background var(--sh-d1) var(--sh-ease,cubic-bezier(.16,1,.3,1))}',
      '.sh-rail-item:hover{background:var(--dsw-alias-bg-layer-2,#f4f6f8)}',
      '.sh-rail-item.on{background:var(--dsw-alias-bg-layer-2,#eef2f7);font-weight:600}',
      '.sh-editor{min-width:0;display:flex;flex-direction:column;gap:18px}',
      '.sh-field{display:flex;flex-direction:column;gap:5px}',
      '.sh-label{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-label-secondary,#8b93a1);font-weight:600}',
      '.sh-secthead{display:flex;align-items:center;gap:8px;margin:0 0 8px}',
      '.sh-secthead h5{margin:0;font-size:13px;font-weight:600;white-space:nowrap}',
      '.sh-secthead .sh-hint{margin:0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.sh-rolecard{border:1px solid var(--dsw-alias-border-l1,#e6e8eb);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:7px;background:var(--dsw-alias-bg-layer-1,#fff)}',
      '.sh-rolecard+.sh-rolecard{margin-top:8px}',
      '.sh-rolecard-top{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
      '.sh-mini{font-size:12px;padding:5px 8px}',
      '.sh-flow{display:flex;flex-direction:column;gap:10px;padding:2px 0 8px}',
      '.sh-node{position:relative;width:100%;min-width:0;border:1px solid var(--dsw-alias-border-l1,#e6e8eb);border-radius:12px;padding:12px 12px 10px;background:var(--dsw-alias-bg-layer-1,#fff);display:flex;flex-direction:column;gap:6px}',
      '.sh-node+.sh-node{margin-left:0}',
      '.sh-node+.sh-node::before{content:"";position:absolute;left:20px;top:-10px;width:1px;height:10px;background:var(--dsw-alias-border-l2,#d5d9e0)}',
      '.sh-node-dot{position:absolute;top:10px;right:10px;width:20px;height:20px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:600;background:var(--dsw-alias-brand-primary,#2563eb);color:#fff}',
      '.sh-node-title{font-size:12.5px;font-weight:600;padding-right:22px}',
      '.sh-node-roles{display:flex;flex-wrap:wrap;gap:4px}',
      '.sh-rolechip{font:inherit;font-size:10.5px;padding:2px 7px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1,#e6e8eb);background:none;color:var(--dsw-alias-label-secondary,#6b7280);cursor:pointer;transition:all var(--sh-d1) var(--sh-ease,cubic-bezier(.16,1,.3,1))}',
      '.sh-rolechip.on{background:var(--dsw-alias-brand-primary,#2563eb);border-color:transparent;color:#fff}',
      '.sh-node-add{width:100%;min-height:42px;border:1px dashed var(--dsw-alias-border-l2,#d5d9e0);border-radius:12px;background:none;color:var(--dsw-alias-label-secondary,#6b7280);font:inherit;font-size:12px;cursor:pointer}',
      '.sh-node-add:hover{border-color:var(--dsw-alias-brand-primary,#2563eb);color:var(--dsw-alias-brand-primary,#2563eb)}',
      '.sh-guardrow{display:flex;gap:8px;align-items:center}',
      '.sh-guardrow+.sh-guardrow{margin-top:6px}',
      '.sh-menu{position:fixed;z-index:2147483000;left:50%;bottom:clamp(84px,12vh,170px);transform:translateX(-50%);width:clamp(320px,46vw,640px);height:min(64vh,560px);max-height:min(68vh,640px);box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1,#e6e8eb);border-radius:14px;background:var(--dsw-alias-bg-overlay,#fff);box-shadow:0 18px 48px rgba(16,24,40,.18),0 2px 6px rgba(16,24,40,.06);overflow:hidden;display:flex;flex-direction:column;animation:sh-menu-in var(--sh-d3) var(--sh-ease) both;transition:height var(--sh-d3) var(--sh-ease);will-change:opacity,transform,height}',
      '.sh-menu[data-tab="teams"]{height:min(70vh,600px)}',
      '.sh-menu[data-tab="install"]{height:min(40vh,360px)}',
      '.sh-menu-head{display:flex;align-items:center;gap:8px;padding:11px 12px;border-bottom:1px solid var(--dsw-alias-border-l1,#eef0f3)}',
      '.sh-menu-title{font-size:12.5px;font-weight:600;letter-spacing:.01em}',
      '.sh-menu-tabs{display:flex;gap:2px;padding:8px 12px 0}',
      '.sh-menu-tab{font:inherit;font-size:12px;padding:5px 10px;border:0;border-radius:999px;background:none;color:var(--dsw-alias-label-secondary,#6b7280);cursor:pointer}',
      '.sh-menu-tab.on{background:var(--dsw-alias-bg-layer-2,#eef2f7);color:var(--dsw-alias-label-primary,#111827);font-weight:600}',
      '.sh-menu-body{flex:1 1 auto;min-height:0;overflow:auto;padding:8px 10px 10px;overscroll-behavior:contain;scrollbar-gutter:stable}',
      '.sh-menu-row{display:flex;align-items:flex-start;gap:8px;padding:7px 8px;border-radius:9px;cursor:pointer}',
      '.sh-menu-row:hover{background:var(--dsw-alias-bg-layer-2,#f4f6f8)}',
      '.sh-menu-row-main{min-width:0;flex:1}',
      '.sh-menu-row-name{font-size:12.5px;font-weight:560;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.sh-menu-row-desc{margin-top:1px;font-size:11px;line-height:1.4;color:var(--dsw-alias-label-secondary,#6b7280);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
      '.sh-menu-card{border:1px solid var(--dsw-alias-border-l1,#e6e8eb);border-radius:12px;padding:10px 11px;background:var(--dsw-alias-bg-layer-1,#fff)}',
      '.sh-menu-cardhead{display:flex;align-items:center;gap:10px;justify-content:space-between;margin-bottom:8px}',
      '.sh-menu-goal{font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-secondary,#6b7280);margin-bottom:8px}',
      '.sh-menu-section{font-size:10.5px;font-weight:600;letter-spacing:.04em;color:var(--dsw-alias-label-secondary,#8b93a1);margin:8px 0 4px}',
      '.sh-menu-line{display:flex;align-items:center;gap:8px;min-height:22px;font-size:11.5px;color:var(--dsw-alias-label-primary,#111827)}',
      '.sh-menu-line-name{flex:0 0 auto;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.sh-menu-line-meta{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary,#8b93a1);font-size:11px}',
      '.sh-menu-idx{flex:0 0 auto;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-bg-layer-2,#eef2f7);color:var(--dsw-alias-label-secondary,#6b7280);font-size:10px;display:inline-flex;align-items:center;justify-content:center}',
      '.sh-linkbtn{border:0;background:none;padding:0;font:inherit;font-size:10.5px;color:var(--dsw-alias-brand-primary,#2563eb);cursor:pointer;opacity:.75;flex:0 0 auto}',
      '.sh-linkbtn:hover{opacity:1;text-decoration:underline}',
      '.sh-menu-foot{display:flex;align-items:center;gap:8px;padding:9px 12px;border-top:1px solid var(--dsw-alias-border-l1,#eef0f3);background:var(--dsw-alias-bg-layer-1,#fbfcfd)}',
      '.sh-flash{font-size:11.5px;color:var(--dsw-alias-state-success-primary,#15803d)}',
      '.sh-fade{animation:sh-soft-in var(--sh-d3) var(--sh-ease) both}',
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
        var [profile, setProfile] = useState(null)
        var [profileBusy, setProfileBusy] = useState('')
        var [profileText, setProfileText] = useState('')
        var [profileError, setProfileError] = useState('')
        useEffect(function () {
          api('profile').then(setProfile, function () {})
        }, [])
        var runProfileNext = async function () {
          setProfileBusy('next')
          setProfileError('')
          try {
            var result = await api('profile/batch?offset=0&limit=20')
            setProfile(result)
            setProfileText(result.prompt || '')
            if (navigator.clipboard && result.prompt) navigator.clipboard.writeText(result.prompt).catch(function () {})
          } catch (error) {
            setProfileError(String(error && error.message ? error.message : error))
          } finally {
            setProfileBusy('')
          }
        }
        var runProfileApply = async function () {
          setProfileBusy('apply')
          setProfileError('')
          try {
            var parsed
            try { parsed = JSON.parse(profileText) } catch (error) { throw new Error('粘贴进来的是 JSON 数组，形如 [{"name":"…","purpose":"…"}]') }
            var items = Array.isArray(parsed) ? parsed : parsed.items
            var result = await api('profile/apply', { method: 'POST', body: { items: items } })
            setProfile({ ok: true, status: result.status, items: {} })
            setProfileError('已写入 ' + result.applied + ' 条' + (result.skipped.length ? '，跳过 ' + result.skipped.length + ' 条' : ''))
            setProfileText('')
          } catch (error) {
            setProfileError(String(error && error.message ? error.message : error))
          } finally {
            setProfileBusy('')
          }
        }
        var runProfileReset = async function () {
          setProfileBusy('reset')
          try {
            setProfile(await api('profile/reset', { method: 'POST' }))
            setProfileText('')
          } catch (error) {
            setProfileError(String(error && error.message ? error.message : error))
          } finally {
            setProfileBusy('')
          }
        }
        var status = profile && profile.status
        var ready = status && status.ready
        return h(
          'div',
          null,
          h(
            'div',
            { className: 'sh-card', style: { marginBottom: '12px', padding: '10px 12px' } },
            h(
              'div',
              { className: 'sh-row' },
              h('div', { className: 'sh-label' }, status ? '初始化 · ' + status.profiled + '/' + status.total : '初始化'),
              h(
                'button',
                { type: 'button', className: 'sh-btn primary', disabled: profileBusy !== '', onClick: runProfileNext },
                profileBusy === 'next' ? '正在取…' : ready ? '再来一批' : '生成初始化任务书',
              ),
            ),
            h(
              'div',
              { className: 'sh-hint' },
              ready
                ? '已完成：每个 skill 都有「干什么 / 什么场景用 / 和谁搭配」，专家团和提示词直接读它。'
                : '先让 agent 把 skill 认一遍：点按钮得到任务书（已复制），粘到对话框发给 agent；它分析完会调 skill_hub_profile 写回。',
            ),
            profileError ? h('div', { className: 'sh-error' }, profileError) : null,
            h('textarea', {
              className: 'sh-textarea',
              style: { minHeight: '96px', marginTop: '8px' },
              placeholder: '初始化任务书（自动复制），或把 agent 返回的 JSON 画像粘到这里再点导入',
              value: profileText,
              onChange: function (event) { setProfileText(event.target.value) },
            }),
            h(
              'div',
              { className: 'sh-rowline' },
              h('button', { type: 'button', className: 'sh-btn', disabled: profileBusy !== '' || !profileText.trim(), onClick: runProfileApply },
                profileBusy === 'apply' ? '写入中…' : '导入画像 JSON'),
              h('button', { type: 'button', className: 'sh-btn', disabled: profileBusy !== '' || !status || !status.started, onClick: runProfileReset }, '清空重来'),
              status && status.updatedAt ? h('span', { className: 'sh-muted' }, '上次：' + status.updatedAt.slice(0, 16).replace('T', ' ')) : null,
            ),
          ),
          h(
            'div',
            { className: 'sh-card', style: { marginBottom: '12px', padding: audit ? '10px 12px' : '10px 12px' } },
            h(
              'div',
              { className: 'sh-row' },
              h('div', { className: 'sh-label', style: { letterSpacing: '.02em' } }, '技能库体检'),
              h(
                'button',
                { type: 'button', className: 'sh-btn', disabled: auditBusy, onClick: runAudit },
                auditBusy ? '正在体检…' : '按本机约定体检',
              ),
            ),
            audit
              ? null
              : h(
                  'div',
                  { className: 'sh-hint' },
                  '只读检查主库软链、DSH 端遮蔽、端侧实体副本、name 一致性。',
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
                glyph(item.id, 'category'),
                h('span', null, item.zh),
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
            { className: 'sh-list sh-list-2' },
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
        var [query, setQuery] = useState('')
        // 每列默认收起：先看见「有哪几类、各多少条」，需要时再展开
        var [open, setOpen] = useState({})
        function toggle(id) {
          setOpen(function (prev) {
            var next = Object.assign({}, prev)
            next[id] = !next[id]
            return next
          })
        }
        var groups = useMemo(function () {
          var needle = query.trim().toLowerCase()
          return state.categories
            .map(function (cat) {
              var items = state.skills.filter(function (skill) {
                if (skill.category !== cat.id) return false
                if (needle === '') return true
                return (skill.name + ' ' + (skill.description || '')).toLowerCase().indexOf(needle) >= 0
              })
              return { cat: cat, items: items }
            })
            .filter(function (group) { return group.items.length > 0 })
        }, [state.skills, state.categories, query])

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
          h(
            'div',
            { className: 'sh-toolbar' },
            h('input', {
              className: 'sh-input',
              placeholder: '在 ' + state.skills.length + ' 条里筛：输入名字或描述片段',
              value: query,
              onChange: function (event) { setQuery(event.target.value) },
            }),
            h('span', { className: 'sh-hint' }, groups.length + ' 列 / 拖动不动就用下面的下拉改类'),
          ),
          error ? h('div', { className: 'sh-note err' }, error) : null,
          h(
            'div',
            { className: 'sh-board' },
            groups.map(function (group) {
              return h(
                'section',
                { key: group.cat.id, className: 'sh-col sh-fade' + (open[group.cat.id] ? ' on' : '') },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'sh-col-head' + (open[group.cat.id] ? ' on' : ''),
                    onClick: function () { toggle(group.cat.id) },
                    'aria-expanded': open[group.cat.id] ? 'true' : 'false',
                  },
                  glyph(group.cat.id, 'category', 'lg'),
                  h('span', { className: 'sh-col-name' }, group.cat.zh),
                  h('span', { className: 'sh-col-count' }, String(group.items.length)),
                  h('span', { className: 'sh-col-caret' }, open[group.cat.id] ? '▾' : '▸'),
                ),
                open[group.cat.id] ? h(
                  'div',
                  { className: 'sh-col-body' },
                  group.items.map(function (skill) {
                    return h(
                      'div',
                      { key: skill.name, className: 'sh-skillcard' },
                      h(
                        'div',
                        { className: 'sh-skillcard-top' },
                        h('span', { className: 'sh-skillcard-name', title: skill.name }, skill.name),
                        skill.overridden ? h('span', { className: 'sh-badge auto' }, '手动') : null,
                      ),
                      skill.description
                        ? h('div', { className: 'sh-skillcard-desc' }, short(skill.description, 96))
                        : null,
                      h(
                        'div',
                        { className: 'sh-skillcard-foot' },
                        h('span', { className: 'sh-src' }, skill.source || ''),
                        h('span', { className: 'sh-spacer', style: { flex: 1 } }),
                        h(
                          'select',
                          {
                            className: 'sh-select sh-mini',
                            style: { width: 'auto', padding: '2px 6px', fontSize: '10.5px' },
                            value: skill.category,
                            disabled: busy === skill.name,
                            onChange: function (event) { move(skill, event.target.value) },
                            title: '改分类',
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
                                style: { padding: '1px 6px', fontSize: '10.5px' },
                                onClick: function () { move(skill, '') },
                                title: '恢复自动分类',
                              },
                              '↺',
                            )
                          : null,
                      ),
                    )
                  }),
                ) : null,
              )
            }),
          ),
        )
      }

      function Teams(props) {
        var state = props.state
        var [selectedId, setSelectedId] = useState(state.teams.length ? state.teams[0].id : '')
        var [draft, setDraft] = useState(null)
        var [error, setError] = useState('')
        var [busy, setBusy] = useState(false)
        var [pickerFor, setPickerFor] = useState('')
        var [pickerQuery, setPickerQuery] = useState('')
        var [notice, setNotice] = useState('')
        var selected = state.teams.find(function (team) { return team.id === selectedId }) || state.teams[0] || null
        var working = draft || selected

        useEffect(function () {
          setDraft(null)
          setError('')
          setPickerFor('')
        }, [selectedId])

        function clone(team) { return JSON.parse(JSON.stringify(team)) }

        function edit(mutator) {
          if (!working) return
          var base = draft ? clone(draft) : clone(working)
          mutator(base)
          setDraft(base)
        }

        function patchRole(index, key, value) {
          edit(function (team) { team.roles[index][key] = value })
        }

        function patchStage(index, key, value) {
          edit(function (team) { team.stages[index][key] = value })
        }

        async function save() {
          if (!working) return
          setBusy(true)
          setError('')
          try {
            var result = await api('team/save', { team: JSON.parse(JSON.stringify(working)) })
            setDraft(null)
            await props.reload()
            if (result && result.team && result.team.id) setSelectedId(result.team.id)
          } catch (failure) {
            setError(failure.message)
          } finally {
            setBusy(false)
          }
        }

        async function removeTeam() {
          if (!working) return
          setBusy(true)
          setError('')
          try {
            await api('team/delete', { id: working.id })
            setDraft(null)
            setSelectedId('')
            await props.reload()
          } catch (failure) {
            setError(failure.message)
          } finally {
            setBusy(false)
          }
        }

        async function resetTeam() {
          if (!working) return
          setBusy(true)
          setError('')
          try {
            await api('team/reset', { id: working.id })
            setDraft(null)
            await props.reload()
          } catch (failure) {
            setError(failure.message)
          } finally {
            setBusy(false)
          }
        }

        async function autoFill() {
          if (!working) return
          setBusy(true)
          setError('')
          setNotice('')
          try {
            var result = await api('team/autofill', { id: working.id })
            var changes = (result && result.changes) || []
            setDraft(null)
            await props.reload()
            setNotice(changes.length ? '自动补齐：' + changes.slice(0, 4).join('；') + (changes.length > 4 ? ' …' : '') : '已经是完整的，没需要补的')
          } catch (failure) {
            setError(failure.message)
          } finally {
            setBusy(false)
          }
        }

        async function exportSkill(replace) {
          if (!working) return
          setBusy(true)
          setError('')
          setNotice('')
          try {
            var result = await api('team/export', { id: working.id, replace: replace === true })
            setNotice(
              '已导出 ' + result.skill + ' → ' + result.path +
                (result.replaced ? '（旧版在 ' + result.backup + '）' : '') +
                '｜Codex、DSH 直接可用；WorkBuddy / Claude 加一条软链：ln -s ' + result.path +
                ' ~/.workbuddy/skills/' + result.skill,
            )
          } catch (failure) {
            if (/已存在/.test(failure.message) && !replace) {
              setError('已存在同名 skill，再点一次「覆盖导出」就会把旧版移到 _trash')
              setNotice('EXPORT_EXISTS')
            } else {
              setError(failure.message)
            }
          } finally {
            setBusy(false)
          }
        }

        async function createTeam() {
          setBusy(true)
          setError('')
          var stamp = String(Date.now()).slice(-5)
          var fresh = {
            id: 'team-' + stamp,
            title: '新专家团',
            goal: '写一句这个团要交付的结果。',
            roles: [
              { id: 'r1', title: '角色一', duty: '这个角色负责什么、按什么标准做。', skills: [], deliverable: '交付物' },
            ],
            stages: [{ id: 's1', title: '第一步', deliverable: '交付物', roleIds: ['r1'] }],
            guardrails: ['先给结论，再给依据。'],
          }
          try {
            await api('team/save', { team: fresh })
            await props.reload()
            setSelectedId(fresh.id)
          } catch (failure) {
            setError(failure.message)
          } finally {
            setBusy(false)
          }
        }

        if (!working) {
          return h(
            'div',
            null,
            h('div', { className: 'sh-empty' }, '还没有专家团。新建一个，或从内置模板恢复。'),
            h('button', { type: 'button', className: 'sh-btn primary', onClick: createTeam }, '新建专家团'),
          )
        }

        var dirty = draft !== null

        function sectionHead(title, note, action) {
          return h(
            'div',
            { className: 'sh-panel-head' },
            h('span', { className: 'sh-panel-title' }, title),
            note ? h('span', { className: 'sh-panel-note' }, note) : null,
            h('span', { style: { flex: 1 } }),
            action || null,
          )
        }

        function roleNode(role, index) {
          return h(
            'div',
            { key: index, className: 'sh-rolecard sh-fade' },
            h(
              'div',
              { className: 'sh-rolecard-top' },
              h('input', {
                className: 'sh-input sh-mini',
                placeholder: '角色名，如 选品情报',
                value: role.title,
                onChange: function (event) { patchRole(index, 'title', event.target.value) },
              }),
              h('input', {
                className: 'sh-input sh-mini',
                placeholder: '交付物，如 卖点假设表',
                value: role.deliverable || '',
                onChange: function (event) { patchRole(index, 'deliverable', event.target.value) },
              }),
            ),
            h('textarea', {
              className: 'sh-input sh-mini',
              style: { minHeight: '52px', resize: 'vertical', lineHeight: 1.5 },
              placeholder: '职责：这个角色做什么、按什么标准验收',
              value: role.duty || '',
              onChange: function (event) { patchRole(index, 'duty', event.target.value) },
            }),
            h(
              'div',
              { className: 'sh-chips', style: { margin: 0 } },
              (role.skills || []).map(function (name) {
                return h(
                  'span',
                  { key: name, className: 'sh-chip on' },
                  name,
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'sh-chip-x',
                      title: '解绑',
                      onClick: function () {
                        edit(function (t) {
                          t.roles[index].skills = t.roles[index].skills.filter(function (item) { return item !== name })
                        })
                      },
                    },
                    '×',
                  ),
                )
              }),
              h(
                'button',
                {
                  type: 'button',
                  className: 'sh-chip',
                  onClick: function () {
                    setPickerFor(pickerFor === String(index) ? '' : String(index))
                    setPickerQuery('')
                  },
                },
                pickerFor === String(index) ? '收起' : '＋ 绑定 skill',
              ),
              h('span', { style: { flex: 1 } }),
              working.roles.length > 1
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'sh-linkbtn danger',
                      onClick: function () {
                        edit(function (t) {
                          var gone = t.roles[index].id
                          t.roles.splice(index, 1)
                          t.stages.forEach(function (stage) {
                            stage.roleIds = (stage.roleIds || []).filter(function (id) { return id !== gone })
                          })
                        })
                      },
                    },
                    '删除角色',
                  )
                : null,
            ),
            pickerFor === String(index)
              ? h(
                  'div',
                  { className: 'sh-picker' },
                  h('input', {
                    className: 'sh-input sh-mini',
                    placeholder: '搜 skill 名或描述',
                    value: pickerQuery,
                    autoFocus: true,
                    onChange: function (event) { setPickerQuery(event.target.value) },
                  }),
                  h(
                    'div',
                    { className: 'sh-col-body', style: { maxHeight: '172px', marginTop: '4px', padding: 0 } },
                    state.skills
                      .filter(function (skill) {
                        if ((role.skills || []).indexOf(skill.name) >= 0) return false
                        var needle = pickerQuery.trim().toLowerCase()
                        if (needle === '') return true
                        return (skill.name + ' ' + (skill.description || '')).toLowerCase().indexOf(needle) >= 0
                      })
                      .slice(0, 40)
                      .map(function (skill) {
                        return h(
                          'button',
                          {
                            key: skill.name,
                            type: 'button',
                            className: 'sh-menu-row',
                            onClick: function () {
                              edit(function (t) {
                                if (!t.roles[index].skills) t.roles[index].skills = []
                                t.roles[index].skills.push(skill.name)
                              })
                              setPickerFor('')
                            },
                          },
                          h('span', { className: 'sh-menu-row-name' }, skill.name),
                          h('span', { className: 'sh-menu-row-desc' }, skill.description || ''),
                        )
                      }),
                    state.skills.length === 0 ? h('div', { className: 'sh-hint', style: { padding: '8px' } }, '本地没有扫到 skill') : null,
                  ),
                )
              : null,
          )
        }

        function stageNode(stage, index) {
          return h(
            'div',
            { key: index, className: 'sh-node sh-fade' },
            h('span', { className: 'sh-node-dot' }, String(index + 1)),
            h('input', {
              className: 'sh-input sh-mini sh-node-title',
              value: stage.title,
              placeholder: '这一步做什么',
              onChange: function (event) { patchStage(index, 'title', event.target.value) },
            }),
            h('input', {
              className: 'sh-input sh-mini',
              placeholder: '这一步的交付物',
              value: stage.deliverable || '',
              onChange: function (event) { patchStage(index, 'deliverable', event.target.value) },
            }),
            h(
              'div',
              { className: 'sh-node-roles' },
              working.roles.map(function (role) {
                var on = (stage.roleIds || []).indexOf(role.id) >= 0
                return h(
                  'button',
                  {
                    key: role.id,
                    type: 'button',
                    className: 'sh-rolechip' + (on ? ' on' : ''),
                    title: on ? '点了就撤下' : '点了就挂上',
                    onClick: function () {
                      edit(function (t) {
                        var list = t.stages[index].roleIds || []
                        t.stages[index].roleIds = on
                          ? list.filter(function (id) { return id !== role.id })
                          : list.concat([role.id])
                      })
                    },
                  },
                  role.title,
                )
              }),
            ),
            h(
              'div',
              { className: 'sh-node-tools' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'sh-linkbtn',
                  disabled: index === 0,
                  title: '上移',
                  onClick: function () {
                    edit(function (t) {
                      var item = t.stages.splice(index, 1)[0]
                      t.stages.splice(index - 1, 0, item)
                    })
                  },
                },
                '↑',
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'sh-linkbtn',
                  disabled: index === working.stages.length - 1,
                  title: '下移',
                  onClick: function () {
                    edit(function (t) {
                      var item = t.stages.splice(index, 1)[0]
                      t.stages.splice(index + 1, 0, item)
                    })
                  },
                },
                '↓',
              ),
              working.stages.length > 1
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'sh-linkbtn danger',
                      onClick: function () { edit(function (t) { t.stages.splice(index, 1) }) },
                    },
                    '移除',
                  )
                : null,
            ),
          )
        }

        return h(
          'div',
          { className: 'sh-team' },

          // ① 团分类：最上面
          h(
            'div',
            { className: 'sh-team-switch' },
            h('span', { className: 'sh-team-switch-label' }, '专家团'),
            state.teams.map(function (team) {
              return h(
                'button',
                {
                  key: team.id,
                  type: 'button',
                  className: 'sh-team-pill' + (team.id === working.id ? ' on' : ''),
                  onClick: function () { setSelectedId(team.id) },
                },
                glyph(team.id, 'team'),
                h('span', { className: 'sh-team-pill-name' }, team.title),
                team.builtin ? null : h('span', { className: 'sh-team-pill-dot', title: '本地自定义' }),
              )
            }),
            h('button', { type: 'button', className: 'sh-team-pill add', onClick: createTeam }, '＋ 新建'),
          ),

          // ② 名称与描述
          h(
            'div',
            { className: 'sh-panel' },
            sectionHead('基本信息', working.builtin ? '内置模板 · 保存后成为本地版本' : '本地自定义'),
            h(
              'div',
              { className: 'sh-basic' },
              h(
                'label',
                { className: 'sh-field sh-basic-icon' },
                h('span', { className: 'sh-label' }, '图标'),
                h(
                  'div',
                  { className: 'sh-glyphbox', title: '图标按分类自动生成，不再使用 emoji' },
                  glyph(working.id, 'team', 'lg'),
                  h('span', { className: 'sh-hint' }, '自动'),
                ),
              ),
              h(
                'label',
                { className: 'sh-field' },
                h('span', { className: 'sh-label' }, '名称'),
                h('input', {
                  className: 'sh-input',
                  value: working.title,
                  onChange: function (event) { edit(function (t) { t.title = event.target.value }) },
                }),
              ),
            ),
            h(
              'label',
              { className: 'sh-field', style: { marginTop: '8px' } },
              h('span', { className: 'sh-label' }, '这个团要交付什么'),
              h('input', {
                className: 'sh-input',
                value: working.goal,
                onChange: function (event) { edit(function (t) { t.goal = event.target.value }) },
              }),
            ),
            h(
              'div',
              { className: 'sh-savebar' },
              h('button', { type: 'button', className: 'sh-btn primary', disabled: busy || !dirty, onClick: save }, dirty ? '保存改动' : '已是最新'),
              h('button', { type: 'button', className: 'sh-btn', disabled: busy, onClick: resetTeam }, '恢复内置'),
              h('button', { type: 'button', className: 'sh-btn danger', disabled: busy, onClick: removeTeam }, '删除'),
              h('span', { style: { flex: 1 } }),
              h('span', { className: 'sh-hint' }, dirty ? '有未保存的改动' : ''),
            ),
            error ? h('div', { className: 'sh-note err' }, error) : null,
            notice && notice !== 'EXPORT_EXISTS'
              ? h('div', { className: 'sh-note ok' }, notice)
              : null,
            notice === 'EXPORT_EXISTS'
              ? h(
                  'div',
                  { className: 'sh-row', style: { justifyContent: 'flex-end', gap: '8px', marginTop: '8px' } },
                  h('button', { type: 'button', className: 'sh-btn danger', disabled: busy, onClick: function () { exportSkill(true) } }, '覆盖导出（旧版进 _trash）'),
                )
              : null,
          ),

          // ③ 分工与流程总览
          h(
            'div',
            { className: 'sh-panel' },
            sectionHead(
              '分工与流程',
              '先看总览，下面改细节',
              h(
                'div',
                { className: 'sh-panel-actions' },
                h('button', { type: 'button', className: 'sh-btn', disabled: busy, onClick: autoFill, title: '把空着的职责 / 交付物 / 负责人 / 铁律自动补齐' }, '自动整理'),
                h('button', { type: 'button', className: 'sh-btn', disabled: busy, onClick: function () { exportSkill(false) }, title: '导出成 ~/.agents/skills/team-<id>/SKILL.md' }, '导出为 skill'),
              ),
            ),
            h(
              'div',
              { className: 'sh-sumtables' },
              h(
                'div',
                { className: 'sh-sumtable' },
                h('div', { className: 'sh-sumhead' }, '分工 · ' + working.roles.length + ' 个角色'),
                working.roles.map(function (role, index) {
                  var stages = working.stages.filter(function (st) { return (st.roleIds || []).indexOf(role.id) >= 0 })
                  return h(
                    'div',
                    { key: 'sum-r-' + role.id + index, className: 'sh-sumrow' },
                    h('span', { className: 'sh-sumname' }, role.title || '未命名'),
                    h('span', { className: 'sh-summeta' }, (role.skills || []).length ? (role.skills || []).length + ' skill' : '无 skill'),
                    h('span', { className: 'sh-summeta ellipsis', title: role.deliverable || '' }, role.deliverable || '无交付物'),
                    h('span', { className: 'sh-summeta' }, stages.length ? stages.length + ' 步' : '未出场'),
                  )
                }),
              ),
              h(
                'div',
                { className: 'sh-sumtable' },
                h('div', { className: 'sh-sumhead' }, '流程 · ' + working.stages.length + ' 步'),
                working.stages.map(function (stage, index) {
                  var owners = (stage.roleIds || []).map(function (id) {
                    var found = working.roles.filter(function (r) { return r.id === id })[0]
                    return found ? found.title : id
                  })
                  return h(
                    'div',
                    { key: 'sum-s-' + stage.id + index, className: 'sh-sumrow' },
                    h('span', { className: 'sh-sumidx' }, String(index + 1)),
                    h('span', { className: 'sh-sumname' }, stage.title || '未命名'),
                    h('span', { className: 'sh-summeta' }, owners.join(' + ') || '未指派'),
                    h('span', { className: 'sh-summeta ellipsis', title: stage.deliverable || '' }, stage.deliverable || '未定义'),
                  )
                }),
              ),
            ),
          ),

          // ④ 角色
          h(
            'div',
            { className: 'sh-panel' },
            sectionHead(
              '角色 · ' + working.roles.length,
              '职责 / 交付物 / 绑定 skill 都能改',
              h(
                'button',
                {
                  type: 'button',
                  className: 'sh-btn',
                  onClick: function () {
                    edit(function (t) {
                      var n = t.roles.length + 1
                      t.roles.push({ id: 'r' + n, title: '角色' + n, duty: '', skills: [], deliverable: '' })
                    })
                  },
                },
                '＋ 角色',
              ),
            ),
            working.roles.map(roleNode),
          ),

          // ⑤ 流程
          h(
            'div',
            { className: 'sh-panel' },
            sectionHead('流程 · ' + working.stages.length, '按顺序排步骤，点胶囊把角色挂上去'),
            h('div', { className: 'sh-flow' }, working.stages.map(stageNode)),
            h(
              'button',
              {
                type: 'button',
                className: 'sh-node-add',
                onClick: function () {
                  edit(function (t) {
                    t.stages.push({ id: 's' + (t.stages.length + 1), title: '新步骤', deliverable: '', roleIds: [] })
                  })
                },
              },
              '＋ 阶段',
            ),
          ),

          // ⑥ 铁律
          h(
            'div',
            { className: 'sh-panel' },
            sectionHead('铁律', '会原样出现在 SOP 里'),
            (working.guardrails || []).map(function (line, index) {
              return h(
                'div',
                { key: index, className: 'sh-guardrow' },
                h('input', {
                  className: 'sh-input sh-mini',
                  value: line,
                  onChange: function (event) {
                    edit(function (t) { t.guardrails[index] = event.target.value })
                  },
                }),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'sh-linkbtn danger',
                    onClick: function () { edit(function (t) { t.guardrails.splice(index, 1) }) },
                  },
                  '×',
                ),
              )
            }),
            h(
              'button',
              {
                type: 'button',
                className: 'sh-node-add',
                onClick: function () { edit(function (t) { t.guardrails.push('') }) },
              },
              '＋ 一条',
            ),
          ),
        )
      }

      function Keys(props) {
        var state = props.state
        var [runBusy, setRunBusy] = useState(false)
        var [runMsg, setRunMsg] = useState('')
        var platformLabel = '未知平台'
        for (var i = 0; i < state.platforms.length; i += 1) {
          if (state.platforms[i].id === state.platform) platformLabel = state.platforms[i].label
        }

        var [query, setQuery] = useState('')
        var [pickedSkill, setPickedSkill] = useState('')
        var [detected, setDetected] = useState(null)
        var [detecting, setDetecting] = useState(false)
        var [form, setForm] = useState({ env: '', service: '', account: '', note: '' })
        var [shell, setShell] = useState(state.shell || 'zsh')
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

        async function launch(withKey) {
          setRunBusy(true)
          setRunMsg('')
          try {
            var data = await api('keys/run', {
              env: form.env.trim(),
              service: form.service.trim() || form.env.trim().toLowerCase().replace(/_/g, '-'),
              account: form.account.trim(),
              note: form.note.trim(),
              platform: state.platform,
              shell: shell,
              secret: withKey === true ? secret : '',
            })
            setRunMsg('已在 ' + (data.how || '终端') + ' 打开：' + (withKey === true ? '命令里带密钥，回车即可' : '会提示你粘贴密钥，回车确认'))
          } catch (failure) {
            setRunMsg('没能打开终端：' + failure.message)
          } finally {
            setRunBusy(false)
          }
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
              shell: shell,
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
              state.keyTool && state.keyTool.available === false
                ? h('p', { className: 'sh-error' }, '这台机器上没有 ' + state.keyTool.tool + '：' + state.keyTool.hint)
                : null,
              h('div', { className: 'sh-field' }, h('label', null, 'shell（决定 export 怎么写、加进哪个文件）'),
                h('select', {
                  className: 'sh-input',
                  value: shell,
                  onChange: function (event) { setShell(event.target.value) },
                }, (state.shells || []).map(function (item) {
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
                  ? null
                  : h(
                      'div',
                      { className: 'sh-runbar' },
                      h(
                        'button',
                        { type: 'button', className: 'sh-btn primary', disabled: runBusy, onClick: function () { launch(false) } },
                        runBusy ? '打开中…' : '在终端里执行（推荐）',
                      ),
                      secret
                        ? h(
                            'button',
                            { type: 'button', className: 'sh-btn', disabled: runBusy, onClick: function () { launch(true) }, title: '密钥会写进这一条命令，会留在 shell history' },
                            '带密钥执行',
                          )
                        : null,
                      h('span', { className: 'sh-hint', style: { flex: 1, minWidth: 0 } }, '按下按钮后终端会自己打开并填好命令，你只需回车（第一次 macOS 会问是否允许控制 Terminal，点允许）'),
                    ),
                runMsg ? h('div', { className: 'sh-note ok' }, runMsg) : null,
                result.removed
                  ? block('从钥匙串删除', result.script.remove)
                  : h(
                      'div',
                      null,
                      result.script.addPrompt
                        ? block('1. 存入钥匙串（推荐：交互式，密钥不进 shell history）', result.script.addPrompt)
                        : null,
                      block(result.script.addPrompt ? '1b. 或者一条命令带值（会留在 ~/.zsh_history，介意就用上面那条）' : '1. 存入钥匙串（你自己跑）', result.script.add),
                      block('2. 验证（不打印密钥）', result.script.verify),
                      block('3. 用时取回（只对当前 shell 会话有效）', result.script.export),
                      result.script.persist
                        ? block(
                            (result.script.persist.fileLabel ? '4. 想一直带着就加进 ' + result.script.persist.fileLabel : '4. 想一直带着')
                              + '（' + result.script.persist.label + '）',
                            result.script.persist.line,
                          )
                        : null,
                      h('div', { className: 'sh-muted' },
                        (result.script.persist && result.script.persist.note ? result.script.persist.note + ' ' : '')
                        + '插件不写任何 dotfile，这一行你自己决定加不加；不想改文件也行，用的时候现取。'),
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
        // Cloning a big repo over a mirror can take a minute; a frozen button
        // reads as "挂了", so count the seconds out loud.
        var [elapsed, setElapsed] = useState(0)
        var [updatePlan, setUpdatePlan] = useState(null)
        var [updateBusy, setUpdateBusy] = useState('')
        var [updateError, setUpdateError] = useState('')
        var checkUpdates = async function () {
          setUpdateBusy('check')
          setUpdateError('')
          try {
            setUpdatePlan(await api('updates'))
          } catch (error) {
            setUpdateError(String(error && error.message ? error.message : error))
          } finally {
            setUpdateBusy('')
          }
        }
        var applyUpdates = async function (names) {
          setUpdateBusy('apply')
          setUpdateError('')
          try {
            var result = await api('updates/apply', { method: 'POST', body: { names: names || null } })
            setUpdatePlan(null)
            setDone({
              installed: result.updated.map(function (item) { return { name: item.name, path: item.source, action: 'updated', backup: item.backup } }),
              skipped: result.skipped,
              target: '',
            })
            setUpdateError(result.failed.length ? '部分失败：' + result.failed.map(function (item) { return item.source }).join('、') : '')
          } catch (error) {
            setUpdateError(String(error && error.message ? error.message : error))
          } finally {
            setUpdateBusy('')
          }
        }
        // A skill can only be replaced, never merged: when something in the
        // library already has this name, swapping it is the whole point.
        var [replaceOn, setReplaceOn] = useState(true)

        useEffect(
          function () {
            if (busy !== 'preview') return undefined
            setElapsed(0)
            var startedAt = Date.now()
            var timer = setInterval(function () {
              setElapsed(Math.round((Date.now() - startedAt) / 1000))
            }, 500)
            return function () { clearInterval(timer) }
          },
          [busy],
        )

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
            { className: 'sh-card', style: { marginBottom: '12px', padding: '10px 12px' } },
            h(
              'div',
              { className: 'sh-row' },
              h('div', { className: 'sh-label' }, '一键更新'),
              h(
                'button',
                { type: 'button', className: 'sh-btn', disabled: updateBusy !== '', onClick: checkUpdates },
                updateBusy === 'check' ? '正在检查…' : '检查更新',
              ),
            ),
            h('div', { className: 'sh-hint' }, '只更新这个插件装过的 skill（install.log 里记着来源），手装的 skill 不动。变了才替换，旧版进 _trash 可回退。'),
            updateError ? h('div', { className: 'sh-note warn' }, updateError) : null,
            updatePlan
              ? h(
                  'div',
                  { style: { marginTop: '8px' } },
                  h('div', { className: 'sh-sub' },
                    '跟踪 ' + updatePlan.tracked + ' 个 · 有新版 ' + updatePlan.updatable.length + ' 个 · 已最新 ' + updatePlan.unchanged.length + ' 个'
                    + (updatePlan.missing.length ? ' · 上游已删 ' + updatePlan.missing.length + ' 个' : '')
                    + (updatePlan.failed.length ? ' · 拉取失败 ' + updatePlan.failed.length + ' 个' : '')),
                  updatePlan.updatable.length
                    ? h('div', { className: 'sh-note' }, updatePlan.updatable.map(function (item) { return item.name }).join('、'))
                    : h('div', { className: 'sh-hint' }, '都是最新的。'),
                  updatePlan.failed.length
                    ? h('div', { className: 'sh-hint' }, '失败：' + updatePlan.failed.map(function (item) { return item.source }).join('、'))
                    : null,
                  h(
                    'div',
                    { className: 'sh-rowline', style: { marginTop: '8px' } },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'sh-btn primary',
                        disabled: updateBusy !== '' || updatePlan.updatable.length === 0,
                        onClick: function () { applyUpdates(updatePlan.updatable.map(function (item) { return item.name })) },
                      },
                      updateBusy === 'apply' ? '正在更新…' : '全部更新（' + updatePlan.updatable.length + '）',
                    ),
                  ),
                )
              : null,
          ),
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
              h('button', { type: 'button', className: 'sh-btn primary', onClick: runPreview, disabled: busy !== '' || !source.trim() }, busy === 'preview' ? '预览中… ' + elapsed + 's' : '预览仓库里的 skill'),
              busy === 'preview'
                ? h('div', { className: 'sh-muted' },
                    elapsed >= 15
                      ? '正在 git clone（大仓库或走了镜像/代理都会慢），最多等 120 秒。'
                      : '正在拉取仓库…')
                : null,
            ),
          ),
          preview
            ? h(
                'div',
                { className: 'sh-card' },
                h('h4', null, preview.source.owner + '/' + preview.source.repo + '（' + preview.total + ' 个 skill'
                  + (preview.duplicateCount ? '；仓库里有 ' + (preview.duplicateCount + 1) + ' 份同名副本，已择一，其余忽略' : '') + '）'),
                preview.total === 0
                  ? h(
                      'div',
                      { className: 'sh-note warn' },
                      h('strong', null, '这个仓库里没有 SKILL.md，所以它不是 skill 仓库。'),
                      h('br'),
                      '如果是命令行工具（比如 yt-dlp、ffmpeg），直接装工具本身就行，不要走这里：',
                      h('br'),
                      h('code', null, 'brew install yt-dlp'),
                      ' 装好后如果想让 agent 会用，再写一个薄薄的 SKILL.md 把它包起来（见 docs/DETAIL.md「给已有工具包一层 skill」）。',
                      h('br'),
                      '如果 skill 在子目录里，地址要用 ',
                      h('code', null, 'owner/repo/tree/<branch>/<子目录>'),
                      ' 的形式，例如 ',
                      h('code', null, 'anthropics/skills/tree/main/skills/pdf'),
                      '。',
                    )
                  : null,
                typeof preview.cloneMs === 'number'
                  ? h('div', { className: 'sh-muted' },
                      'clone 用时 ' + (preview.cloneMs / 1000).toFixed(1) + 's'
                      + (preview.modeLabel ? ' · ' + preview.modeLabel : '')
                      + (preview.fallbackFrom ? ' · 另一条路失败后换的这条' : ''))
                  : null,
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
                    (backup ? item.name + ' 已替换 → ' + item.path + '（旧版在 ' + backup.backup + '）'
                            : item.name + ' 装好 → ' + item.path))
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
        var [theme, setTheme] = useState(CURRENT_THEME)

        function cycleTheme() {
          var next = THEME_NEXT[theme] || 'auto'
          CURRENT_THEME = next
          setTheme(next)
          try { window.localStorage.setItem(THEME_KEY, next) } catch (themeWriteError) {}
        }

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
          { className: 'sh-root', 'data-sh-theme': theme },
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
              h('p', { className: 'sh-sub' },
                ACTIVE_SHORTCUT
                  ? '快捷键 ' + ACTIVE_SHORTCUT + ' 在任意界面直接打开这里'
                  : '还没绑定快捷键：设置 → 通用设置 → 快捷键 里可以指定'),
            ),
            h(
              'div',
              { className: 'sh-rowline' },
              h('button', {
                type: 'button',
                className: 'sh-btn sh-themebtn',
                title: '配色：跟随系统 / 浅色 / 深色',
                'aria-label': '切换配色',
                onClick: cycleTheme,
              }, '配色 · ' + THEME_LABELS[theme]),
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
          h('div', { className: 'sh-body sh-tabfx', key: tab }, body),
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


    // -------------------------------------------------------------------------
    // Global shortcut: jump straight to 技能中枢 from anywhere.
    // The settings shell owns section selection through a root store that the
    // `sidebar.settings` slot publishes; we reach it through that slot rather
    // than importing another plugin's modules.
    // -------------------------------------------------------------------------

    // Which keys did we actually get? Decided at registration time so the
    // panel can print the truth instead of a hardcoded guess.
    var ACTIVE_SHORTCUT = ''
    var ACTIVE_CODE = ''

    function keyLabel(code, mac) {
      var letter = String(code || '').replace(/^Key/, '')
      return mac ? '\u21e7\u2318' + letter : 'Ctrl+Shift+' + letter
    }

    function isMac() {
      var nav = typeof navigator !== 'undefined' && navigator ? String(navigator.platform || '') : ''
      return /mac/i.test(nav)
    }

    // Candidate keys, most memorable first. The first one that is free on this
    // device wins; a taken combination must not cost us the shortcut entirely.
    var CANDIDATE_CODES = ['KeyK', 'KeyJ', 'KeyH', 'KeyU', 'KeyI', 'KeyY', 'KeyP', 'KeyL']

    function openSection(slots) {
      try {
        var entries = (slots && typeof slots.entries === 'function' ? slots.entries('sidebar.settings') : null) || []
        var entry = entries[0]
        // The shell store hangs off the slot entry itself (`store`), not options.
        var handle = entry ? entry.store ?? (entry.options && entry.options.store) ?? null : null
        var store = handle && typeof handle.create === 'function' ? handle.create() : handle
        var actions = store && store.actions
        if (actions && typeof actions.openSection === 'function') {
          actions.openSection('skill-hub')
          return true
        }
        if (actions && typeof actions.open === 'function') {
          actions.open()
          if (typeof actions.select === 'function') actions.select('skill-hub')
          return true
        }
      } catch (error) {
        console.error('[skill-hub] 打开设置失败: ' + error)
      }
      return false
    }

    function registerShortcut(ctx, slots) {
      if (!ctx || !ctx.shortcuts || typeof ctx.shortcuts.register !== 'function') return null
      var mac = isMac()

      function command(defaults) {
        return {
          id: 'skill-hub.open',
          label: function () {
            return '打开技能中枢' + (ACTIVE_SHORTCUT ? '\uff08' + ACTIVE_SHORTCUT + '\uff09' : '')
          },
          aliases: ['skills', 'skill hub', '\u6280\u80fd\u4e2d\u67a2'],
          defaults: defaults,
          regions: ['page', 'editable', 'terminal'],
          modals: ['settings'],
          resolve: function (context) {
            var modal = context ? context.modal : null
            if (modal !== null && modal !== 'settings') return { status: 'blocked', reason: 'modal' }
            return { status: 'handled', run: function () { openSection(slots) } }
          },
        }
      }

      // Only desktop profiles get a default: web already uses Mod+Alt+<letter>
      // for session search and friends, and a cross-profile conflict rejects
      // the whole registration.
      var profiles = ['desktop:macos', 'desktop:windows', 'desktop:linux']
      for (var i = 0; i < CANDIDATE_CODES.length; i += 1) {
        var code = CANDIDATE_CODES[i]
        // Shift instead of Alt on purpose: Option+<letter> is an IME dead key on
        // macOS, and dead keys are passed through instead of dispatching commands.
        var binding = { code: code, modifiers: ['primary', 'shift'] }
        var defaults = {}
        for (var p = 0; p < profiles.length; p += 1) defaults[profiles[p]] = binding
        try {
          var dispose = ctx.shortcuts.register(command(defaults))
          ACTIVE_SHORTCUT = keyLabel(code, mac)
          ACTIVE_CODE = code
          return dispose
        } catch (error) {
          // taken by another feature — try the next candidate
        }
      }

      // The desktop build can swallow a plugin's chord in its native bridge
      // before the renderer sees it, so keep a DOM listener as a second way in.
      // Both paths call openSection, which is idempotent.
      // Nothing free: still register the command unbound so it shows up in the
      // shortcut panel and the user can assign it.
      console.error('[skill-hub] 没有空闲的 Mod+Shift+字母 组合，改为无默认键位')
      ACTIVE_SHORTCUT = ''
      return ctx.shortcuts.register(command({}))
    }

    function listenLocally(scope, slots) {
      try {
        if (typeof document === 'undefined' || !document.addEventListener) return
        var onKeyDown = function (event) {
          if (!event || event.defaultPrevented) return
          if (!(event.metaKey || event.ctrlKey) || !event.shiftKey || event.altKey) return
          if (ACTIVE_CODE === '' || event.code !== ACTIVE_CODE) return
          var modal = document.querySelector('[data-shortcut-modal]')
          if (modal !== null && modal.getAttribute('data-shortcut-modal') !== 'settings') return
          openSection(slots)
        }
        document.addEventListener('keydown', onKeyDown, true)
        if (scope && typeof scope.effect === 'function') {
          scope.effect(function () { return function () { document.removeEventListener('keydown', onKeyDown, true) } })
        }
      } catch (error) {
        console.error('[skill-hub] 本地快捷键监听失败: ' + error)
      }
    }

    // Prompt text the user actually sends. Tested against real skill descriptions
    // (see tests/client.test.mjs): keeps the slash command first so the composer
    // recognises it, then one actionable line derived from the skill description.
    function hasCJK(text) {
      return /[\u4e00-\u9fa5]/.test(String(text || ''))
    }

    // Cut one readable sentence. Naive [.!?] splitting breaks domains ("inference.sh")
    // and versions ("Image 2.5"), which used to cut English prompts mid-word.
    var ABBREV = /^(e\.g|i\.e|etc|vs|cf|al|mr|ms|dr|no|fig)$/i

    function firstSentence(text, max) {
      var one = String(text || '').replace(/\s+/g, ' ').trim()
      if (!one) return ''
      var cut = ''
      var cjk = one.search(/[。！？]/)
      if (cjk >= 0) {
        cut = one.slice(0, cjk + 1)
      } else {
        var re = /[.!?](?=\s+[A-Z"“‘（(]|\s*$)/g
        var match = re.exec(one)
        while (match) {
          var at = match.index
          var word = one.slice(0, at).split(' ').pop() || ''
          var endsHere = true
          if (/\d$/.test(word)) endsHere = false
          else if (ABBREV.test(word.replace(/\.$/, ''))) endsHere = false
          else if (word.indexOf('.') < 0 && /[A-Za-z]$/.test(word) && /[A-Za-z]/.test(one[at - 2] || '')) endsHere = false
          if (endsHere) {
            cut = one.slice(0, at + 1)
            break
          }
          match = re.exec(one)
        }
        if (!cut) cut = one
      }
      return cut.length > max ? cut.slice(0, max - 1) + '…' : cut
    }

    function buildSkillPrompt(skill, sentence) {
      var name = String((skill && skill.name) || '').trim()
      var desc = String(sentence || '').trim()
      if (!name) return ''
      if (!desc) return '/' + name + ' '
      return hasCJK(desc)
        ? '/' + name + ' 用这个 skill 完成：' + desc
        : '/' + name + ' Use this skill to: ' + desc
    }

    // One click on a team inserts the whole task book: every role, every skill in
    // order, the flow, the review checklist and the guardrails. Per-role inserts
    // stay available, but the default path is a single click.
    function buildTeamPrompt(team) {
      if (!team) return ''
      var title = team.title || '专家团'
      var roles = Array.isArray(team.roles) ? team.roles : []
      var stages = Array.isArray(team.stages) ? team.stages : []
      var nameOf = function (id) {
        var hit = roles.filter(function (r) { return r.id === id })[0]
        return hit ? hit.title : id
      }
      var lines = ['按「' + title + '」这个专家团来做。']
      if (team.goal) lines.push('目标：' + team.goal)
      if (roles.length) {
        lines.push('', '分工：')
        roles.forEach(function (role, index) {
          var skills = (role.skills || []).length ? '；用这些 skill：' + (role.skills || []).join(' → ') : ''
          var deliver = role.deliverable ? '；交付：' + role.deliverable : ''
          var duty = String(role.duty || '').replace(/[。.!！?？,，;；\s]+$/, '') || '按角色名执行'
          lines.push(index + 1 + '. ' + role.title + '：' + duty + deliver + skills)
        })
      }
      if (stages.length) {
        lines.push('', '流程：')
        stages.forEach(function (stage, index) {
          var owners = (stage.roleIds || []).map(nameOf).join(' + ') || '未指派'
          lines.push(index + 1 + '. ' + (stage.title || '未命名') + ' — 负责人：' + owners + (stage.deliverable ? '；产出：' + stage.deliverable : ''))
        })
      }
      lines.push(
        '',
        '执行要求：',
        '- 每步先按顺序装载该角色绑定的 skill，再动手；本地没装的 skill 先用同名能力替代并说明。',
        '- 每步产出落到文件或明确交付物，再进入下一步，不要跳步。',
        '- 收尾按三条自检：①产出能独立交付 ②没把推测写成事实 ③缺的输入向上游要。',
      )
      if ((team.guardrails || []).length) lines.push('- 铁律：' + team.guardrails.join(' / '))
      return lines.join('\n')
    }

    function buildRolePrompt(team, role) {
      var skills = (role && role.skills) || []
      var lines = ['按「' + (team && team.title ? team.title : '专家团') + '」里「' + (role && role.title) + '」这个角色来做。']
      if (role && role.duty) lines.push('职责：' + role.duty)
      if (role && role.deliverable) lines.push('交付物：' + role.deliverable)
      if (skills.length) lines.push('先用这些 skill（按顺序）：' + skills.join(' → '))
      lines.push('做完按三条自检：①产出能独立交付 ②没把推测写成事实 ③缺的输入向上游要。')
      return lines.join('\n')
    }


    // 单色线性图标：只用几何路径 + currentColor，任何配色下都不会与色板撞色。
    var GLYPH_PATHS = {
      play: 'M5 3.6l7 4.4-7 4.4z',
      bulb: 'M8 2.2a3.6 3.6 0 0 1 2.1 6.5c-.5.4-.7.8-.7 1.4H6.6c0-.6-.2-1-.7-1.4A3.6 3.6 0 0 1 8 2.2zM6.6 12.2h2.8M7 13.8h2',
      blocks: 'M2.6 2.6h4.2v4.2H2.6zM9.2 2.6h4.2v4.2H9.2zM2.6 9.2h4.2v4.2H2.6zM9.2 9.2h4.2v4.2H9.2z',
      heart: 'M8 13.4S2.8 10.2 2.8 6.6A2.7 2.7 0 0 1 8 5.4a2.7 2.7 0 0 1 5.2 1.2c0 3.6-5.2 6.8-5.2 6.8z',
      page: 'M4 2.4h5l3 3v8.2H4zM9 2.4v3.2h3',
      image: 'M2.6 3.4h10.8v9.2H2.6zM2.6 10l3.2-3.2 2.6 2.6 2-2 3 3',
      gear: 'M8 5.8a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4zM8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3.6 3.6l1.4 1.4M11 11l1.4 1.4M12.4 3.6L11 5M5 11l-1.4 1.4',
      chat: 'M2.6 3.2h10.8v6.6H7.4L4.4 12.4v-2.6H2.6z',
      search: 'M7.2 3a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4zM10.4 10.4l3 3',
      doc: 'M4 2.4h5.2L12 5.2v8.4H4zM9.2 2.4v2.8H12M6 8h4M6 10.4h4',
      pin: 'M8 14s4-4.2 4-7a4 4 0 1 0-8 0c0 2.8 4 7 4 7zM8 5.4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2z',
      tag: 'M2.6 2.6h5l5.8 5.8-5 5L2.6 7.6zM5.4 5.4h.02',
      flow: 'M3 4.2h4M9 4.2h4M8 4.2v7.6M4.6 9.2h6.8M5 11.8h6',
      chart: 'M2.6 13.2h10.8M4.4 13.2V8.6M7.6 13.2V4.6M10.8 13.2v-5',
      quill: 'M3 13l3.4-1 6-6.4a1.6 1.6 0 0 0-2.2-2.2L3.8 9.6 3 13zM9.4 4.6l2 2',
      code: 'M5.6 4.4L2.4 8l3.2 3.6M10.4 4.4L13.6 8l-3.2 3.6',
      dot: 'M8 6.6a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8z',
    }

    var CATEGORY_GLYPH = {
      'content-video': 'play', writing: 'quill', 'image-design': 'image', dev: 'code',
      collab: 'chat', research: 'search', 'office-docs': 'doc', 'map-travel': 'pin',
      'commerce-ops': 'tag', 'agent-workflow': 'flow', business: 'chart', other: 'dot',
    }

    var TEAM_GLYPH = {
      'daohuo-video': 'play', 'kepu-video': 'bulb', 'app-builder': 'blocks', 'xhs-ops': 'heart',
      'baoyu-wechat-article': 'doc', 'baoyu-visual-explain': 'image',
      'baoyu-multichannel': 'flow', 'baoyu-video-cover': 'image', 'short-video': 'play',
    }

    function glyphName(id, kind) {
      var map = kind === 'team' ? TEAM_GLYPH : CATEGORY_GLYPH
      if (map[id]) return map[id]
      var key = String(id || '')
      if (kind === 'team') {
        if (/video|short/.test(key)) return 'play'
        if (/article|wechat|doc/.test(key)) return 'doc'
        if (/visual|cover|image/.test(key)) return 'image'
        if (/commercial|commerce|xhs/.test(key)) return 'tag'
        return 'dot'
      }
      return 'dot'
    }

    // 模块级捕获 createElement：组件内部的局部变量名各不相同（h / create），
    // 图标是纯展示件，不该要求调用方传 React。
    // 注意：GLYPH_EL 必须在第 19 行之前声明，否则 var 提升会把赋值覆盖掉。

    function glyph(id, kind, extraClass) {
      var h = GLYPH_EL
      var name = glyphName(id, kind)
      return h(
        'svg',
        {
          key: 'g-' + name + '-' + (id || ''),
          className: 'sh-glyph' + (extraClass ? ' ' + extraClass : ''),
          viewBox: '0 0 16 16',
          'aria-hidden': 'true',
          focusable: 'false',
        },
        h('path', { d: GLYPH_PATHS[name] || GLYPH_PATHS.dot }),
      )
    }

    function makeHubMenu(react, slots) {
      var h = react.createElement
      var useState = react.useState
      var useEffect = react.useEffect
      var useRef = react.useRef

      function composerEditable() {
        var list = []
        if (typeof document === 'undefined') return null
        var nodes = document.querySelectorAll('[contenteditable="true"],[contenteditable=""]')
        for (var i = 0; i < nodes.length; i += 1) {
          var node = nodes[i]
          var rect = node.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) list.push(node)
        }
        return list.length ? list[list.length - 1] : null
      }

      function insertText(text) {
        var editable = composerEditable()
        if (!editable) return 'none'
        editable.focus()
        try {
          if (document.execCommand && document.execCommand('insertText', false, text)) return 'inserted'
        } catch (error) {}
        try {
          editable.textContent = (editable.textContent || '') + text
          editable.dispatchEvent(new Event('input', { bubbles: true }))
          return 'inserted'
        } catch (error) {}
        return 'none'
      }

      return function HubMenu() {
        var [open, setOpen] = useState(false)
        var [tab, setTab] = useState('skill')
        var [data, setData] = useState(null)
        var [query, setQuery] = useState('')
        var [flash, setFlash] = useState('')
        var [teamId, setTeamId] = useState('')
        var [installSource, setInstallSource] = useState('')
        var [installPreview, setInstallPreview] = useState(null)
        var [installPicked, setInstallPicked] = useState({})
        var [installReplace, setInstallReplace] = useState(true)
        var [installBusy, setInstallBusy] = useState(false)
        var [installMsg, setInstallMsg] = useState('')
        var buttonRef = useRef(null)
        var menuRef = useRef(null)
        var installRef = useRef(null)

        useEffect(function () {
          if (!open) return undefined
          function onDocDown(event) {
            var box = document.getElementById('skill-hub-menu')
            if (box && box.contains(event.target)) return
            if (buttonRef.current && buttonRef.current.contains(event.target)) return
            setOpen(false)
          }
          document.addEventListener('mousedown', onDocDown)
          return function () { document.removeEventListener('mousedown', onDocDown) }
        }, [open])

        // 打开时才拉一次 /state，关掉不清缓存，重开即用。
        useEffect(function () {
          if (!open || data !== null) return
          fetch(API + '/state')
            .then(function (response) { return response.json() })
            .then(function (payload) { if (payload && payload.ok !== false) setData(payload) })
            .catch(function () { setFlash('没读到技能中枢数据，稍后再试') })
        }, [open, data])

        // 位置与尺寸全交给 CSS（百分比 + clamp），JS 只管开关与页签。
        function openMenu(nextTab) {
          if (nextTab) setTab(nextTab)
          setOpen(true)
          setFlash('')
          setQuery('')
        }

        function toggle() {
          if (open) { setOpen(false); return }
          openMenu()
        }

        function useSkill(skill, withPrompt) {
          var text = withPrompt
            ? buildSkillPrompt(skill, firstSentence(skill.description, 160))
            : '/' + skill.name + ' '
          var outcome = insertText(text)
          if (outcome === 'inserted') {
            setFlash('已插入 /' + skill.name)
            setTimeout(function () { setOpen(false) }, 420)
          } else {
            setFlash('没找到输入框，手动输入 /' + skill.name)
          }
        }

        function useTeam(team) {
          var text = buildTeamPrompt(team)
          var outcome = insertText(text)
          if (outcome === 'inserted') {
            setFlash('已插入「' + team.title + '」的完整任务书')
            setTimeout(function () { setOpen(false) }, 560)
          } else {
            setFlash('没找到输入框')
          }
        }

        async function previewInstall(source) {
          setInstallBusy(true)
          setInstallMsg('')
          try {
            var payload = await api('skills/preview', { source: source || installSource })
            setInstallPreview(payload)
            var picked = {}
            ;(payload.candidates || []).forEach(function (item) { picked[item.name] = true })
            setInstallPicked(picked)
            setInstallMsg('')
          } catch (failure) {
            setInstallMsg(failure.message)
            setInstallPreview(null)
          } finally {
            setInstallBusy(false)
          }
        }

        async function doInstall() {
          setInstallBusy(true)
          setInstallMsg('')
          try {
            var names = Object.keys(installPicked).filter(function (name) { return installPicked[name] })
            var result = await api('skills/install', { source: installSource, names: names, replace: installReplace })
            var lines = []
            ;(result.installed || []).forEach(function (item) {
              lines.push((item.action === 'replaced' ? '↻ ' : '＋ ') + item.name + ' → ' + item.path + (item.backup ? '（旧版在 ' + item.backup + '）' : ''))
            })
            ;(result.skipped || []).forEach(function (item) { lines.push('跳过 ' + item.name + '：' + item.reason) })
            setInstallMsg(lines.join(' / ') || '没有要装的')
            setInstallPreview(null)
          } catch (failure) {
            setInstallMsg(failure.message)
          } finally {
            setInstallBusy(false)
          }
        }

        function useRole(team, role) {
          var text = buildRolePrompt(team, role)
          var outcome = insertText(text)
          if (outcome === 'inserted') {
            setFlash('已插入「' + role.title + '」的任务书')
            setTimeout(function () { setOpen(false) }, 520)
          } else {
            setFlash('没找到输入框')
          }
        }

        var skills = data && Array.isArray(data.skills) ? data.skills : []
        var teams = data && Array.isArray(data.teams) ? data.teams : []
        var needle = query.trim().toLowerCase()
        var matches = skills.filter(function (skill) {
          if (needle === '') return true
          return (skill.name + ' ' + (skill.description || '')).toLowerCase().indexOf(needle) >= 0
        })
        var currentTeam = teams.filter(function (team) { return team.id === teamId })[0] || teams[0] || null

        // One control, two segments: 「技能」opens the panel, the icon segment jumps
        // straight to the install tab. They share one border so they read as a
        // single module in the composer toolbar instead of two loose chips.
        var button = h(
          'button',
          {
            type: 'button',
            ref: buttonRef,
            className: 'sh-dockseg' + (open ? ' on' : ''),
            title: '技能中枢：插入 skill、按角色插入任务书、或打开设置',
            'aria-label': '技能中枢',
            onMouseDown: function (event) { event.preventDefault() },
            onClick: function (event) { event.preventDefault(); event.stopPropagation(); toggle() },
          },
          h(
            'svg',
            { viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
            h('path', { d: 'M2.5 2.5h4.2v4.2H2.5zM9.3 2.5h4.2v4.2H9.3zM2.5 9.3h4.2v4.2H2.5zM9.3 9.3h4.2v4.2H9.3z', stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linejoin': 'round' }),
          ),
          '技能',
          h('span', { className: 'sh-dockseg-caret' }, '▴'),
        )

        var installButton = h(
          'button',
          {
            type: 'button',
            className: 'sh-dockseg sh-dockseg-icon' + (open && tab === 'install' ? ' on' : ''),
            title: '安装 skill（真实目录 / 同名替换进 _trash）',
            'aria-label': '安装 skill',
            onMouseDown: function (event) { event.preventDefault() },
            onClick: function (event) {
              event.preventDefault()
              event.stopPropagation()
              if (open && tab === 'install') { setOpen(false); return }
              openMenu('install')
            },
          },
          h(
            'svg',
            { viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
            h('path', { d: 'M8 2.2v6.6M5.3 6.2 8 8.9l2.7-2.7M2.6 11.4v1.4a1 1 0 0 0 1 1h8.8a1 1 0 0 0 1-1v-1.4', stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
          ),
        )

        var group = h('span', { className: 'sh-dockgroup', role: 'group', 'aria-label': '技能中枢' }, button, installButton)

        if (!open) return group

        var panel = h(
          'div',
          {
            id: 'skill-hub-menu',
            ref: menuRef,
            className: 'sh-menu',
            'data-sh-theme': CURRENT_THEME,
            role: 'dialog',
            'aria-label': '技能中枢',
            'data-tab': tab,
          },
          h(
            'div',
            { className: 'sh-menu-head' },
            h('span', { className: 'sh-menu-title' }, '技能中枢'),
            h('span', { className: 'sh-spacer', style: { flex: 1 } }),
            h(
              'button',
              {
                type: 'button',
                className: 'sh-btn',
                style: { padding: '1px 7px' },
                onClick: function () { setOpen(false) },
              },
              '×',
            ),
          ),
          h(
            'div',
            { className: 'sh-menu-tabs' },
            h(
              'button',
              { type: 'button', className: 'sh-menu-tab' + (tab === 'skill' ? ' on' : ''), onClick: function () { setTab('skill') } },
              '技能',
            ),
            h(
              'button',
              { type: 'button', className: 'sh-menu-tab' + (tab === 'team' ? ' on' : ''), onClick: function () { setTab('team') } },
              '专家团',
            ),
            h(
              'button',
              { type: 'button', className: 'sh-menu-tab' + (tab === 'install' ? ' on' : ''), onClick: function () { setTab('install') } },
              '安装',
            ),
          ),
          h(
            'div',
            { className: 'sh-menu-body' },
            tab === 'skill'
              ? h(
                  'div',
                  null,
                  h('input', {
                    className: 'sh-input sh-mini',
                    placeholder: '搜 ' + skills.length + ' 个 skill，点一行就插入',
                    value: query,
                    autoFocus: true,
                    onChange: function (event) { setQuery(event.target.value) },
                  }),
                  h(
                    'div',
                    { style: { marginTop: '6px' } },
                    matches.map(function (skill) {
                      return h(
                        'div',
                        { key: skill.name, className: 'sh-menu-row' },
                        h(
                          'div',
                          { className: 'sh-menu-row-main', onClick: function () { useSkill(skill, false) } },
                          h('div', { className: 'sh-menu-row-name' }, '/' + skill.name),
                          skill.description
                            ? h('div', { className: 'sh-menu-row-desc' }, firstSentence(skill.description, 90))
                            : null,
                        ),
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'sh-btn',
                            style: { padding: '1px 7px', fontSize: '10.5px', flexShrink: 0 },
                            title: '连提示词一起插入',
                            onClick: function (event) { event.stopPropagation(); useSkill(skill, true) },
                          },
                          '＋提示词',
                        ),
                      )
                    }),
                  ),
                )
              : tab === 'team'
                ? h(
                  'div',
                  null,
                  h(
                    'div',
                    { className: 'sh-chips', style: { marginBottom: '8px' } },
                    teams.map(function (team) {
                      return h(
                        'button',
                        {
                          key: team.id,
                          type: 'button',
                          className: 'sh-chip' + (currentTeam && currentTeam.id === team.id ? ' on' : ''),
                          onClick: function () { setTeamId(team.id) },
                        },
                        h('span', { className: 'sh-chip-dot' }),
                        team.title,
                      )
                    }),
                  ),
                  currentTeam
                    ? h(
                        'div',
                        { className: 'sh-menu-card' },
                        h(
                          'div',
                          { className: 'sh-menu-cardhead' },
                          h(
                            'div',
                            null,
                            h('div', { className: 'sh-menu-row-name' },
                              glyph(currentTeam.id, 'team'),
                              h('span', null, currentTeam.title)),
                            h('div', { className: 'sh-menu-row-desc' },
                              (currentTeam.roles || []).length + ' 个角色 · ' + (currentTeam.stages || []).length + ' 步'),
                          ),
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'sh-btn primary',
                              style: { flexShrink: 0 },
                              onClick: function () { useTeam(currentTeam) },
                            },
                            '插入完整任务书',
                          ),
                        ),
                        currentTeam.goal
                          ? h('div', { className: 'sh-menu-goal' }, currentTeam.goal)
                          : null,
                        h('div', { className: 'sh-menu-section' }, '分工'),
                        (currentTeam.roles || []).map(function (role) {
                          var skillCount = (role.skills || []).length
                          return h(
                            'div',
                            { key: 'role-' + role.id, className: 'sh-menu-line' },
                            h('span', { className: 'sh-menu-line-name' }, role.title),
                            h('span', { className: 'sh-menu-line-meta' },
                              (skillCount ? skillCount + ' skill' : '无 skill') +
                                (role.deliverable ? ' · ' + role.deliverable : '')),
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'sh-linkbtn',
                                onClick: function () { useRole(currentTeam, role) },
                              },
                              '只插入该角色',
                            ),
                          )
                        }),
                        (currentTeam.stages || []).length
                          ? h('div', { className: 'sh-menu-section' }, '流程')
                          : null,
                        (currentTeam.stages || []).map(function (stage, index) {
                          var owners = (stage.roleIds || []).map(function (id) {
                            var hit = (currentTeam.roles || []).filter(function (role) { return role.id === id })[0]
                            return hit ? hit.title : id
                          })
                          return h(
                            'div',
                            { key: 'stage-' + stage.id + index, className: 'sh-menu-line' },
                            h('span', { className: 'sh-menu-idx' }, String(index + 1)),
                            h('span', { className: 'sh-menu-line-name' }, stage.title || '未命名'),
                            h('span', { className: 'sh-menu-line-meta' },
                              (owners.join(' + ') || '未指派') + (stage.deliverable ? ' → ' + stage.deliverable : '')),
                          )
                        }),
                      )
                    : h('div', { className: 'sh-empty' }, data === null ? '读取中…' : '还没有专家团'),
                )
              : h(
                  'div',
                  null,
                  h('div', { className: 'sh-menu-section' }, '按技能中枢规则安装'),
                  h('p', { className: 'sh-hint', style: { margin: '0 0 8px' } },
                    '装进 ~/.agents/skills（真实目录，不用软链）；同名已存在只能替换，旧版进 _trash；装完即用，当前会话重启后可见。'),
                  h('div', { className: 'sh-menu-form' },
                    h('input', {
                      className: 'sh-input sh-mini',
                      placeholder: 'owner/repo 或 https://github.com/owner/repo',
                      value: installSource,
                      onChange: function (event) { setInstallSource(event.target.value) },
                    }),
                    h('button', {
                      type: 'button',
                      className: 'sh-btn',
                      disabled: installBusy || installSource.trim() === '',
                      onClick: function () { previewInstall(installSource.trim()) },
                    }, installBusy ? '处理中…' : '预览'),
                  ),
                  installPreview
                    ? h(
                        'div',
                        { className: 'sh-menu-card', style: { marginTop: '8px' } },
                        h('div', { className: 'sh-menu-cardhead' },
                          h('div', null,
                            h('div', { className: 'sh-menu-row-name' },
                              installPreview.source + '（' + (installPreview.candidates || []).length + ' 个 skill'
                              + (installPreview.duplicateCount ? '；仓库里有 ' + installPreview.duplicateCount + ' 份同名副本，已择一' : '') + '）'),
                            h('div', { className: 'sh-menu-row-desc' }, '目标：' + (installPreview.target || '')),
                          ),
                          h('button', {
                            type: 'button',
                            className: 'sh-btn primary',
                            disabled: installBusy,
                            onClick: function () { doInstall() },
                          }, '安装'),
                        ),
                        (installPreview.candidates || []).map(function (item) {
                          var has = (installPreview.existing || []).indexOf(item.name) >= 0
                          return h(
                            'label',
                            { key: 'inst-' + item.name, className: 'sh-menu-line', style: { cursor: 'pointer' } },
                            h('input', {
                              type: 'checkbox',
                              checked: installPicked[item.name] !== false,
                              onChange: function (event) {
                                var next = Object.assign({}, installPicked)
                                next[item.name] = event.target.checked
                                setInstallPicked(next)
                              },
                            }),
                            h('span', { className: 'sh-menu-line-name' }, item.name),
                            h('span', { className: 'sh-menu-line-meta' },
                              (has ? '主库已有 · ' : '') + (item.skills || []).length + ' 个文件 · ' + item.relPath),
                          )
                        }),
                        h('label', { className: 'sh-check', style: { marginTop: '6px' } },
                          h('input', {
                            type: 'checkbox',
                            checked: installReplace,
                            onChange: function (event) { setInstallReplace(event.target.checked) },
                          }),
                          '替换主库里同名的（旧目录进 _trash，可回退）',
                        ),
                      )
                    : null,
                  installMsg ? h('div', { className: 'sh-note ok', style: { marginTop: '8px' } }, installMsg) : null,
                ),
          ),
          h(
            'div',
            { className: 'sh-menu-foot' },
            flash ? h('span', { className: 'sh-flash' }, flash) : h('span', { className: 'sh-hint' }, '点名字直接插入到输入框'),
            h('span', { className: 'sh-spacer', style: { flex: 1 } }),
            h(
              'button',
              {
                type: 'button',
                className: 'sh-btn',
                onClick: function () {
                  var opened = openSection(slots)
                  if (opened) setOpen(false)
                  else setFlash('打不开设置：按 ⇧⌘K，或手动 设置 → 技能中枢')
                },
              },
              '打开设置',
            ),
          ),
        )

        return react.createElement(react.Fragment, null, group, panel)
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

        var HubButton = makeHubMenu(react, scope.slots)
        scope.slots.inject('conversation.input.left', function* () {
          yield scope.slots.register({
            name: 'conversation.input.left',
            id: 'skill-hub-button',
            order: 60,
          }, HubButton)
        })
        scope.slots.inject('settings.section.icon', function* () {
          yield scope.slots.register(
            { name: 'settings.section.icon', id: 'skill-hub', order: 60, label: '技能中枢' },
            Icon,
          )
        })

        // Shortcut lives in its own injection: if the shortcuts service is
        // absent the settings UI must still mount.
        if (typeof scope.inject === 'function') {
          scope.inject(['shortcuts'], function (keys) {
            listenLocally(keys, scope.slots)
            if (typeof keys.effect === 'function') {
              keys.effect(function () { return registerShortcut(keys, scope.slots) }, 'skill-hub: shortcut')
            } else {
              registerShortcut(keys, scope.slots)
            }
          })
        }
      })
    }

    exports.__prompts = { skill: buildSkillPrompt, role: buildRolePrompt, team: buildTeamPrompt, sentence: firstSentence }
    exports.__glyphs = { paths: GLYPH_PATHS, categories: CATEGORY_GLYPH, teams: TEAM_GLYPH, name: glyphName }
    exports.apply = apply
    exports.inject = []
    return module.exports
  },
})
