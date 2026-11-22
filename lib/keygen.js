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
export const STORES = [
  { id: 'keychain', label: '系统钥匙串', hint: '最稳妥：密钥交给系统保管，dotfile 里只有一条取值命令。' },
  { id: 'file', label: '私有文件', hint: '钥匙串连不上时的替代：存到 ~/.agents/secrets/，权限 600。' },
  { id: 'dotfile', label: '直接写进 dotfile', hint: '最省事也最不安全：明文会留在 shell 启动文件里。' },
]

export const ENV_RE_STORE = /^(keychain|file|dotfile)$/
export function secretPath(service) {
  const safe = String(service).replace(/[^A-Za-z0-9._-]/g, '_')
  return `~/.agents/secrets/${safe}`
}

export function buildKeyScript({ env, service, account = process.env.USER ?? 'default', platform, shell, store = 'keychain' } = {}) {
  const name = String(env ?? '').trim()
  const svc = String(service ?? '').trim() || name.toLowerCase().replace(/_/g, '-')
  const acct = String(account ?? '').trim() || 'default'
  const os = detectPlatform(platform)
  const picked = SHELLS[shell] ? shell : detectShell({ platform: os === 'win32' ? 'win32' : 'darwin' })
  // PowerShell/cmd lines only make sense on Windows; on macOS/Linux a stray
  // choice falls back to the POSIX spelling instead of emitting nonsense.
  const sh = os === 'win32' ? picked : picked === 'powershell' || picked === 'cmd' ? 'posix' : picked

  const where = ENV_RE_STORE.test(String(store)) ? String(store) : 'keychain'
  if (!ENV_RE.test(name)) {
    return { ok: false, error: '环境变量名需形如 WEREAD_API_KEY（大写字母开头，仅 A-Z 0-9 _）' }
  }
  if (!TOKEN_RE.test(svc)) return { ok: false, error: '服务名只能包含字母、数字和 . _ : @ + - 空格' }
  if (!TOKEN_RE.test(acct)) return { ok: false, error: '账号只能包含字母、数字和 . _ : @ + - 空格' }

  const keychainService = `skill-hub:${svc.trim()}`

  if (where !== 'keychain') {
    const path = secretPath(svc.trim())
    const posixRead = `cat ${path}`
    if (where === 'file') {
      if (os === 'win32') {
        const winPath = `$env:USERPROFILE\\.agents\\secrets\\${svc.trim().replace(/[^A-Za-z0-9._-]/g, '_')}.txt`
        return {
          ok: true, platform: os, placeholder: PLACEHOLDER, env: name, service: svc.trim(), account: acct,
          store: 'file', shell: sh,
          add: `$d = "$env:USERPROFILE\\.agents\\secrets"; New-Item -ItemType Directory -Force -Path $d | Out-Null\nSet-Content -Path "${winPath}" -Value ${q(PLACEHOLDER)} -NoNewline\n(Get-Item "${winPath}").Attributes = 'Hidden'`,
          addPrompt: `$d = "$env:USERPROFILE\\.agents\\secrets"; New-Item -ItemType Directory -Force -Path $d | Out-Null\n$s = Read-Host -AsSecureString -Prompt '把密钥粘进来（不回显）'\n[Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)) | Set-Content -Path "${winPath}" -NoNewline`,
          read: `Get-Content "${winPath}" -Raw`,
          export: sh === 'cmd' ? `for /f "usebackq delims=" %A in (\`type "${winPath}"\`) do set "${name}=%A"` : `$env:${name} = Get-Content "${winPath}" -Raw`,
          persist: persistFor({ shell: sh === 'cmd' ? 'powershell' : sh, env: name, read: `Get-Content "${winPath}" -Raw` }),
          remove: `Remove-Item "${winPath}" -ErrorAction SilentlyContinue`,
          verify: `if (Test-Path "${winPath}") { "${name} OK" } else { "${name} MISSING" }`,
          note: '文件只有你能读；把它拖进同步盘或备份就会跟着走，注意目录权限。',
        }
      }
      return {
        ok: true, platform: os, placeholder: PLACEHOLDER, env: name, service: svc.trim(), account: acct,
        store: 'file', shell: sh,
        add: `mkdir -p ~/.agents/secrets && umask 077 && printf '%s' ${q(PLACEHOLDER)} > ${path}`,
        addPrompt: `mkdir -p ~/.agents/secrets && umask 077 && read -r -s "?把密钥粘进来（不回显）: " v && printf '%s' "$v" > ${path} && unset v && echo " 已写入 ${path}"`,
        read: posixRead,
        export: SHELLS[sh].exportLine(name, posixRead),
        persist: persistFor({ shell: sh, env: name, read: posixRead }),
        remove: `rm -f ${path}`,
        verify: `test -s ${path} && echo "${name} OK"`,
        note: '钥匙串连不上（比如沙箱 / SSH）时用这个：文件权限 600，只有你的账号能读。',
      }
    }
    // dotfile: 明文写进 shell 启动文件
    const line = sh === 'fish' ? `set -gx ${name} ${q(PLACEHOLDER)}` : sh === 'powershell' ? `$env:${name} = ${q(PLACEHOLDER)}` : `export ${name}=${q(PLACEHOLDER)}`
    const base = persistFor({ shell: sh, env: name, read: q(PLACEHOLDER) })
    const persist = { ...base, line, note: '这一行就是明文本身：写进启动文件后，任何能读这个文件的人都能拿到密钥。' }
    return {
      ok: true, platform: os, placeholder: PLACEHOLDER, env: name, service: svc.trim(), account: acct,
      store: 'dotfile', shell: sh,
      add: `printf '%s\\n' ${q(line)} >> ${persist.file || '你的 shell 配置文件'}`,
      addPrompt: `printf '%s\\n' ${q(line)} >> ${persist.file || '你的 shell 配置文件'}`,
      read: `printf '%s' "$${name}"`,
      export: line,
      persist,
      remove: `# 手动编辑 ${persist.file || 'shell 启动文件'}，删掉以 ${name} 开头的那一行`,
      verify: `echo \"$${name}\" | wc -c`,
      note: '明文会留在启动文件里（也会进 shell 历史）：只在这台机器、这个账号不共享时用。',
    }
  }


  if (os === 'darwin') {
    const find = `security find-generic-password -s ${q(keychainService)} -a ${q(acct)} -w`
    return {
      ok: true,
      platform: os,
      placeholder: PLACEHOLDER,
      env: name,
      service: keychainService,
      store: 'keychain',
      store: 'keychain',
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
    store: 'keychain',
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

// ---------------------------------------------------------------------------
// Is the platform's credential tool actually installed?
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process'

function hasBinary(name) {
  try {
    execFileSync(process.platform === 'win32' ? 'where' : 'which', [name], { stdio: 'ignore', timeout: 3000 })
    return true
  } catch {
    return false
  }
}

/**
 * macOS ships `security`; Windows ships PowerShell; Linux needs
 * gnome-keyring/libsecret (`secret-tool`) installed by the user. Reporting that
 * up front beats a command that fails with "command not found".
 */
export function keyToolInfo(platform = process.platform, { exists = hasBinary } = {}) {
  const os = detectPlatform(platform)
  if (os === 'darwin') {
    return { platform: os, tool: 'security', available: exists('security'), hint: '' }
  }
  if (os === 'win32') {
    return { platform: os, tool: 'powershell', available: exists('powershell'), hint: '' }
  }
  const available = exists('secret-tool')
  return {
    platform: os,
    tool: 'secret-tool',
    available,
    hint: available
      ? ''
      : '没有 secret-tool（libsecret）。装一个：apt install libsecret-tools / dnf install libsecret，或者把密钥用 gpg 加密后存文件。',
  }
}

/**
 * Is the platform credential store actually reachable *from this process*?
 * `security list-keychains` only reads the search list — if even that fails,
 * the caller is in a session that cannot talk to securityd (sandbox / SSH /
 * container), and any `add-generic-password` we print will fail the same way.
 * That is a situation to report, not to paper over with per-machine commands.
 */
export function keychainCheck({ platform = process.platform, run = defaultRun } = {}) {
  const os = detectPlatform(platform)
  if (os === 'darwin') {
    const r = run('security', ['list-keychains'])
    if (r.ok) return { platform: os, tool: 'security', ready: true, code: 0, hint: '', detail: String(r.stdout || '').trim().split('\n').filter(Boolean).join(' ') }
    const detail = `${r.stderr || r.stdout || ''}`.trim()
    const moduleDir = /Module Directory Service/i.test(detail)
    return {
      platform: os,
      tool: 'security',
      ready: false,
      code: r.code ?? -1,
      detail,
      hint: moduleDir
        ? '当前进程连不上本机钥匙串服务（securityd）——常见于沙箱 / SSH / 容器里的 agent 会话，不是 key 存错了。改用「私有文件」或「直接写进 dotfile」，或把命令投到 Terminal.app 里执行。'
        : `\`security list-keychains\` 失败（code ${r.code ?? '?'}）：钥匙串可能被锁定，或当前会话无权访问。`,
    }
  }
  if (os === 'win32') {
    const r = run('powershell', ['-NoProfile', '-Command', 'Get-Command ConvertFrom-SecureString | Out-Null; exit 0'])
    return r.ok
      ? { platform: os, tool: 'powershell', ready: true, code: 0, hint: '', detail: 'PowerShell 可用' }
      : { platform: os, tool: 'powershell', ready: false, code: r.code ?? -1, detail: `${r.stderr || ''}`.trim(), hint: 'PowerShell 不可用，改用「私有文件」把 key 存到 %USERPROFILE%\\.agents\\secrets。' }
  }
  const r = run('secret-tool', ['--version'])
  return r.ok
    ? { platform: os, tool: 'secret-tool', ready: true, code: 0, hint: '', detail: String(r.stdout || '').trim() }
    : { platform: os, tool: 'secret-tool', ready: false, code: r.code ?? -1, detail: `${r.stderr || ''}`.trim(), hint: '没有 secret-tool（libsecret）。装 libsecret-tools，或改用「私有文件」。' }
}

function defaultRun(bin, args) {
  try {
    const out = execFileSync(bin, args, { encoding: 'utf8', timeout: 4000, stdio: ['ignore', 'pipe', 'pipe'] })
    return { ok: true, code: 0, stdout: out, stderr: '' }
  } catch (error) {
    return {
      ok: false,
      code: typeof error?.status === 'number' ? error.status : -1,
      stdout: `${error?.stdout ?? ''}`,
      stderr: `${error?.stderr ?? error?.message ?? ''}`,
    }
  }
}
