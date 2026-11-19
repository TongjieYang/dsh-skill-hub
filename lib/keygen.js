// Generates the keychain commands a HUMAN runs themselves.
// The secret never passes through here as data: every script carries the
// literal placeholder `__SECRET__`, which the settings UI swaps for whatever
// the user typed (in the browser, never sent back to the host).

import { detectShell, persistFor, SHELLS } from './shell.js'

export const PLACEHOLDER = '__SECRET__'

export const PLATFORMS = [
  { id: 'darwin', label: 'macOS 钥匙串', tool: 'security' },
  { id: 'win32', label: 'Windows 凭据管理器 (DPAPI)', tool: 'powershell' },
  { id: 'linux', label: 'Linux Secret Service', tool: 'secret-tool' },
]

export function detectPlatform(platform = process.platform) {
  if (platform === 'darwin') return 'darwin'
  if (platform === 'win32') return 'win32'
  return 'linux'
}

export const ENV_RE = /^[A-Z][A-Z0-9_]{1,63}$/
export const TOKEN_RE = /^[A-Za-z0-9._:@+\- ]{1,80}$/

const q = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`

function windowsPath(service) {
  const safe = String(service).replace(/[^A-Za-z0-9._-]/g, '_')
  return `$env:USERPROFILE\\.config\\skill-hub\\${safe}.txt`
}

/**
 * Build the add / read / export / remove / verify snippets for one key.
 * Returns `{ ok:false, error }` on invalid input rather than throwing.
 */
export function buildKeyScript({ env, service, account = process.env.USER ?? 'default', platform, shell } = {}) {
  const name = String(env ?? '').trim()
  const svc = String(service ?? '').trim() || name.toLowerCase().replace(/_/g, '-')
  const acct = String(account ?? '').trim() || 'default'
  const os = detectPlatform(platform)
  const picked = SHELLS[shell] ? shell : detectShell({ platform: os === 'win32' ? 'win32' : 'darwin' })
  // PowerShell/cmd lines only make sense on Windows; on macOS/Linux a stray
  // choice falls back to the POSIX spelling instead of emitting nonsense.
  const sh = os === 'win32' ? picked : picked === 'powershell' || picked === 'cmd' ? 'posix' : picked

  if (!ENV_RE.test(name)) {
    return { ok: false, error: '环境变量名需形如 WEREAD_API_KEY（大写字母开头，仅 A-Z 0-9 _）' }
  }
  if (!TOKEN_RE.test(svc)) return { ok: false, error: '服务名只能包含字母、数字和 . _ : @ + - 空格' }
  if (!TOKEN_RE.test(acct)) return { ok: false, error: '账号只能包含字母、数字和 . _ : @ + - 空格' }

  const keychainService = `skill-hub:${svc.trim()}`

  if (os === 'darwin') {
    const find = `security find-generic-password -s ${q(keychainService)} -a ${q(acct)} -w`
    return {
      ok: true,
      platform: os,
      placeholder: PLACEHOLDER,
      env: name,
      service: keychainService,
      account: acct,
      add: `security add-generic-password -s ${q(keychainService)} -a ${q(acct)} -w ${q(PLACEHOLDER)} -U`,
      // Same item, but `-w` with no value makes `security` prompt for it with
      // echo off: the secret never lands in argv, so `.zsh_history` stays clean.
      addPrompt: `security add-generic-password -s ${q(keychainService)} -a ${q(acct)} -U -w`,
      read: find,
      export: SHELLS[sh].exportLine(name, find),
      persist: persistFor({ shell: sh, env: name, read: find }),
      shell: sh,
      remove: `security delete-generic-password -s ${q(keychainService)} -a ${q(acct)}`,
      verify: `${find} >/dev/null && echo "${name} OK"`,
      note: '命令只在你的终端里跑；跑完密钥就在钥匙串，源码和 skill 正文里都不再出现明文。',
    }
  }

  if (os === 'win32') {
    const file = windowsPath(svc)
    const psExpr =
      `[Runtime.InteropServices.Marshal]::PtrToStringAuto(` +
      `[Runtime.InteropServices.Marshal]::SecureStringToBSTR((Get-Content "${file}" | ConvertTo-SecureString)))`
    const exportLine =
      sh === 'cmd'
        ? `for /f "usebackq delims=" %A in (\`powershell -NoProfile -Command "${psExpr}"\`) do set "${name}=%A"`
        : `$env:${name} = ${psExpr}`
    const persist =
      sh === 'cmd'
        ? {
            shell: 'cmd',
            label: SHELLS.cmd.label,
            file: '',
            fileLabel: '',
            line: `setx ${name} "<值>"`,
            note: 'cmd 没有 profile：本会话用上面的 for /f，要持久用 setx（对之后新开的窗口生效）。',
          }
        : persistFor({ shell: 'powershell', env: name, read: psExpr })
    return {
      ok: true,
      platform: os,
      placeholder: PLACEHOLDER,
      env: name,
      service: keychainService,
      account: acct,
      add:
        `$dir = Join-Path $env:USERPROFILE '.config\\skill-hub'; New-Item -ItemType Directory -Force -Path $dir | Out-Null\n` +
        `ConvertTo-SecureString -String ${q(PLACEHOLDER)} -AsPlainText -Force | ConvertFrom-SecureString | Set-Content "${file}"`,
      addPrompt:
        `$secret = Read-Host -AsSecureString -Prompt '把密钥粘进来（不回显）'\n` +
        `$dir = Join-Path $env:USERPROFILE '.config\\skill-hub'; New-Item -ItemType Directory -Force -Path $dir | Out-Null\n` +
        `$secret | ConvertFrom-SecureString | Set-Content "${file}"`,
      read: `(Get-Content "${file}" | ConvertTo-SecureString)`,
      export: exportLine,
      persist,
      shell: sh,
      remove: `Remove-Item "${file}" -ErrorAction SilentlyContinue`,
      verify: `if (Test-Path "${file}") { "${name} OK" } else { "${name} MISSING" }`,
      note:
        sh === 'cmd'
          ? 'cmd 里用 for /f 读；写回 DPAPI 文件那两步仍要在 PowerShell 里跑。'
          : '用 PowerShell 跑；DPAPI 绑定当前 Windows 用户，文件被拷走也解不开。',
    }
  }

  return {
    ok: true,
    platform: 'linux',
    placeholder: PLACEHOLDER,
    env: name,
    service: keychainService,
    account: acct,
    add: `printf '%s' ${q(PLACEHOLDER)} | secret-tool store --label=${q(`skill-hub: ${svc}`)} service ${q(keychainService)} account ${q(acct)}`,
      // No pipe: `secret-tool store` reads the secret from stdin with echo off.
      addPrompt: `secret-tool store --label=${q(`skill-hub: ${svc}`)} service ${q(keychainService)} account ${q(acct)}`,
    read: `secret-tool lookup service ${q(keychainService)} account ${q(acct)}`,
    export: SHELLS[sh].exportLine(name, `secret-tool lookup service ${q(keychainService)} account ${q(acct)}`),
    persist: persistFor({ shell: sh, env: name, read: `secret-tool lookup service ${q(keychainService)} account ${q(acct)}` }),
    shell: sh,
    remove: `secret-tool clear service ${q(keychainService)} account ${q(acct)}`,
    verify: `secret-tool lookup service ${q(keychainService)} account ${q(acct)} >/dev/null && echo "${name} OK"`,
    note: '需要 gnome-keyring / KWallet；无桌面环境时 secret-tool 会失败，改用 gpg 加密文件。',
  }
}

/** One snippet that exports every registered key in the current shell. */
export function buildLoadAll(keys = [], platform, shell) {
  const os = detectPlatform(platform)
  const picked = SHELLS[shell] ? shell : detectShell({ platform: os === 'win32' ? 'win32' : 'darwin' })
  // PowerShell/cmd lines only make sense on Windows; on macOS/Linux a stray
  // choice falls back to the POSIX spelling instead of emitting nonsense.
  const sh = os === 'win32' ? picked : picked === 'powershell' || picked === 'cmd' ? 'posix' : picked
  const list = Array.isArray(keys) ? keys : []
  const lines = list
    .map((entry) => String(entry?.env ?? '').trim())
    .filter((env) => ENV_RE.test(env))
    .map((env) => {
      const entry = list.find((k) => k.env === env)
      const script = buildKeyScript({
        env,
        service: entry?.service ?? env,
        account: entry?.account ?? 'default',
        platform: os,
        shell: sh,
      })
      return script.ok ? script.export : null
    })
    .filter(Boolean)
  if (lines.length === 0) return { ok: true, platform: os, shell: sh, script: '' }
  const posix = sh === 'zsh' || sh === 'bash' || sh === 'posix'
  return {
    ok: true,
    platform: os,
    shell: sh,
    script: posix
      ? ['#!/bin/sh', '# 由 dsh-skill-hub 生成：从系统钥匙串取回全部 key', ...lines].join('\n')
      : ['# 由 dsh-skill-hub 生成：从系统钥匙串取回全部 key', ...lines].join('\n'),
  }
}
