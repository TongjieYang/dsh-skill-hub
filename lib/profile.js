// 初始化（skill 画像）：把「这个 skill 叫什么、干什么、适合和谁搭配」存成本地档案，
// 专家团和提示词都读它。插件自己不做语义分析——那步交给 agent，这里只负责
// 出题（buildPrompt）、收卷（applyProfiles）、判分（profileStatus）。
import { join } from 'node:path'
import { readJson, writeJson, safeId } from './store.js'

export const PROFILE_VERSION = 1

export function profilesPath(dir) {
  return join(dir, 'profiles.json')
}

export function emptyProfiles() {
  return { version: PROFILE_VERSION, updatedAt: null, items: {} }
}

export async function readProfiles(dir) {
  const raw = await readJson(profilesPath(dir), null)
  if (!raw || typeof raw !== 'object' || !raw.items || typeof raw.items !== 'object') return emptyProfiles()
  return { version: PROFILE_VERSION, updatedAt: raw.updatedAt ?? null, items: raw.items }
}

export async function writeProfiles(dir, value) {
  await writeJson(profilesPath(dir), value)
  return value
}

/** 一个 skill 的「题干」：只给它已经有的信息，不猜。 */
export function seedFor(skill) {
  const description = String(skill.description ?? '').trim()
  return {
    name: skill.name,
    category: skill.category ?? '',
    description: description.length > 240 ? `${description.slice(0, 240)}…` : description,
    entry: skill.dir ?? '',
  }
}

export function buildBatch(skills, { offset = 0, limit = 20 } = {}) {
  const list = Array.isArray(skills) ? skills : []
  const start = Math.max(0, Number(offset) || 0)
  const size = Math.min(50, Math.max(1, Number(limit) || 20))
  return {
    total: list.length,
    offset: start,
    limit: size,
    items: list.slice(start, start + size).map(seedFor),
  }
}

export function profileStatus(profiles, skills) {
  const items = profiles?.items ?? {}
  const total = Array.isArray(skills) ? skills.length : 0
  const profiled = (skills ?? []).filter((item) => items[item.name]).length
  const missing = (skills ?? []).filter((item) => !items[item.name]).map((item) => item.name)
  return {
    total,
    profiled,
    missing: missing.slice(0, 50),
    missingCount: missing.length,
    ready: total > 0 && missing.length === 0,
    started: profiled > 0,
    updatedAt: profiles?.updatedAt ?? null,
  }
}

/** 生成给 agent 的初始化任务书：一次一批，回填 JSON。 */
export function buildPrompt(batch) {
  const lines = [
    '请在本地 skill 库里为下面这些 skill 各写一条画像，只分析，不要调用它们。',
    '',
    '每个 skill 输出四个字段：',
    '- name：原样照抄',
    '- purpose：一句话说清「它解决什么问题」（≤40 字，别复述名字）',
    '- whenToUse：什么场景该想起它（≤40 字，写触发条件，不写能力）',
    '- pairs：适合与哪些 skill 一起用（0–3 个名字，必须是本次库里的 skill）',
    '',
    '分析完后调用工具 `skill_hub_profile`，参数：',
    '{"action":"apply","items":[{"name":"…","purpose":"…","whenToUse":"…","pairs":["…"]}]}',
    '',
    `本批共 ${batch.items.length} 个（库内共 ${batch.total} 个，offset=${batch.offset}）：`,
    '',
  ]
  for (const item of batch.items) {
    lines.push(`### ${item.name}`)
    if (item.category) lines.push(`分类：${item.category}`)
    if (item.description) lines.push(`描述：${item.description}`)
    lines.push('')
  }
  return lines.join('\n')
}

/** 收卷：只收当前库里真实存在的 skill，字段缺就补空，不让脏数据进档案。 */
export async function applyProfiles(dir, incoming, skills) {
  const known = new Set((skills ?? []).map((item) => item.name))
  const current = await readProfiles(dir)
  const applied = []
  const skipped = []
  for (const raw of Array.isArray(incoming) ? incoming : []) {
    const name = String(raw?.name ?? '').trim()
    if (!name || !known.has(name)) {
      skipped.push({ name: name || '(空)', reason: '本机没有这个 skill' })
      continue
    }
    const pairs = (Array.isArray(raw?.pairs) ? raw.pairs : [])
      .map((item) => String(item).trim())
      .filter((item) => item && item !== name && known.has(item))
      .slice(0, 3)
    current.items[name] = {
      name,
      purpose: String(raw?.purpose ?? '').trim().slice(0, 200),
      whenToUse: String(raw?.whenToUse ?? '').trim().slice(0, 200),
      pairs,
      updatedAt: new Date().toISOString(),
    }
    applied.push(name)
  }
  if (applied.length > 0) {
    current.updatedAt = new Date().toISOString()
    await writeProfiles(dir, current)
  }
  return { applied: applied.length, skipped, status: profileStatus(current, skills) }
}

export async function resetProfiles(dir, skills) {
  const next = await writeProfiles(dir, emptyProfiles())
  return profileStatus(next, skills)
}

/** 专家团/提示词要用的人话摘要：没画像时退回描述首句，不阻塞使用。 */
export function profileOneLiner(profiles, skill) {
  const item = profiles?.items?.[skill?.name]
  if (item?.purpose) return item.purpose
  const text = String(skill?.description ?? '').split(/[。.!?！？\n]/)[0] ?? ''
  return text.slice(0, 60)
}

export function pairSuggestions(profiles, name) {
  const self = profiles?.items?.[name]
  if (self?.pairs?.length) return self.pairs
  const out = []
  for (const [other, item] of Object.entries(profiles?.items ?? {})) {
    if (other !== name && Array.isArray(item?.pairs) && item.pairs.includes(name)) out.push(other)
  }
  return out.slice(0, 3)
}

export { safeId }
