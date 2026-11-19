// Which shell are we talking to, and how does *that* shell spell
// "export a variable" and "keep it forever"?
//
// The plugin never edits a dotfile — it prints one line and names the file the
// line belongs in. Getting the file and the syntax right per shell is the whole
// job here: `export VAR="$(…)"` is a syntax error in fish, and `~/.zshrc` is
// invisible to the non-interactive shells an agent runs.

import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * Mainstream shells only. Anything exotic can pass `shell: 'posix'` and adapt
 * the one line itself.
 */
export const SHELLS = {
  zsh: {
    id: 'zsh',
    label: 'zsh',
    // .zshenv is read by *every* zsh — interactive or not, login or not.
    profile: (home) => join(home, '.zshenv'),
    profileLabel: '~/.zshenv',
    exportLine: (name, read) => `export ${name}="$(${read})"`,
    note: '~/.zshenv 对交互和非交互 zsh 都生效；~/.zshrc 只对交互 shell 生效，agent 跑命令时读不到。',
  },
  bash: {
    id: 'bash',
    label: 'bash',
    profile: (home) => join(home, '.bashrc'),
    profileLabel: '~/.bashrc',
    exportLine: (name, read) => `export ${name}="$(${read})"`,
    note: '~/.bashrc 只对交互 bash 生效；要让非交互 bash 也拿到，可设 BASH_ENV=~/.bashenv 并把同一行放进去。',
  },
  posix: {
    id: 'posix',
    label: 'sh / dash / ksh',
    profile: (home) => join(home, '.profile'),
    profileLabel: '~/.profile',
    exportLine: (name, read) => `export ${name}="$(${read})"`,
    note: '~/.profile 在登录 shell 里生效；非交互 sh 不读它，最稳的是用的时候现取。',
  },
  fish: {
    id: 'fish',
    label: 'fish',
    profile: (home) => join(home, '.config', 'fish', 'config.fish'),
    profileLabel: '~/.config/fish/config.fish',
    // fish has no $() and no `export`: the command substitution is `(…)`.
    exportLine: (name, read) => `set -gx ${name} (${read})`,
    note: 'fish 用 set -gx，不能写 export；config.fish 对新开的每个 fish 生效。',
  },
  powershell: {
    id: 'powershell',
    label: 'PowerShell (pwsh / Windows PowerShell)',
    profile: () => '$PROFILE',
    profileLabel: '$PROFILE',
    exportLine: (name, read) => `$env:${name} = ${read}`,
    note: '把这一行加进 $PROFILE（`echo $PROFILE` 看路径）；只对当前会话生效时直接在终端里跑。',
  },
  cmd: {
    id: 'cmd',
    label: 'cmd.exe',
    profile: null,
    profileLabel: '',
    // cmd has no real profile: read through PowerShell, keep with setx.
    exportLine: (name, read) => `for /f "usebackq delims=" %A in (\`${read}\`) do set "${name}=%A"`,
    persistLine: (name) => `setx ${name} "…"`,
    note: 'cmd 没有 profile 文件：本会话用上面的 for /f，要持久用 setx（对之后新开的窗口生效）。',
  },
}

export const SHELL_IDS = Object.keys(SHELLS)

/** `{ id, label }` pairs for the settings UI's shell picker. */
export const SHELL_LIST = Object.values(SHELLS).map(({ id, label }) => ({ id, label }))

/** Map a `$SHELL` path (/bin/zsh, /usr/local/bin/fish) onto one of our ids. */
export function shellFromPath(path) {
  const base = String(path ?? '').split(/[\\/]/).pop()?.toLowerCase() ?? ''
  if (!base) return ''
  if (base.includes('zsh')) return 'zsh'
  if (base.includes('fish')) return 'fish'
  if (base.includes('bash')) return 'bash'
  if (base.includes('pwsh') || base.includes('powershell')) return 'powershell'
  if (base === 'cmd.exe' || base === 'cmd') return 'cmd'
  if (base === 'sh' || base === 'dash' || base === 'ksh' || base === 'ash' || base === 'busybox') return 'posix'
  return ''
}

/**
 * Best guess for "the shell this person actually types in".
 * Explicit choice wins, then `$SHELL`, then the platform default.
 */
export function detectShell({ shell = '', env = process.env, platform = process.platform } = {}) {
  const named = String(shell ?? '').trim().toLowerCase()
  if (SHELLS[named]) return named
  const fromPath = shellFromPath(env?.SHELL) || shellFromPath(env?.ComSpec)
  if (fromPath) return fromPath
  if (platform === 'win32') return 'powershell'
  return 'zsh'
}

/**
 * The "persist this variable" block for one shell: the file it belongs in and
 * the exact line, so the user can append it themselves.
 */
export function persistFor({ shell, env: name, read, home = homedir() } = {}) {
  const id = SHELLS[shell] ? shell : 'zsh'
  const spec = SHELLS[id]
  const line = spec.exportLine(name, read)
  const file = spec.profile ? spec.profile(home) : ''
  return {
    shell: id,
    label: spec.label,
    file,
    fileLabel: spec.profileLabel,
    line,
    note: spec.note,
  }
}
