import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classify, categoryCounts, CATEGORY_IDS, categoryById } from '../lib/classify.js'

const c = (name, description = '') => classify({ name, description })

test('name prefix rules win', () => {
  assert.equal(c('lark-doc'), 'collab')
  assert.equal(c('amap'), 'map-travel')
  assert.equal(c('baoyu-cover-image'), 'image-design')
  assert.equal(c('baoyu-translate'), 'writing')
  assert.equal(c('office-pptx'), 'office-docs')
  assert.equal(c('tdd'), 'dev')
})

test('known content skills land in content-video', () => {
  for (const name of ['baokuan-video', 'onetake', 'adu-motion-video', 'jianying-edit', 'hyperframes']) {
    assert.equal(c(name, ''), 'content-video', name)
  }
})

test('keyword scoring on description', () => {
  assert.equal(c('zzz-unknown', '帮我做小红书笔记和标题'), 'commerce-ops')
  assert.equal(c('zzz-unknown', '生成海报和封面插画'), 'image-design')
  assert.equal(c('zzz-unknown', '部署 docker 容器并跑测试'), 'dev')
})

test('defaults to other', () => {
  assert.equal(c('xyzzy', ''), 'other')
})

test('categoryCounts returns every category in declaration order', () => {
  const counts = categoryCounts([
    { category: 'dev' },
    { category: 'dev' },
    { category: 'content-video' },
  ])
  assert.deepEqual(counts.map((x) => x.id), CATEGORY_IDS)
  assert.equal(counts.find((x) => x.id === 'dev').count, 2)
  assert.equal(counts.find((x) => x.id === 'other').count, 0)
})

test('every category has zh label and 10 buckets exist', () => {
  assert.equal(CATEGORY_IDS.length, 10)
  for (const id of CATEGORY_IDS) {
    const meta = categoryById(id)
    assert.ok(meta.zh.length > 0, id)
    assert.ok(meta.emoji.length > 0, id)
  }
})
