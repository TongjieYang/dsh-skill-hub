import { scanSkills, defaultRoots } from './scan.js'
import { classify, categoryCounts, categoryById, CATEGORY_IDS } from './classify.js'
import { mergeTeams, normalizeTeam, missingSkills, builtinTeam, slugify, autoCompose, renderTeamSop, renderTeamSkill } from './teams.js'
import { buildKeyScript, buildLoadAll, detectPlatform, keyToolInfo, ENV_RE, PLATFORMS } from './keygen.js'
import { detectShell, SHELL_LIST } from './shell.js'
import { mkdir, appendFile, stat, rename, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  hubDir, loadConfig, saveConfig, readTeams, writeTeam, removeTeam,
  normalizeKeyEntry, paths,
} from './store.js'
import { detectEnvVars, suggestService } from './detect.js'
import { parseSource, previewSource, installSkills, cleanupPreview, defaultTarget } from './install.js'
import { readProfiles, profileStatus, buildBatch, buildPrompt, applyProfiles, resetProfiles } from './profile.js'
import { planUpdates, runUpdates } from './update.js'

async function exists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

/** Full snapshot for the settings page and the `skill_hub_scan` tool. */
export async function buildState({ dir = hubDir(), platform = process.platform } = {}) {
  const config = await loadConfig(dir)
  const roots = Array.isArray(config.roots) && config.roots.length > 0 ? config.roots : defaultRoots()
  const scan = await scanSkills({ roots, overrides: config.overrides })
  const userTeams = await readTeams(dir)
  const skillNames = new Set(scan.skills.map((s) => s.name))
  const teams = mergeTeams(userTeams).map((team) => ({
    ...team,
    missingSkills: missingSkills(team, skillNames),
  }))
  return {
    ok: true,
    scannedAt: scan.scannedAt,
    platform: detectPlatform(platform),
    platforms: PLATFORMS,
    shell: detectShell({ platform }),
    shells: SHELL_LIST,
    keyTool: keyToolInfo(platform),
    hubDir: dir,
    roots: scan.roots,
    skills: scan.skills,
    containers: scan.containers,
    shadowed: scan.shadowed,
    categories: categoryCounts(scan.skills),
    teams,
    keys: config.keys.map(normalizeKeyEntry),
    loadAll: buildLoadAll(config.keys, platform, detectShell({ platform })),
    settings: config.settings,
    warnings: scan.warnings,
  }
}

export function searchSkills(state, { query = '', category = '', limit = 40 } = {}) {
  const needle = String(query ?? '').trim().toLowerCase()
  const cat = String(category ?? '').trim()
  const max = Math.min(Math.max(Number(limit) || 40, 1), 200)
  const hits = state.skills.filter((skill) => {
    if (cat && skill.category !== cat) return false
    if (!needle) return true
    return (
      skill.name.toLowerCase().includes(needle) ||
      skill.description.toLowerCase().includes(needle) ||
      skill.dir.toLowerCase().includes(needle)
    )
  })
  return { total: hits.length, shown: hits.slice(0, max), limit: max }
}

/** One team rendered as the SOP text an agent can follow. */
export function renderTeam(team, stageId = '', skillNames = null) {
  const normalized = normalizeTeam(team)
  return renderTeamSop({ ...normalized, missingSkills: team?.missingSkills ?? [] }, { stageId, skillNames })
}

/** Fill blanks in one saved team and persist the result. */
export async function autoFillTeam({ dir = hubDir(), id }) {
  const teams = mergeTeams(await readTeams(dir))
  const team = teams.find((t) => t.id === id)
  if (!team) return { ok: false, error: `没有这个团：${id}` }
  const { team: filled, changes } = autoCompose(team)
  if (changes.length) await writeTeam(filled, dir)
  return { ok: true, team: { ...filled, missingSkills: team.missingSkills ?? [] }, changes }
}

/** Write one team as a real skill folder so every agent端都能用。 */
export async function exportTeamSkill({ dir = hubDir(), id, target = '', replace = false }) {
  const teams = mergeTeams(await readTeams(dir))
  const team = teams.find((t) => t.id === id)
  if (!team) return { ok: false, error: `没有这个团：${id}` }
  const { team: filled } = autoCompose(team)
  const base = target || defaultTarget()
  const skillName = `team-${filled.id}`
  const dest = join(base, skillName)
  const existed = await stat(dest).then(() => true).catch(() => false)
  if (existed && !replace) {
    return { ok: false, error: `已经存在同名目录：${dest}（要替换请带 replace）`, path: dest }
  }
  let backup = ''
  if (existed) {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const root = join(dirname(base), '_trash', stamp, 'skill-hub')
    await mkdir(root, { recursive: true })
    backup = join(root, skillName)
    for (let n = 2; existsSync(backup); n += 1) backup = join(root, `${skillName}-${n}`)
    await rename(dest, backup)
  }
  await mkdir(dest, { recursive: true })
  const text = renderTeamSkill({ ...filled, skillName })
  await writeFile(join(dest, 'SKILL.md'), text, 'utf8')
  return { ok: true, path: dest, skill: skillName, backup, replaced: existed, bytes: text.length }
}

export async function setOverride({ dir = hubDir(), name, category }) {
  const skillName = String(name ?? '').trim()
  if (!skillName) return { ok: false, error: '缺少 skill 名' }
  const config = await loadConfig(dir)
  const next = { ...config.overrides }
  const cat = String(category ?? '').trim()
  if (!cat) delete next[skillName]
  else if (!CATEGORY_IDS.includes(cat)) return { ok: false, error: `未知分类：${cat}` }
  else next[skillName] = cat
  await saveConfig({ ...config, overrides: next }, dir)
  return { ok: true, name: skillName, category: cat || null, auto: classify({ name: skillName }) }
}

export async function saveTeam({ dir = hubDir(), team }) {
  const normalized = normalizeTeam({ ...team, builtin: false })
  if (!normalized.title) return { ok: false, error: '团名不能为空' }
  if (!normalized.id || normalized.id !== team?.id) normalized.id = slugify(normalized.title)
  if (builtinTeam(normalized.id) && normalized.id !== team?.id) {
    return { ok: false, error: `id ${normalized.id} 与内置团冲突，请换一个名字` }
  }
  await writeTeam(normalized, dir)
  return { ok: true, team: normalized, path: paths.team(dir, normalized.id) }
}

export async function deleteTeam({ dir = hubDir(), id }) {
  const teamId = String(id ?? '').trim()
  if (!teamId) return { ok: false, error: '缺少 id' }
  await removeTeam(teamId, dir)
  return { ok: true, id: teamId }
}

export async function addKey({ dir = hubDir(), key, platform = process.platform }) {
  const entry = normalizeKeyEntry(key)
  if (!ENV_RE.test(entry.env)) return { ok: false, error: '环境变量名不合法' }
  const script = buildKeyScript({
    env: entry.env,
    service: entry.service || entry.env,
    account: entry.account,
    platform,
    shell: entry.shell,
  })
  if (!script.ok) return { ok: false, error: script.error }
  const config = await loadConfig(dir)
  const others = config.keys.filter((k) => normalizeKeyEntry(k).env !== entry.env)
  const next = [...others, { ...entry, service: script.service, shell: script.shell }]
  await saveConfig({ ...config, keys: next }, dir)
  return { ok: true, key: { ...entry, service: script.service }, script }
}

export async function removeKey({ dir = hubDir(), env }) {
  const name = String(env ?? '').trim()
  const config = await loadConfig(dir)
  const next = config.keys.filter((k) => normalizeKeyEntry(k).env !== name)
  await saveConfig({ ...config, keys: next }, dir)
  return { ok: true, env: name, script: buildKeyScript({ env: name, service: name }) }
}

/** Script template for a key that may not be registered yet. */
export function keyScript({ env, service, account, platform = process.platform, shell, note }) {
  const entry = normalizeKeyEntry({ env, service, account, note, platform })
  const script = buildKeyScript({ ...entry, shell })
  if (!script.ok) return { ok: false, error: script.error }
  return { ok: true, ...script }
}

export { categoryById }

// ---------------------------------------------------------------------------
// Credential detection + skill installation
// ---------------------------------------------------------------------------

const PREVIEW_TTL_MS = 15 * 60 * 1000
const PREVIEW_CACHE_LIMIT = 4
const previewCache = new Map()

/** Which credential variables does one installed skill ask for? */
export async function detectSkillKeys({ dir = hubDir(), skill = '', platform = process.platform } = {}) {
  const needle = String(skill ?? '').trim()
  if (!needle) return { ok: false, error: '先选一个 skill' }

  const state = await buildState({ dir, platform })
  const hit =
    state.skills.find((item) => item.name === needle) ??
    state.skills.find((item) => item.name.toLowerCase() === needle.toLowerCase())
  if (!hit) return { ok: false, error: `本机没有这个 skill：${needle}` }

  const detected = await detectEnvVars(hit.dir, { platform })
  if (!detected.ok) return detected

  return {
    ok: true,
    skill: {
      name: hit.name,
      dir: hit.dir,
      category: hit.category,
      source: hit.source,
      description: hit.description,
    },
    vars: detected.vars.map((item) => ({ ...item, service: suggestService(hit.name, item.env) })),
    files: detected.files,
    platform: detected.platform,
    hint: detected.hint,
  }
}

/** Clone a repo and describe what is inside it; nothing is written yet. */
export async function previewInstall({ source }) {
  const parsed = parseSource(source)
  if (!parsed.ok) return parsed

  const preview = await previewSource({ source })
  if (!preview.ok) return preview

  const key = String(source)
  const previous = previewCache.get(key)
  if (previous?.preview?.stage) await cleanupPreview(previous.preview).catch(() => {})

  previewCache.delete(key)
  previewCache.set(key, { preview, at: Date.now() })
  while (previewCache.size > PREVIEW_CACHE_LIMIT) {
    const [oldestKey, oldest] = previewCache.entries().next().value ?? []
    if (!oldestKey) break
    previewCache.delete(oldestKey)
    await cleanupPreview(oldest.preview).catch(() => {})
  }

  const target = defaultTarget()
  // Tell the UI up front which of these would replace something, so the
  // replacement is a decision the user sees rather than a surprise afterwards.
  const existing = []
  for (const item of preview.candidates) {
    if (await exists(join(target, item.name))) existing.push(item.name)
  }

  return {
    ok: true,
    source: preview.source,
    total: preview.total,
    duplicateCount: preview.duplicateCount ?? 0,
    candidates: preview.candidates,
    existing,
    target,
    ttlMinutes: Math.round(PREVIEW_TTL_MS / 60000),
  }
}

/** Install skills from a cached preview. */
export async function installFromPreview({ source, names = [], target = defaultTarget(), replace = false, logFile = paths.installLog(hubDir()) } = {}) {
  const key = String(source ?? '')
  const entry = previewCache.get(key)
  if (!entry) return { ok: false, error: '预览已过期或没有预览过：请先点「预览」' }
  if (Date.now() - entry.at > PREVIEW_TTL_MS) {
    previewCache.delete(key)
    await cleanupPreview(entry.preview).catch(() => {})
    return { ok: false, error: '预览已过期（超过 15 分钟），请重新预览' }
  }

  const result = await installSkills({
    preview: entry.preview,
    names,
    target,
    replace,
    log: async (line) => {
      await mkdir(dirname(logFile), { recursive: true })
      await appendFile(logFile, `${line}\n`, 'utf8')
    },
  })

  previewCache.delete(key)
  await cleanupPreview(entry.preview).catch(() => {})
  return { ...result, source: entry.preview.source, target }
}

// ---------------------------------------------------------------------------
// 初始化（skill 画像）与一键更新
// ---------------------------------------------------------------------------

async function currentScan({ dir = hubDir() } = {}) {
  const config = await loadConfig(dir)
  const roots = Array.isArray(config.roots) && config.roots.length > 0 ? config.roots : defaultRoots()
  return scanSkills({ roots, overrides: config.overrides })
}

export async function profileState({ dir = hubDir() } = {}) {
  const [scan, profiles] = await Promise.all([currentScan({ dir }), readProfiles(dir)])
  return { ok: true, status: profileStatus(profiles, scan.skills), items: profiles.items }
}

export async function profileBatch({ dir = hubDir(), offset = 0, limit = 20, withPrompt = true } = {}) {
  const [scan, profiles] = await Promise.all([currentScan({ dir }), readProfiles(dir)])
  // 默认只出还没画像的，避免重复劳动；显式给 offset 时按全量切片
  const pending = scan.skills.filter((item) => !profiles.items[item.name])
  const batch = buildBatch(offset === 0 ? pending : scan.skills, { offset, limit })
  const status = profileStatus(profiles, scan.skills)
  return { ok: true, status, batch, prompt: withPrompt ? buildPrompt(batch) : '' }
}

export async function profileApply({ dir = hubDir(), items = [] } = {}) {
  const scan = await currentScan({ dir })
  return { ok: true, ...(await applyProfiles(dir, items, scan.skills)) }
}

export async function profileReset({ dir = hubDir() } = {}) {
  const scan = await currentScan({ dir })
  return { ok: true, status: await resetProfiles(dir, scan.skills) }
}

export async function updateCheck({ dir = hubDir(), target = defaultTarget() } = {}) {
  return { ok: true, ...(await planUpdates({ dir, target })) }
}

export async function updateApply({ dir = hubDir(), target = defaultTarget(), names = null, logFile = '' } = {}) {
  const logPath = logFile || paths.installLog(dir)
  const log = async (line) => {
    await mkdir(dirname(logPath), { recursive: true })
    await appendFile(logPath, `${line}\n`, 'utf8')
  }
  return { ok: true, ...(await runUpdates({ dir, target, log, only: names })) }
}
