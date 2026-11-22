import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseInstallLog, hashDir } from '../lib/update.js'

test('install.log：同一个 skill 以最后一次记录为准，backup 解析出来', () => {
  const text = [
    '2026-11-20T18:51:20.799Z\tinstall\thttps://github.com/a/b.git\tfoo\t/Users/x/foo',
    '2026-11-21T10:00:00.000Z\treplace\thttps://github.com/a/c.git\tfoo\t/Users/x/foo\tbackup=/Users/x/_trash/foo',
    'garbage line',
  ].join('\n')
  const map = parseInstallLog(text)
  assert.equal(map.size, 1)
  assert.equal(map.get('foo').source, 'https://github.com/a/c.git')
  assert.equal(map.get('foo').action, 'replace')
  assert.equal(map.get('foo').backup, '/Users/x/_trash/foo')
})

test('install.log：空内容不炸', () => {
  assert.equal(parseInstallLog('').size, 0)
  assert.equal(parseInstallLog(undefined).size, 0)
})

test('hashDir：内容相同则指纹相同，改一个字节就不同', async () => {
  const a = await mkdtemp(join(tmpdir(), 'upd-'))
  const b = await mkdtemp(join(tmpdir(), 'upd-'))
  for (const dir of [a, b]) {
    await mkdir(join(dir, 'sub'), { recursive: true })
    await writeFile(join(dir, 'SKILL.md'), 'name: x\n')
    await writeFile(join(dir, 'sub', 'ref.md'), 'hello')
  }
  const [ha, hb] = [await hashDir(a), await hashDir(b)]
  assert.equal(ha, hb)

  await writeFile(join(b, 'sub', 'ref.md'), 'hello!')
  assert.notEqual(await hashDir(a), await hashDir(b))
})

test('hashDir：跳过 .git 与 node_modules', async () => {
  const a = await mkdtemp(join(tmpdir(), 'upd-'))
  await writeFile(join(a, 'SKILL.md'), 'name: x\n')
  const before = await hashDir(a)

  await mkdir(join(a, '.git'), { recursive: true })
  await mkdir(join(a, 'node_modules', 'pkg'), { recursive: true })
  await writeFile(join(a, '.git', 'HEAD'), 'ref: main')
  await writeFile(join(a, 'node_modules', 'pkg', 'index.js'), 'x')
  assert.equal(await hashDir(a), before)
})

test('hashDir：空目录也有稳定指纹', async () => {
  const a = await mkdtemp(join(tmpdir(), 'upd-'))
  const b = await mkdtemp(join(tmpdir(), 'upd-'))
  assert.equal(await hashDir(a), await hashDir(b))
})
