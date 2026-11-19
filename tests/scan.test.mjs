import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { splitFrontmatter, parseFrontmatter } from '../lib/frontmatter.js'
import { scanSkills, defaultRoots } from '../lib/scan.js'

const SKILL = (name, desc) => `---\nname: ${name}\ndescription: "${desc}"\nmetadata:\n  version: "1.0.0"\n---\n\n# ${name}\n`

test('front matter: plain, quoted, folded', () => {
  const fm = parseFrontmatter('name: a-b\ndescription: "x: y, z"\nother: >\n  folded\n  text\n')
  assert.equal(fm.name, 'a-b')
  assert.equal(fm.description, 'x: y, z')
  assert.equal(fm.other, 'folded text')
})

test('front matter: multi-line quoted description', () => {
  const fm = parseFrontmatter('name: q\ndescription: "line one\n  line two"\n')
  assert.equal(fm.description, 'line one\n  line two')
})

test('splitFrontmatter returns body and tolerates missing block', () => {
  const split = splitFrontmatter(SKILL('s1', 'd1'))
  assert.ok(split.frontmatterText.includes('name: s1'))
  assert.ok(split.body.includes('# s1'))
  assert.equal(splitFrontmatter('# no front matter'), null)
})

test('scan: leaf skills, containers, shadowed, warnings', async () => {
  const home = await mkdtemp(join(tmpdir(), 'skillhub-'))
  const shared = join(home, '.agents', 'skills')
  const dsh = join(home, '.dsh', 'skills')
  await mkdir(join(shared, 'alpha'), { recursive: true })
  await writeFile(join(shared, 'alpha', 'SKILL.md'), SKILL('alpha', '第一个'))
  await mkdir(join(shared, 'dupe'), { recursive: true })
  await writeFile(join(shared, 'dupe', 'SKILL.md'), SKILL('dupe', '共享库里的'))
  await mkdir(join(shared, 'container', 'inner'), { recursive: true })
  await writeFile(join(shared, 'container', 'inner', 'SKILL.md'), SKILL('inner', '容器里的'))
  await mkdir(join(shared, 'empty'), { recursive: true })
  await mkdir(join(dsh, 'dupe'), { recursive: true })
  await writeFile(join(dsh, 'dupe', 'SKILL.md'), SKILL('dupe', 'DSH 端的'))

  const roots = [
    { path: dsh, label: 'dsh', rank: 400 },
    { path: shared, label: 'shared', rank: 500 },
  ]
  const out = await scanSkills({ roots })
  const names = out.skills.map((s) => s.name).sort()
  assert.deepEqual(names, ['alpha', 'dupe', 'inner'])
  assert.equal(out.skills.find((s) => s.name === 'dupe').source, 'dsh', 'lowest rank wins')
  assert.equal(out.skills.find((s) => s.name === 'inner').container, 'container')
  assert.equal(out.containers.length, 1)
  assert.equal(out.shadowed.length, 1)
  assert.ok(out.warnings.some((w) => w.includes('空目录')))
})

test('scan: missing root is reported, not thrown', async () => {
  const out = await scanSkills({ roots: [{ path: '/nope/none', label: 'x', rank: 1 }] })
  assert.equal(out.skills.length, 0)
  assert.equal(out.roots[0].exists, false)
  assert.ok(out.warnings.length > 0)
})

test('scan: overrides win over auto category', async () => {
  const home = await mkdtemp(join(tmpdir(), 'skillhub-'))
  const root = join(home, 'skills')
  await mkdir(join(root, 'baokuan-video'), { recursive: true })
  await writeFile(join(root, 'baokuan-video', 'SKILL.md'), SKILL('baokuan-video', '短视频'))
  const auto = await scanSkills({ roots: [{ path: root, label: 'x', rank: 1 }] })
  assert.equal(auto.skills[0].category, 'content-video')
  const forced = await scanSkills({ roots: [{ path: root, label: 'x', rank: 1 }], overrides: { 'baokuan-video': 'dev' } })
  assert.equal(forced.skills[0].category, 'dev')
  assert.equal(forced.skills[0].overridden, true)
})

test('defaultRoots points at the three known libraries', () => {
  const roots = defaultRoots('/home/u')
  assert.deepEqual(roots.map((r) => r.path), ['/home/u/.dsh/skills', '/home/u/.agents/skills', '/home/u/.claude/skills'])
  assert.deepEqual([...roots].sort((a, b) => a.rank - b.rank).map((r) => r.label), ['dsh', 'shared', 'claude'])
})
