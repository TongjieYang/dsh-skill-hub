// The audit must agree with this machine's conventions, not with a generic idea
// of "clean": the master library holds the only real copies, every other end is a
// symlink view of it, and the DSH root stays empty so it cannot shadow anything.

import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { auditLibrary } from '../lib/audit.js'

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'skill-hub-audit-'))
  const hub = join(root, 'hub')
  const master = join(root, 'master')
  const dshRoot = join(root, 'dsh')
  const endRoot = join(root, 'end')

  const mkSkill = async (dir, name) => {
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'SKILL.md'), `---\nname: ${name}\ndescription: ${name} 的说明\n---\n\n正文\n`, 'utf8')
  }

  await mkdir(hub, { recursive: true })
  await mkSkill(join(master, 'good-skill'), 'good-skill')
  await mkSkill(join(root, 'outside'), 'outside-skill')
  // A symlink inside the master is a second copy hiding as a link.
  await symlink(join(root, 'outside'), join(master, 'linked-skill'))

  // Anything in the DSH root outranks the master, so it must stay empty.
  await mkSkill(join(dshRoot, 'shadow-skill'), 'shadow-skill')

  // An end side should link, never hold a real directory.
  await mkSkill(join(endRoot, 'copied-skill'), 'copied-skill')
  await symlink(join(master, 'good-skill'), join(endRoot, 'good-skill'))

  const roots = [
    { path: dshRoot, label: 'dsh', rank: 400, title: 'DSH 本端' },
    { path: master, label: 'shared', rank: 500, title: '共享主库' },
    { path: endRoot, label: 'claude', rank: 600, title: 'Claude' },
  ]
  await writeFile(join(hub, 'config.json'), JSON.stringify({ roots }), 'utf8')

  return { root, hub }
}

test('主库里的软链是严重问题，DSH 端的条目是覆盖、不是错误', async () => {
  const { root, hub } = await fixture()
  try {
    const report = await auditLibrary({ dir: hub })
    const kinds = report.findings.map((item) => `${item.severity}:${item.kind}`)
    assert.ok(kinds.includes('high:master-symlink'), `应报主库软链，实际：${kinds.join(', ')}`)
    // A link inside ~/.dsh/skills is legal (the provider follows it); only the
    // shadowing consequence is worth mentioning, so it stays at "注意".
    assert.ok(kinds.includes('middle:dsh-shadow'), `应报 DSH 端覆盖，实际：${kinds.join(', ')}`)
    assert.equal(report.bySeverity.high, 1)
    assert.equal(report.clean, false)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('端侧实体副本报中间级，指向主库的软链不报', async () => {
  const { root, hub } = await fixture()
  try {
    const report = await auditLibrary({ dir: hub })
    const endCopies = report.findings.filter((item) => item.kind === 'end-copy')
    assert.equal(endCopies.length, 1)
    assert.match(endCopies[0].message, /copied-skill/)
    const foreign = report.findings.filter((item) => item.kind === 'foreign-symlink')
    assert.equal(foreign.length, 0, '指向主库的软链不该算问题')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('干净的库返回 clean=true', async () => {
  const { root, hub } = await fixture()
  try {
    const master = join(root, 'master')
    const dshRoot = join(root, 'dsh')
    const endRoot = join(root, 'end')

    // Remove every violation the fixture planted, keeping one clean skill.
    await rm(join(master, 'linked-skill'), { force: true })
    await rm(dshRoot, { recursive: true, force: true })
    await mkdir(dshRoot, { recursive: true })
    await rm(join(endRoot, 'copied-skill'), { recursive: true, force: true })

    const report = await auditLibrary({ dir: hub })
    assert.equal(report.bySeverity.high, 0)
    assert.equal(report.bySeverity.middle, 0)
    assert.equal(report.clean, true)
    // Unclassified skills are a note, not a violation.
    assert.ok(report.findings.every((item) => item.severity === 'low'))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
