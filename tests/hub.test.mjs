import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  buildState, searchSkills, renderTeam, setOverride, saveTeam, deleteTeam,
  addKey, removeKey, keyScript,
} from '../lib/hub.js'
import { loadConfig } from '../lib/store.js'

async function fixture() {
  const home = await mkdtemp(join(tmpdir(), 'skillhub-'))
  const skillsDir = join(home, 'skills')
  const dir = join(home, 'hub')
  const make = async (name, desc) => {
    await mkdir(join(skillsDir, name), { recursive: true })
    await writeFile(join(skillsDir, name, 'SKILL.md'), `---\nname: ${name}\ndescription: "${desc}"\n---\n\n# ${name}\n`)
  }
  await make('baokuan-video', '短视频生产')
  await make('lark-doc', '飞书文档')
  await make('amap', '高德地图')
  await writeFile(join(home, 'roots.json'), '{}')
  return { home, dir, skillsDir, make }
}

const rootsOf = (skillsDir) => [{ path: skillsDir, label: 'test', rank: 1 }]

test('buildState composes skills, categories, teams, keys', async () => {
  const { dir, skillsDir } = await fixture()
  const configFile = join(dir, 'config.json')
  await mkdir(dir, { recursive: true })
  await writeFile(configFile, JSON.stringify({ roots: rootsOf(skillsDir) }))
  const state = await buildState({ dir })
  assert.equal(state.ok, true)
  assert.equal(state.skills.length, 3)
  assert.equal(state.categories.length, 12)
  assert.equal(state.teams.length, 4)
  assert.ok(state.teams.every((t) => Array.isArray(t.missingSkills)))
  const daohuo = state.teams.find((t) => t.id === 'daohuo-video')
  assert.ok(daohuo.missingSkills.includes('baokuan-video') === false)
  assert.ok(state.containers.length === 0)
  assert.equal(state.platform.length > 0, true)
})

test('searchSkills filters by query and category', async () => {
  const { dir, skillsDir } = await fixture()
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'config.json'), JSON.stringify({ roots: rootsOf(skillsDir) }))
  const state = await buildState({ dir })
  assert.equal(searchSkills(state, { query: 'baokuan' }).total, 1)
  assert.equal(searchSkills(state, { category: 'collab' }).total, 1)
  assert.equal(searchSkills(state, { query: 'graph', limit: 1 }).total, 0)
})

test('setOverride persists and overrides classification', async () => {
  const { dir, skillsDir } = await fixture()
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'config.json'), JSON.stringify({ roots: rootsOf(skillsDir) }))
  const before = await buildState({ dir })
  assert.equal(before.skills.find((s) => s.name === 'amap').category, 'map-travel')
  const res = await setOverride({ dir, name: 'amap', category: 'dev' })
  assert.equal(res.ok, true)
  const after = await buildState({ dir })
  assert.equal(after.skills.find((s) => s.name === 'amap').category, 'dev')
  assert.equal(after.skills.find((s) => s.name === 'amap').overridden, true)
  await setOverride({ dir, name: 'amap', category: '' })
  const reset = await buildState({ dir })
  assert.equal(reset.skills.find((s) => s.name === 'amap').category, 'map-travel')
})

test('setOverride rejects unknown category', async () => {
  const { dir } = await fixture()
  const res = await setOverride({ dir, name: 'x', category: 'nope' })
  assert.equal(res.ok, false)
})

test('saveTeam / deleteTeam round trip', async () => {
  const { dir } = await fixture()
  const res = await saveTeam({ dir, team: { id: 'mine', title: '我的团', goal: 'g', roles: [{ title: 'R', skills: ['amap'] }] } })
  assert.equal(res.ok, true)
  let state = await buildState({ dir })
  assert.ok(state.teams.some((t) => t.id === 'mine'))
  assert.equal(state.teams.find((t) => t.id === 'mine').roles[0].skills[0], 'amap')
  await deleteTeam({ dir, id: 'mine' })
  state = await buildState({ dir })
  assert.ok(!state.teams.some((t) => t.id === 'mine'))
})

test('saveTeam requires a title', async () => {
  const { dir } = await fixture()
  const res = await saveTeam({ dir, team: { title: '   ' } })
  assert.equal(res.ok, false)
})

test('renderTeam prints roles, stages, guardrails, missing skills', async () => {
  const { dir, skillsDir } = await fixture()
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'config.json'), JSON.stringify({ roots: rootsOf(skillsDir) }))
  const state = await buildState({ dir })
  const team = state.teams.find((t) => t.id === 'app-builder')
  const text = renderTeam(team)
  assert.ok(text.includes('应用开发团'))
  assert.ok(text.includes('绑定 skill'))
  assert.ok(text.includes('铁律'))
  assert.ok(text.includes('缺失 skill'))
  const staged = renderTeam(team, 's1')
  assert.ok(staged.includes('当前阶段'))
  assert.ok(!staged.includes('## 阶段'))
})

test('addKey records metadata and returns placeholder script; secret never stored', async () => {
  const { dir } = await fixture()
  const res = await addKey({ dir, key: { env: 'WEREAD_API_KEY', service: 'weread', account: 'ytj', note: '微信读书' }, platform: 'darwin' })
  assert.equal(res.ok, true)
  assert.ok(res.script.add.includes('__SECRET__'))
  const config = await loadConfig(dir)
  assert.equal(config.keys.length, 1)
  assert.equal(config.keys[0].env, 'WEREAD_API_KEY')
  assert.equal(config.keys[0].service, 'skill-hub:weread')
  assert.equal(JSON.stringify(config).includes('wrk-'), false)
  assert.deepEqual(Object.keys(config.keys[0]).sort(), ['account', 'createdAt', 'env', 'note', 'platform', 'service'])
})

test('addKey rejects invalid env and duplicates collapse to one', async () => {
  const { dir } = await fixture()
  assert.equal((await addKey({ dir, key: { env: 'bad name' } })).ok, false)
  await addKey({ dir, key: { env: 'A_KEY', service: 'a' }, platform: 'darwin' })
  await addKey({ dir, key: { env: 'A_KEY', service: 'a2' }, platform: 'darwin' })
  const config = await loadConfig(dir)
  assert.equal(config.keys.length, 1)
  assert.equal(config.keys[0].service, 'skill-hub:a2')
})

test('removeKey drops metadata and returns the removal script', async () => {
  const { dir } = await fixture()
  await addKey({ dir, key: { env: 'A_KEY', service: 'a' }, platform: 'darwin' })
  const res = await removeKey({ dir, env: 'A_KEY' })
  assert.equal(res.ok, true)
  assert.ok(res.script.remove.includes('delete-generic-password'))
  assert.equal((await loadConfig(dir)).keys.length, 0)
})

test('keyScript works for an unregistered key', async () => {
  const res = keyScript({ env: 'AMAP_KEY', service: 'amap', platform: 'linux' })
  assert.equal(res.ok, true)
  assert.ok(res.add.includes('secret-tool'))
})
