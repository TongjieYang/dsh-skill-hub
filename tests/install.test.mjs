import assert from 'node:assert/strict'
import test from 'node:test'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, mkdir, writeFile, readFile, rm, stat, lstat, utimes } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseSource, scanClone, installSkills, cleanupPreview, defaultTarget, sweepStaleTmp } from '../lib/install.js'

const run = promisify(execFile)

/** A throwaway git repo holding two skills, used instead of hitting GitHub. */
async function makeRepo() {
  const root = await mkdtemp(join(tmpdir(), 'install-repo-'))
  const repo = join(root, 'repo')
  await mkdir(join(repo, 'skills', 'alpha'), { recursive: true })
  await mkdir(join(repo, 'skills', 'beta'), { recursive: true })
  await mkdir(join(repo, 'node_modules', 'junk'), { recursive: true })
  await writeFile(join(repo, 'skills', 'alpha', 'SKILL.md'), '---\nname: test-alpha\ndescription: 第一个测试 skill\n---\n\n用 $ALPHA_API_KEY\n', 'utf8')
  await writeFile(join(repo, 'skills', 'alpha', 'run.sh'), '#!/bin/sh\necho hi\n', 'utf8')
  await writeFile(join(repo, 'skills', 'beta', 'SKILL.md'), '---\nname: test-beta\ndescription: 第二个\n---\n', 'utf8')
  await writeFile(join(repo, 'node_modules', 'junk', 'SKILL.md'), '---\nname: junk\n---\n', 'utf8')
  await run('git', ['init', '--quiet'], { cwd: repo })
  await run('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'add', '-A'], { cwd: repo })
  await run('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '--quiet', '-m', 'fixture'], { cwd: repo })
  return { root, repo }
}

test('parseSource: owner/repo、完整地址、tree 子目录、git@ 都认', () => {
  assert.equal(parseSource('TongjieYang/dsh-skill-hub').url, 'https://github.com/TongjieYang/dsh-skill-hub.git')
  assert.equal(parseSource('https://github.com/o/r').url, 'https://github.com/o/r.git')
  const tree = parseSource('https://github.com/o/r/tree/main/skills/foo')
  assert.equal(tree.url, 'https://github.com/o/r.git')
  assert.equal(tree.branch, 'main')
  assert.equal(tree.subdir, 'skills/foo')
  assert.equal(parseSource('git@github.com:o/r.git').url, 'git@github.com:o/r.git')
})

test('parseSource: 拒绝本地路径，不假装能装', () => {
  for (const bad of ['/tmp/x', './x', '../x', '~/x', 'file:///tmp/x']) {
    assert.equal(parseSource(bad).ok, false, bad)
  }
})

test('parseSource: 空输入与乱码有可读报错', () => {
  assert.equal(parseSource('').ok, false)
  assert.equal(parseSource('not a repo!!').ok, false)
})

test('scanClone + installSkills: 装成真实目录、跳过 node_modules、同名不覆盖', async () => {
  const { root, repo } = await makeRepo()
  const target = await mkdtemp(join(tmpdir(), 'install-target-'))
  let preview
  try {
    preview = await scanClone({ url: repo })
    assert.equal(preview.ok, true)
    assert.equal(preview.total, 2)
    assert.deepEqual(preview.candidates.map((c) => c.name).sort(), ['test-alpha', 'test-beta'])
    assert.ok(!preview.candidates.some((c) => c.name === 'junk'), 'node_modules 里的不算')

    const first = await installSkills({ preview, names: ['test-alpha'], target })
    assert.equal(first.ok, true)
    assert.equal(first.installed.length, 1)
    const dest = join(target, 'test-alpha')
    assert.ok((await lstat(dest)).isDirectory(), '必须是真实目录')
    assert.ok(!(await lstat(dest)).isSymbolicLink(), '不允许软链')
    assert.match(await readFile(join(dest, 'SKILL.md'), 'utf8'), /test-alpha/)
    assert.ok((await stat(join(dest, 'run.sh'))).isFile(), '子文件要一起复制')

    const again = await installSkills({ preview, names: ['test-alpha'], target })
    assert.equal(again.ok, false)
    assert.match(again.skipped[0].reason, /已存在/)
  } finally {
    await cleanupPreview(preview)
    await rm(root, { recursive: true, force: true })
    await rm(target, { recursive: true, force: true })
  }
})

test('installSkills: 拒绝可疑名字，不往目标外写', async () => {
  const { root, repo } = await makeRepo()
  const target = await mkdtemp(join(tmpdir(), 'install-target-'))
  let preview
  try {
    preview = await scanClone({ url: repo })
    const result = await installSkills({ preview, names: ['../evil', 'test-beta'], target })
    assert.equal(result.installed.length, 1)
    assert.equal(result.installed[0].name, 'test-beta')
    assert.equal(result.skipped.length, 1)
    assert.match(result.skipped[0].reason, /没有同名 skill/)
  } finally {
    await cleanupPreview(preview)
    await rm(root, { recursive: true, force: true })
    await rm(target, { recursive: true, force: true })
  }
})

test('installSkills: 预览失效时明确报错', async () => {
  const result = await installSkills({ preview: { ok: false }, names: [], target: await mkdtemp(join(tmpdir(), 'x-')) })
  assert.equal(result.ok, false)
  assert.match(result.error, /重新/)
})

test('defaultTarget 指共享主库', () => {
  assert.match(defaultTarget('/Users/demo'), /\.agents\/skills$/)
})

test('同一个 skill 被仓库发到多个 agent 目录时只算一个', async () => {
  const root = await mkdtemp(join(tmpdir(), 'install-dup-'))
  const repo = join(root, 'repo')
  const body = '---\nname: dup-skill\ndescription: 一份 skill 多个壳\n---\n\n正文\n'
  for (const rel of ['.claude/skills/dup-skill', '.cursor/skills/dup-skill', 'plugin/skills/dup-skill', '.agents/skills/dup-skill']) {
    await mkdir(join(repo, rel), { recursive: true })
    await writeFile(join(repo, rel, 'SKILL.md'), body, 'utf8')
  }
  // 测试夹具里的 SKILL.md 不该被当成可安装的 skill
  await mkdir(join(repo, 'tests/fixtures/ghost'), { recursive: true })
  await writeFile(join(repo, 'tests/fixtures/ghost/SKILL.md'), '---\nname: ghost\n---\n', 'utf8')

  await run('git', ['init', '--quiet'], { cwd: repo })
  await run('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'add', '-A'], { cwd: repo })
  await run('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '--quiet', '-m', 'f'], { cwd: repo })

  let preview
  try {
    preview = await scanClone({ url: repo })
    assert.equal(preview.total, 1, '同名副本应合并成一个')
    assert.equal(preview.duplicateCount, 3)
    assert.equal(preview.candidates[0].name, 'dup-skill')
    // 保留的是本机惯用的共享库布局
    assert.equal(preview.candidates[0].relPath, join('.agents', 'skills', 'dup-skill'))
  assert.equal(preview.duplicateCount, 3, '另外三份副本应被合并计数')
    assert.ok(!preview.candidates.some((item) => item.name === 'ghost'), 'tests/ 下的夹具不参与')
  } finally {
    await cleanupPreview(preview)
    await rm(root, { recursive: true, force: true })
  }
})

test('installSkills: 同名时只能替换——旧目录移入 _trash，新版本装进去', async () => {
  const { root, repo } = await makeRepo()
  const target = await mkdtemp(join(tmpdir(), 'install-target-'))
  try {
    const preview = await scanClone({ url: repo })
    assert.equal(preview.ok, true)

    // First install, then prove the old copy is really gone from the target and
    // parked under _trash (never merged, never overwritten in place).
    await installSkills({ preview, names: ['test-alpha'], target })
    await writeFile(join(target, 'test-alpha', 'SKILL.md'), '---\nname: test-alpha\ndescription: 旧版\n---\n旧版正文\n', 'utf8')

    const replaced = await installSkills({ preview, names: ['test-alpha'], target, replace: true })
    assert.equal(replaced.ok, true)
    assert.equal(replaced.replaced.length, 1)
    const backup = replaced.replaced[0].backup
    assert.ok(backup.includes(join('_trash')), `备份应在 _trash 下：${backup}`)
    assert.match(await readFile(join(backup, 'SKILL.md'), 'utf8'), /旧版正文/)
    assert.doesNotMatch(await readFile(join(target, 'test-alpha', 'SKILL.md'), 'utf8'), /旧版正文/)
    assert.equal(replaced.installed[0].action, 'replaced')
  } finally {
    await rm(target, { recursive: true, force: true })
    await rm(root, { recursive: true, force: true })
  }
})

test('scanClone: 报告用时与走的那条路，本地仓库不走探测', async () => {
  const { root, repo } = await makeRepo()
  try {
    const preview = await scanClone({ url: repo })
    assert.equal(preview.ok, true)
    assert.equal(preview.mode, 'configured')
    assert.equal(typeof preview.cloneMs, 'number')
    assert.ok(preview.cloneMs >= 0)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('sweepStaleTmp: 只清两小时前的 skill-hub-* 残留，别的东西不碰', async () => {
  const base = await mkdtemp(join(tmpdir(), 'sweep-base-'))
  const oldOne = join(base, 'skill-hub-old')
  const newOne = join(base, 'skill-hub-new')
  const unrelated = join(base, 'not-ours')
  try {
    for (const dir of [oldOne, newOne, unrelated]) await mkdir(dir, { recursive: true })
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
    await utimes(oldOne, threeHoursAgo, threeHoursAgo)
    const { removed } = await sweepStaleTmp({ base })
    assert.equal(removed, 1)
    assert.equal(await stat(oldOne).then(() => true, () => false), false, '旧残留应被删掉')
    assert.equal(await stat(newOne).then(() => true, () => false), true, '刚结束的预览不能删')
    assert.equal(await stat(unrelated).then(() => true, () => false), true, '不认识的目录不碰')
  } finally {
    await rm(base, { recursive: true, force: true })
  }
})
