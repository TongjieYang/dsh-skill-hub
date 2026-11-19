import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { detectEnvVars, extractEnvNames, suggestService } from '../lib/detect.js'

async function fixture(files) {
  const dir = await mkdtemp(join(tmpdir(), 'detect-test-'))
  for (const [name, text] of Object.entries(files)) {
    const full = join(dir, name)
    await mkdir(join(full, '..'), { recursive: true })
    await writeFile(full, text, 'utf8')
  }
  return dir
}

test('extract: 四种写法都认，且按出现权重排序', () => {
  const text = [
    '先用 $WEREAD_API_KEY 取书单',
    'export AMAP_KEY=xxx',
    'node -e "process.env.OPENAI_API_KEY"',
    '"BAIDU_MAP_AK": "x"',
  ].join('\n')
  const names = extractEnvNames(text).map((item) => item.env)
  assert.deepEqual(new Set(names), new Set(['WEREAD_API_KEY', 'AMAP_KEY', 'OPENAI_API_KEY', 'BAIDU_MAP_AK']))
})

test('extract: 忽略 shell 噪声与太泛的名字', () => {
  const names = extractEnvNames('echo $PATH $HOME $PWD ${LANG} $TOKEN $API $SECRET').map((i) => i.env)
  assert.deepEqual(names, [])
})

test('extract: 不像凭据的变量名不列出来', () => {
  const names = extractEnvNames('$SKILL_DIR $MAX_COUNT $DEBUG_MODE').map((i) => i.env)
  assert.deepEqual(names, [])
})

test('detectEnvVars: SKILL.md 权重高于旁支文件', async () => {
  const dir = await fixture({
    'SKILL.md': '---\nname: demo\ndescription: 演示\n---\n\n需要 $DEMO_API_KEY\n',
    'run.sh': '#!/bin/sh\nexport OTHER_TOKEN=x\n',
  })
  try {
    const result = await detectEnvVars(dir)
    assert.equal(result.ok, true)
    assert.equal(result.vars[0].env, 'DEMO_API_KEY')
    assert.ok(result.vars.some((item) => item.env === 'OTHER_TOKEN'))
    assert.ok(result.vars[0].samples.length > 0)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('detectEnvVars: 没有 SKILL.md 报错而不是瞎猜', async () => {
  const dir = await fixture({ 'README.md': '$FOO_KEY' })
  try {
    const result = await detectEnvVars(dir)
    assert.equal(result.ok, false)
    assert.match(result.error, /SKILL\.md/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('suggestService：变量名里带服务商时优先用变量名', () => {
  assert.equal(suggestService('weread-skills', 'WEREAD_API_KEY'), 'weread')
  assert.equal(suggestService('baoyu-image-gen', 'OPENAI_API_KEY'), 'openai')
  assert.equal(suggestService('baoyu-image-gen', 'GEMINI_API_KEY'), 'gemini')
  assert.equal(suggestService('baoyu-image-gen', 'JIMENG_ACCESS_KEY_ID'), 'jimeng')
  assert.equal(suggestService('amap', 'AMAP_MAPS_API_KEY'), 'amap-maps')
  assert.equal(suggestService('baoyu-image-gen', 'ARK_API_KEY'), 'ark')
})

test('extract: 端点/配置项不算密钥', () => {
  const names = extractEnvNames([
    'AMAP_API_BASE_URL=https://x',
    'AMAP_API_KEY_ENV=OTHER',
    'API_BUSINESS=b2c',
    'OPENAI_IMAGE_API_DIALECT=openai',
    'API_KEY_MODEL=gpt',
  ].join('\n')).map((item) => item.env)
  assert.deepEqual(names, [])
})
