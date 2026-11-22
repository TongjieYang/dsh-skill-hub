import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  emptyProfiles, profileStatus, buildBatch, buildPrompt, applyProfiles, resetProfiles,
  profileOneLiner, pairSuggestions, profilesPath,
} from '../lib/profile.js'

const SKILLS = [
  { name: 'baoyu-xhs-images', category: 'image-design', description: '生成小红书图片卡片。第二句不该出现。' },
  { name: 'baokuan-video', category: 'content-video', description: '短视频生产系统' },
  { name: 'copywriting', category: 'writing', description: 'Marketing copy' },
]

test('空档案：全部待分析、ready=false', () => {
  const status = profileStatus(emptyProfiles(), SKILLS)
  assert.equal(status.total, 3)
  assert.equal(status.profiled, 0)
  assert.equal(status.ready, false)
  assert.equal(status.started, false)
  assert.equal(status.missingCount, 3)
})

test('题干只带已有信息，描述超长截断', () => {
  const batch = buildBatch([{ name: 'x', category: 'c', description: 'a'.repeat(400) }], { offset: 0, limit: 5 })
  assert.equal(batch.items.length, 1)
  assert.equal(batch.items[0].name, 'x')
  assert.ok(batch.items[0].description.length <= 241)
})

test('任务书里带 JSON 契约，agent 知道怎么回写', () => {
  const prompt = buildPrompt(buildBatch(SKILLS, {}))
  assert.match(prompt, /skill_hub_profile/)
  assert.match(prompt, /"action":"apply"/)
  assert.match(prompt, /baoyu-xhs-images/)
})

test('apply：只收库里有的 skill，pairs 只留库内名字、去自己、最多 3 个', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'profile-'))
  const result = await applyProfiles(dir, [
    { name: 'baoyu-xhs-images', purpose: '做小红书图文', whenToUse: '发图文时', pairs: ['baokuan-video', 'copywriting', 'ghost', 'baoyu-xhs-images'] },
    { name: 'ghost', purpose: '不存在' },
    { name: '', purpose: '空名字' },
  ], SKILLS)
  assert.equal(result.applied, 1)
  assert.equal(result.skipped.length, 2)
  assert.equal(result.status.profiled, 1)

  const saved = JSON.parse(await readFile(profilesPath(dir), 'utf8'))
  assert.deepEqual(saved.items['baoyu-xhs-images'].pairs, ['baokuan-video', 'copywriting'])
  assert.equal(saved.items['ghost'], undefined)
})

test('全部画像后 ready=true，且能给出落单建议', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'profile-'))
  await applyProfiles(dir, SKILLS.map((s) => ({ name: s.name, purpose: `${s.name} 的用途`, whenToUse: '需要时' })), SKILLS)
  const saved = JSON.parse(await readFile(profilesPath(dir), 'utf8'))
  const status = profileStatus(saved, SKILLS)
  assert.equal(status.ready, true)
  assert.equal(status.started, true)
  assert.equal(profileOneLiner(saved, SKILLS[2]), 'copywriting 的用途')
  assert.deepEqual(pairSuggestions(saved, 'baokuan-video'), [])
})

test('没画像时退回描述首句，不阻塞使用', () => {
  const line = profileOneLiner(emptyProfiles(), SKILLS[0])
  assert.equal(line, '生成小红书图片卡片')
})

test('reset 清空', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'profile-'))
  await applyProfiles(dir, [{ name: 'copywriting', purpose: 'p' }], SKILLS)
  const status = await resetProfiles(dir, SKILLS)
  assert.equal(status.profiled, 0)
  const raw = JSON.parse(await readFile(profilesPath(dir), 'utf8'))
  assert.deepEqual(raw.items, {})
})
