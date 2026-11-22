// 一键更新：只更新「本插件装过」的 skill —— install.log 里记着来源仓库，
// 重新拉一次比对内容，变了才替换（旧版照例进 _trash）。手装的 skill 不动。
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, relative, sep } from 'node:path'
import { readdir, stat } from 'node:fs/promises'
import { paths } from './store.js'
import { previewSource, installSkills, cleanupPreview } from './install.js'

export function parseInstallLog(text) {
  const map = new Map()
  for (const line of String(text ?? '').split('\n')) {
    const parts = line.split('\t')
    if (parts.length < 5) continue
    const [stamp, action, source, name, target] = parts
    if (!source || !name) continue
    // 后面的记录覆盖前面的：同一个 skill 重装过就以最后一次为准
    map.set(name, {
      name,
      source,
      target,
      stamp,
      action,
      backup: (parts[5] ?? '').replace(/^backup=/, ''),
    })
  }
  return map
}

export async function readInstallLog(dir) {
  try {
    return await readFile(paths.installLog(dir), 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return ''
    throw error
  }
}

async function walk(dir, base = dir, out = [], budget = { left: 200 }) {
  if (budget.left <= 0) return out
  let entries = []
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) await walk(full, base, out, budget)
    else if (entry.isFile()) {
      out.push(relative(base, full))
      budget.left -= 1
      if (budget.left <= 0) return out
    }
  }
  return out
}

/** 目录内容指纹：路径 + 内容，够判断「这个 skill 有没有新版」。 */
export async function hashDir(dir) {
  const hash = createHash('sha256')
  const files = await walk(dir)
  for (const rel of files) {
    hash.update(rel.split(sep).join('/'))
    try {
      hash.update(await readFile(join(dir, rel)))
    } catch {
      hash.update('unreadable')
    }
  }
  return hash.digest('hex')
}

function groupBySource(tracked) {
  const groups = new Map()
  for (const entry of tracked.values()) {
    if (!groups.has(entry.source)) groups.set(entry.source, [])
    groups.get(entry.source).push(entry)
  }
  return [...groups.entries()].map(([source, entries]) => ({ source, entries }))
}

async function isDir(path) {
  return stat(path).then((info) => info.isDirectory(), () => false)
}

/** 只做检查，不改任何文件。 */
export async function planUpdates({ dir, target }) {
  const tracked = parseInstallLog(await readInstallLog(dir))
  const report = { tracked: tracked.size, groups: [], updatable: [], unchanged: [], missing: [], failed: [] }
  for (const group of groupBySource(tracked)) {
    const row = { source: group.source, changed: [], unchanged: [], missing: [], error: '' }
    let preview = null
    try {
      preview = await previewSource({ source: group.source })
      if (!preview?.ok) {
        row.error = preview?.error ?? '拉取失败'
        report.failed.push({ source: group.source, error: row.error })
      } else {
        const dirs = new Map((preview._dirs ?? []).map((item) => [item.name, item.dir]))
        for (const entry of group.entries) {
          const sourceDir = dirs.get(entry.name)
          const destDir = join(target, entry.name)
          if (!sourceDir) {
            row.missing.push(entry.name)
            report.missing.push({ name: entry.name, source: group.source, reason: '仓库里已经没有这个 skill' })
            continue
          }
          if (!(await isDir(destDir))) {
            row.missing.push(entry.name)
            report.missing.push({ name: entry.name, source: group.source, reason: '本机已删除' })
            continue
          }
          const [a, b] = [await hashDir(sourceDir), await hashDir(destDir)]
          if (a === b) {
            row.unchanged.push(entry.name)
            report.unchanged.push(entry.name)
          } else {
            row.changed.push(entry.name)
            report.updatable.push({ name: entry.name, source: group.source })
          }
        }
      }
    } catch (error) {
      row.error = error?.message ?? String(error)
      report.failed.push({ source: group.source, error: row.error })
    } finally {
      if (preview) await cleanupPreview(preview).catch(() => {})
    }
    report.groups.push(row)
  }
  report.ok = report.failed.length === 0
  return report
}

/** 真的替换。only 给了就只更新这些名字。 */
export async function runUpdates({ dir, target, log, only = null }) {
  const picked = Array.isArray(only) && only.length > 0 ? new Set(only.map(String)) : null
  const tracked = parseInstallLog(await readInstallLog(dir))
  const updated = []
  const skipped = []
  const failed = []
  for (const group of groupBySource(tracked)) {
    const wanted = group.entries.filter((entry) => !picked || picked.has(entry.name))
    if (wanted.length === 0) continue
    let preview = null
    try {
      preview = await previewSource({ source: group.source })
      if (!preview?.ok) {
        failed.push({ source: group.source, error: preview?.error ?? '拉取失败' })
        continue
      }
      const names = wanted.map((entry) => entry.name)
      const result = await installSkills({ preview, names, target, replace: true, log })
      for (const item of result.installed ?? []) updated.push({ name: item.name, source: group.source, backup: item.backup ?? '' })
      for (const item of result.skipped ?? []) {
        // 「没有同名 skill」= 上游删除；其它（例如没变）按跳过报
        skipped.push({ name: item.name, source: group.source, reason: item.reason })
      }
      if (!result.ok && (result.installed ?? []).length === 0) {
        failed.push({ source: group.source, error: result.error ?? '没有装上任何一个' })
      }
    } catch (error) {
      failed.push({ source: group.source, error: error?.message ?? String(error) })
    } finally {
      if (preview) await cleanupPreview(preview).catch(() => {})
    }
  }
  return { ok: failed.length === 0, updated, skipped, failed }
}
