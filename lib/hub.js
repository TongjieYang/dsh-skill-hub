import { scanSkills, defaultRoots } from './scan.js'
import { classify, categoryCounts, categoryById, CATEGORY_IDS } from './classify.js'
import { mergeTeams, normalizeTeam, missingSkills, builtinTeam, slugify } from './teams.js'
import { buildKeyScript, buildLoadAll, detectPlatform, ENV_RE, PLATFORMS } from './keygen.js'
import {
  hubDir, loadConfig, saveConfig, readTeams, writeTeam, removeTeam,
  normalizeKeyEntry, paths,
} from './store.js'

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
    hubDir: dir,
    roots: scan.roots,
    skills: scan.skills,
    containers: scan.containers,
    shadowed: scan.shadowed,
    categories: categoryCounts(scan.skills),
    teams,
    keys: config.keys.map(normalizeKeyEntry),
    loadAll: buildLoadAll(config.keys, platform),
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
export function renderTeam(team, stageId = '') {
  const lines = []
  lines.push(`# ${team.emoji ?? ''} ${team.title}${team.builtin ? '（内置团）' : ''}  · id=${team.id}`)
  lines.push('')
  lines.push(`目标：${team.goal || '（未填写）'}`)
  lines.push('')
  const stage = stageId ? (team.stages ?? []).find((s) => s.id === stageId) : null
  const roles = stage
    ? team.roles.filter((r) => (stage.roleIds ?? []).includes(r.id))
    : team.roles
  lines.push(stage ? `## 当前阶段：${stage.title}（交付物：${stage.deliverable || '未定义'}）` : '## 角色')
  for (const role of roles) {
    lines.push('')
    lines.push(`### ${role.title}  · ${role.id}`)
    lines.push(`职责：${role.duty || '（未填写）'}`)
    lines.push(`绑定 skill：${role.skills.length ? role.skills.map((s) => '`' + s + '`').join('、') : '（未绑定）'}`)
    lines.push(`交付物：${role.deliverable || '（未填写）'}`)
  }
  if (!stage && (team.stages ?? []).length) {
    lines.push('')
    lines.push('## 阶段')
    for (const s of team.stages) {
      const names = (s.roleIds ?? [])
        .map((id) => team.roles.find((r) => r.id === id)?.title ?? id)
        .join(' + ')
      lines.push(`- ${s.title}（${names || '未指派'}）→ ${s.deliverable || '未定义'}`)
    }
  }
  if ((team.guardrails ?? []).length) {
    lines.push('')
    lines.push('## 铁律')
    for (const g of team.guardrails) lines.push(`- ${g}`)
  }
  if ((team.missingSkills ?? []).length) {
    lines.push('')
    lines.push(`## ⚠️ 缺失 skill（本地未安装）：${team.missingSkills.join('、')}`)
  }
  lines.push('')
  lines.push('用法：按阶段顺序推进，每个角色开始时先用 skill 工具装载它绑定的 skill，交付物落文件后再进入下一阶段。')
  return lines.join('\n')
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
  })
  if (!script.ok) return { ok: false, error: script.error }
  const config = await loadConfig(dir)
  const others = config.keys.filter((k) => normalizeKeyEntry(k).env !== entry.env)
  const next = [...others, { ...entry, service: script.service }]
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
export function keyScript({ env, service, account, platform = process.platform, note }) {
  const entry = normalizeKeyEntry({ env, service, account, note, platform })
  const script = buildKeyScript(entry)
  if (!script.ok) return { ok: false, error: script.error }
  return { ok: true, ...script }
}

export { categoryById }
