import { mkdir, readFile, writeFile, readdir, rm, rename } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'

export const HUB_DIRNAME = 'skill-hub'

export function hubDir(home = process.env.DSH_SKILL_HUB_DIR ?? '') {
  if (home) return home
  return join(homedir(), '.agents', HUB_DIRNAME)
}

export const paths = {
  config: (dir) => join(dir, 'config.json'),
  keys: (dir) => join(dir, 'keys.json'),
  teams: (dir) => join(dir, 'teams'),
  team: (dir, id) => join(dir, 'teams', `${safeId(id)}.json`),
  installLog: (dir) => join(dir, 'install.log'),
}

export function safeId(id) {
  const clean = String(id ?? '').replace(/[^A-Za-z0-9\u4e00-\u9fa5._-]/g, '-').replace(/^[.-]+/, '')
  if (!clean) throw new Error('非法的 id')
  return clean.slice(0, 80)
}

export async function readJson(file, fallback) {
  try {
    const text = await readFile(file, 'utf8')
    return JSON.parse(text)
  } catch (error) {
    if (error.code === 'ENOENT') return fallback
    throw error
  }
}

/** Write-then-rename so a crash never leaves a half-written JSON file. */
export async function writeJson(file, value) {
  await mkdir(dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await rename(tmp, file)
}

export const DEFAULT_CONFIG = {
  version: 1,
  overrides: {},
  roots: null,
  keys: [],
  settings: { showDescriptions: true, groupByCategory: true },
}

export async function loadConfig(dir = hubDir()) {
  const raw = await readJson(paths.config(dir), null)
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_CONFIG }
  return {
    ...DEFAULT_CONFIG,
    ...raw,
    overrides: raw.overrides && typeof raw.overrides === 'object' ? raw.overrides : {},
    keys: Array.isArray(raw.keys) ? raw.keys : [],
    settings: { ...DEFAULT_CONFIG.settings, ...(raw.settings ?? {}) },
  }
}

export async function saveConfig(config, dir = hubDir()) {
  await writeJson(paths.config(dir), config)
  return config
}

/** Only metadata lands on disk — there is no field here that could hold a secret. */
export function normalizeKeyEntry(input) {
  const entry = input && typeof input === 'object' ? input : {}
  return {
    env: String(entry.env ?? '').trim(),
    service: String(entry.service ?? '').trim(),
    account: String(entry.account ?? '').trim() || 'default',
    platform: String(entry.platform ?? '').trim() || detectPlatformSafe(),
    note: String(entry.note ?? '').trim().slice(0, 200),
    createdAt: typeof entry.createdAt === 'string' && entry.createdAt ? entry.createdAt : new Date().toISOString(),
  }
}

function detectPlatformSafe() {
  if (process.platform === 'darwin') return 'darwin'
  if (process.platform === 'win32') return 'win32'
  return 'linux'
}

export async function readTeams(dir = hubDir()) {
  const base = paths.teams(dir)
  let entries = []
  try {
    entries = await readdir(base, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
  const teams = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue
    try {
      const parsed = JSON.parse(await readFile(join(base, entry.name), 'utf8'))
      if (parsed && typeof parsed === 'object') teams.push(parsed)
    } catch {
      // A corrupt team file must not take the whole page down.
    }
  }
  return teams
}

export async function writeTeam(team, dir = hubDir()) {
  const file = paths.team(dir, team.id)
  await writeJson(file, team)
  return file
}

export async function removeTeam(id, dir = hubDir()) {
  const file = paths.team(dir, id)
  try {
    await rm(file, { force: true })
    return true
  } catch {
    return false
  }
}
