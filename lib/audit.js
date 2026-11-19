// Library audit: does what is on disk match this machine's rules?
//
// The plugin cannot intercept another installer's writes — other plugins write
// files straight to disk. What it can do is look at the result and say plainly
// what is off. The rules audited here are this machine's own conventions:
//
//   • `~/.agents/skills` is the one real copy — no symlinks inside it;
//   • other ends (`~/.claude/skills`, `~/.workbuddy/skills`, …) should hold
//     symlinks into that master, never a second real copy;
//   • `~/.dsh/skills` stays empty, because it outranks the master and would
//     shadow it.

import { access, readdir, readlink } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { buildState } from './hub.js'
import { hubDir } from './store.js'

const SEVERITY_ORDER = { high: 0, middle: 1, low: 2 }
const MASTER_LABEL = 'shared'

/**
 * @param {{dir?: string, platform?: string}} options
 */
export async function auditLibrary({ dir = hubDir(), platform = process.platform } = {}) {
  const state = await buildState({ dir, platform })
  const findings = []
  const add = (severity, kind, message, refs = []) => findings.push({ severity, kind, message, refs })

  const foreign = []
  const master = state.roots.find((root) => root.label === MASTER_LABEL)
  const masterPath = master ? resolve(master.path) : ''

  for (const root of state.roots) {
    let entries = []
    try {
      entries = await readdir(root.path, { withFileTypes: true })
    } catch {
      continue
    }

    for (const entry of entries) {
      const full = join(root.path, entry.name)

      if (root.label === 'dsh' && entries.length > 0) {
        // rank 400 wins over the master, so anything here shadows it.
        add('high', 'dsh-not-empty', `${full}：~/.dsh/skills 必须保持空，否则会遮蔽共享主库`, [entry.name])
        continue
      }

      if (root.label === MASTER_LABEL) {
        if (entry.isSymbolicLink()) {
          add('high', 'master-symlink', `${full} 是软链：主库必须自包含，每个 skill 一份真实目录`, [entry.name])
        }
        continue
      }

      // Every other root is an end: symlinks are expected, real copies are not.
      if (entry.isSymbolicLink()) {
        let target = ''
        try {
          target = resolve(root.path, await readlink(full))
        } catch {
          continue
        }
        if (masterPath && !target.startsWith(`${masterPath}/`) && target !== masterPath) {
          foreign.push(`${entry.name} → ${target}`)
        }
        continue
      }

      if (entry.isDirectory()) {
        // A directory that carries its own SKILL.md is a real second copy. One
        // without it is only a grouping folder (external source repos are kept
        // where they are, so their parents are containers, not copies).
        const hasSkill = await access(join(full, 'SKILL.md')).then(() => true, () => false)
        if (hasSkill) {
          add('middle', 'end-copy', `${full} 是端侧实体副本：应软链到共享主库，否则同一 skill 存了两份`, [entry.name])
        }
        // No SKILL.md here: it is a grouping folder, and the scan already reports
        // it under `container`. Reporting it twice would just be noise.
      }
    }
  }

  // A folder name that disagrees with SKILL.md is legal but confusing.
  const mismatch = state.skills.filter((skill) => basename(skill.dir) !== skill.name)
  if (mismatch.length > 0) {
    add(
      'low',
      'name-mismatch',
      `${mismatch.length} 个目录名与 SKILL.md 的 name 不一致（身份以 name 为准）`,
      mismatch.slice(0, 12).map((skill) => `${basename(skill.dir)} → ${skill.name}`),
    )
  }

  const noDescription = state.skills.filter((skill) => !String(skill.description ?? '').trim())
  if (noDescription.length > 0) {
    add('low', 'no-description', `${noDescription.length} 个 skill 没有 description，列表里看不出用途`, noDescription.map((s) => s.name))
  }

  for (const item of state.containers) {
    add('low', 'container', `${item.dir} 是容器目录（本身没有 SKILL.md，内含 ${item.children} 个子 skill）`, item.childNames || [])
  }

  if (foreign.length > 0) {
    add(
      'low',
      'foreign-symlink',
      `${foreign.length} 条端侧软链指向主库之外（外部源仓，按约定只登记不迁移）`,
      foreign.slice(0, 8),
    )
  }

  const uncategorized = state.skills.filter((skill) => skill.category === 'other')
  if (uncategorized.length > 0) {
    add('low', 'uncategorized', `${uncategorized.length} 个 skill 仍在「其他」，可在分类整理页手动归类`, uncategorized.map((s) => s.name))
  }

  findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  const bySeverity = { high: 0, middle: 0, low: 0 }
  for (const item of findings) bySeverity[item.severity] += 1

  return {
    ok: true,
    auditedAt: new Date().toISOString(),
    roots: state.roots,
    skillCount: state.skills.length,
    bySeverity,
    // Compliant means nothing is actually wrong. Notes (low) are still worth
    // listing, but a library full of unclassified skills is not "broken".
    clean: bySeverity.high === 0 && bySeverity.middle === 0,
    findings,
  }
}
