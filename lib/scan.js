import { readdir, readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { parseFrontmatter, splitFrontmatter, firstLine } from './frontmatter.js'
import { classify } from './classify.js'

const SKILL_FILE = 'SKILL.md'

/** Default scan roots, ordered by precedence (lower rank wins). */
export function defaultRoots(home = homedir()) {
  return [
    { path: join(home, '.dsh', 'skills'), label: 'dsh', rank: 400, title: 'DSH 本端' },
    { path: join(home, '.agents', 'skills'), label: 'shared', rank: 500, title: '共享主库' },
    { path: join(home, '.claude', 'skills'), label: 'claude', rank: 600, title: 'Claude' },
  ]
}

async function exists(p) {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

async function readSkillAt(dir, root) {
  const file = join(dir, SKILL_FILE)
  let text
  try {
    text = await readFile(file, 'utf8')
  } catch (error) {
    return { ok: false, error: `${file}: ${error.message}` }
  }
  const split = splitFrontmatter(text)
  const data = split ? parseFrontmatter(split.frontmatterText) : {}
  const dirName = dir.split('/').pop()
  const name = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : dirName
  const description = firstLine(data.description ?? '', 600)
  return {
    ok: true,
    skill: {
      name,
      dir,
      dirName,
      source: root.label,
      rank: root.rank,
      description,
      hasFrontmatter: Boolean(split),
    },
  }
}

async function listDirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  return entries
    .filter((e) => (e.isDirectory() || e.isSymbolicLink()) && !e.name.startsWith('.'))
    .map((e) => join(dir, e.name))
    .sort()
}

/**
 * Scan every root. Same `name` seen twice keeps the lowest-rank copy and
 * reports the rest under `shadowed` (matches the DSH skill provider where
 * `~/.dsh/skills` outranks `~/.agents/skills`).
 */
export async function scanSkills({ roots = defaultRoots(), overrides = {} } = {}) {
  const warnings = []
  const byName = new Map()
  const shadowed = []
  const containers = []
  const rootInfo = []
  const ordered = [...roots].sort((a, b) => a.rank - b.rank)

  for (const root of ordered) {
    const present = await exists(root.path)
    let count = 0
    if (!present) {
      rootInfo.push({ ...root, exists: false, count: 0 })
      warnings.push(`扫描根不存在：${root.path}`)
      continue
    }
    let dirs
    try {
      dirs = await listDirs(root.path)
    } catch (error) {
      rootInfo.push({ ...root, exists: true, count: 0 })
      warnings.push(`无法读取 ${root.path}: ${error.message}`)
      continue
    }
    for (const dir of dirs) {
      const hasSkill = await exists(join(dir, SKILL_FILE))
      if (hasSkill) {
        const read = await readSkillAt(dir, root)
        if (!read.ok) {
          warnings.push(read.error)
          continue
        }
        count += 1
        pushUnique(read.skill)
        continue
      }
      let children = []
      try {
        children = await listDirs(dir)
      } catch {
        children = []
      }
      const leafChildren = []
      for (const child of children) {
        if (await exists(join(child, SKILL_FILE))) leafChildren.push(child)
      }
      if (leafChildren.length === 0) {
        warnings.push(`空目录（无 SKILL.md、无子 skill）：${dir}`)
        continue
      }
      containers.push({
        dir,
        source: root.label,
        children: leafChildren.length,
        childNames: leafChildren.map((c) => c.split('/').pop()),
      })
      for (const child of leafChildren) {
        const read = await readSkillAt(child, root)
        if (!read.ok) {
          warnings.push(read.error)
          continue
        }
        count += 1
        pushUnique({ ...read.skill, container: dir.split('/').pop() })
      }
    }
    rootInfo.push({ ...root, exists: true, count })
  }

  function pushUnique(skill) {
    const existing = byName.get(skill.name)
    if (existing) {
      shadowed.push({ name: skill.name, dir: skill.dir, source: skill.source, keptFrom: existing.source })
      return
    }
    byName.set(skill.name, skill)
  }

  const skills = [...byName.values()].map((s) => {
    const auto = classify(s)
    const override = overrides[s.name]
    return {
      ...s,
      autoCategory: auto,
      category: typeof override === 'string' && override ? override : auto,
      overridden: typeof override === 'string' && Boolean(override),
    }
  })

  skills.sort((a, b) => (a.category === b.category ? a.name.localeCompare(b.name) : a.category.localeCompare(b.category)))

  return { skills, containers, shadowed, roots: rootInfo, warnings, scannedAt: new Date().toISOString() }
}
