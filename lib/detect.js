// Find the credential environment variables a skill expects.
//
// A skill that needs a third-party key names it somewhere in its own text:
// `$WEREAD_API_KEY`, `${AMAP_KEY}`, `process.env.OPENAI_API_KEY`,
// `export FOO_TOKEN=`. This module reads the skill's SKILL.md (plus a few small
// sibling text files) and collects those names so the settings page can offer
// them instead of asking the user to remember an exact variable name.

import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { firstLine } from './frontmatter.js'

const SKILL_FILE = 'SKILL.md'

/** Variables the shell guarantees; never a third-party key. */
const SHELL_NOISE = new Set([
  'PATH', 'HOME', 'PWD', 'OLDPWD', 'SHELL', 'USER', 'LOGNAME', 'TMPDIR', 'LANG', 'LC_ALL',
  'TERM', 'TERM_PROGRAM', 'HOSTNAME', 'RANDOM', 'SECONDS', 'LINENO', 'IFS', 'PS1', 'OLDPWD',
  'NODE_ENV', 'PAGER', 'EDITOR', 'VISUAL', 'TZ', 'SHLVL', 'OSTYPE', 'MACHTYPE', 'HOSTTYPE',
  'XDG_CONFIG_HOME', 'XDG_CACHE_HOME', 'XDG_DATA_HOME', 'DISPLAY', 'SSH_AUTH_SOCK',
])

/**
 * A name worth offering: the credential word has to be its own trailing/主 token.
 * `OPENAI_API_KEY` passes; `AMAP_API_BASE_URL` and `API_BUSINESS` do not.
 */
const CREDENTIALISH = /(?:^|_)(KEY|TOKEN|SECRET|PASSWORD|PASSWD|COOKIE|CREDENTIAL|AUTH|SESSION|AK)(?:_|$)/i

/**
 * Names that sit next to a key but are not one: endpoint overrides, model ids,
 * and the "which variable holds the key" pointers that shells love.
 */
const CONFIG_SUFFIX = /_(ENV|URL|URI|BASE|HOST|PORT|ENDPOINT|PATH|DIR|FILE|MODEL|MODE|DIALECT|PREFIX|SUFFIX|HEADER|NAME|REGION|TIMEOUT|LIMIT|TYPE|SCOPE|VERSION)$/i

/** Reads that never count: prose mentions of a generic word. */
const TOO_GENERIC = /^(API|AUTH|KEY|TOKEN|SECRET|SESSION)$/

const TEXT_EXT = new Set(['.md', '.txt', '.sh', '.bash', '.zsh', '.js', '.mjs', '.cjs', '.ts', '.py', '.rb', '.json', '.yaml', '.yml', '.toml'])
const SKIP_DIR = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'vendor'])

const MAX_FILES = 24
const MAX_BYTES = 512 * 1024

async function listFiles(dir, depth = 0, out = []) {
  if (depth > 2 || out.length >= MAX_FILES) return out
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    if (out.length >= MAX_FILES) break
    if (entry.name.startsWith('.') || SKIP_DIR.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await listFiles(full, depth + 1, out)
      continue
    }
    if (!entry.isFile()) continue
    const dot = entry.name.lastIndexOf('.')
    const ext = dot >= 0 ? entry.name.slice(dot).toLowerCase() : ''
    if (!TEXT_EXT.has(ext)) continue
    out.push({ path: full, name: entry.name, ext })
  }
  return out
}

function pushName(found, name, line, weight) {
  if (!name || !/^[A-Z][A-Z0-9_]{2,63}$/.test(name)) return
  if (SHELL_NOISE.has(name) || TOO_GENERIC.test(name)) return
  if (!CREDENTIALISH.test(name)) return
  if (CONFIG_SUFFIX.test(name)) return
  const entry = found.get(name) ?? { env: name, hits: 0, samples: [], weight: 0 }
  entry.hits += 1
  entry.weight += weight
  if (line && entry.samples.length < 3) {
    const text = firstLine(line, 160)
    if (text && !entry.samples.includes(text)) entry.samples.push(text)
  }
  found.set(name, entry)
}

/** Ordered, de-duplicated candidate variable names from one file's text. */
export function extractEnvNames(text, { weight = 1 } = {}) {
  const found = new Map()
  if (!text) return []
  const lines = String(text).split('\n')

  // `$NAME` / `${NAME}` / `process.env.NAME` / `NAME=` / `"NAME":` — the four
  // shapes skills actually use. Each line is scanned once per shape so a repeat
  // mention on the same line still counts as one hit.
  const patterns = [
    /\$\{([A-Z][A-Z0-9_]{2,63})\}/g,
    /\$([A-Z][A-Z0-9_]{2,63})\b/g,
    /process\.env\.([A-Z][A-Z0-9_]{2,63})/g,
    /(?:^|[\s{,"'])([A-Z][A-Z0-9_]{2,63})["']?\s*[=:]/g,
  ]

  for (const line of lines) {
    const seen = new Set()
    for (const pattern of patterns) {
      pattern.lastIndex = 0
      let match
      while ((match = pattern.exec(line)) !== null) {
        const name = match[1]
        if (seen.has(name)) continue
        seen.add(name)
        pushName(found, name, line, weight)
      }
    }
  }

  return [...found.values()].sort((a, b) => b.weight - a.weight || b.hits - a.hits || a.env.localeCompare(b.env))
}

/**
 * Every credential variable a skill mentions, with the lines that mention it.
 * @param {string} dir absolute path of the skill directory
 */
export async function detectEnvVars(dir, { platform = process.platform } = {}) {
  let info
  try {
    info = await stat(dir)
  } catch {
    return { ok: false, error: `目录不存在：${dir}` }
  }
  if (!info.isDirectory()) return { ok: false, error: `不是目录：${dir}` }

  const skillFile = join(dir, SKILL_FILE)
  let skillText
  try {
    skillText = await readFile(skillFile, 'utf8')
  } catch {
    return { ok: false, error: `${dir} 下没有 ${SKILL_FILE}` }
  }

  const found = new Map()
  const merge = (list) => {
    for (const item of list) {
      const entry = found.get(item.env) ?? { env: item.env, hits: 0, samples: [], weight: 0 }
      entry.hits += item.hits
      entry.weight += item.weight
      for (const sample of item.samples) {
        if (entry.samples.length < 3 && !entry.samples.includes(sample)) entry.samples.push(sample)
      }
      found.set(item.env, entry)
    }
  }

  // SKILL.md weighs most: that is where the install instructions live.
  merge(extractEnvNames(skillText, { weight: 4 }))

  let budget = MAX_BYTES - Buffer.byteLength(skillText, 'utf8')
  const files = await listFiles(dir)
  for (const file of files) {
    if (file.path === skillFile) continue
    if (budget <= 0) break
    let text
    try {
      text = await readFile(file.path, 'utf8')
    } catch {
      continue
    }
    budget -= Buffer.byteLength(text, 'utf8')
    merge(extractEnvNames(text, { weight: 1 }))
  }

  const vars = [...found.values()].sort((a, b) => b.weight - a.weight || a.env.localeCompare(b.env))
  return {
    ok: true,
    dir,
    platform,
    files: Math.min(files.length, MAX_FILES),
    vars,
    hint: vars.length ? '' : '这个 skill 的正文里没有出现受支持的变量名（形如 $FOO_KEY），你可以手动填。',
  }
}

/** `weread-skills` → `weread`; used as the default keychain service name. */
export function suggestService(name, env) {
  // The env name is the better clue when it names a provider: OPENAI_API_KEY
  // inside a skill called "baoyu-image-gen" should still file under "openai".
  const fromEnv = String(env ?? '')
    .toLowerCase()
    .replace(/_?(secret_)?(access_)?(api_)?(key|token|ak|secret)(_id)?$/g, '')
    .replace(/_+$/g, '')
    .replace(/_/g, '-')
    .replace(/^-+|-+$/g, '')

  const base = String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-(skills?|plugin|tool)$/g, '')

  const pick = fromEnv.length >= 3 ? fromEnv : base
  return (pick || 'skill').slice(0, 40)
}
