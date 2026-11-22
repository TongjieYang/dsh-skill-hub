import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BUILTIN_TEAMS, mergeTeams, missingSkills, normalizeTeam, builtinTeam, slugify, emptyTeam,
  autoCompose, renderTeamSkill,
} from '../lib/teams.js'

test('builtin teams: nine, unique ids, roles bound to skills', () => {
  assert.equal(BUILTIN_TEAMS.length, 9)
  const ids = BUILTIN_TEAMS.map((t) => t.id)
  assert.equal(new Set(ids).size, 9)
  for (const id of ['baoyu-wechat-article', 'baoyu-visual-explain', 'baoyu-multichannel', 'baoyu-video-cover', 'short-video']) {
    assert.ok(ids.includes(id), id)
  }
  for (const team of BUILTIN_TEAMS) {
    assert.ok(team.goal.length > 0, team.id)
    assert.ok(team.roles.length >= 3, team.id)
    assert.ok(team.stages.length >= 3, team.id)
    assert.ok(team.guardrails.length >= 3, team.id)
    for (const role of team.roles) {
      assert.ok(role.duty.length > 0, `${team.id}/${role.id}`)
      assert.ok(role.deliverable.length > 0, `${team.id}/${role.id}`)
      assert.ok(role.skills.length > 0, `${team.id}/${role.id}`)
    }
    for (const stage of team.stages) {
      for (const roleId of stage.roleIds) {
        assert.ok(team.roles.some((r) => r.id === roleId), `${team.id}/${stage.id} → ${roleId}`)
      }
    }
  }
})

test('user team overrides builtin by id; others append', () => {
  const custom = { id: 'daohuo-video', title: '我的带货团', roles: [], stages: [] }
  const extra = { id: 'my-team', title: '自建团', roles: [], stages: [] }
  const merged = mergeTeams([custom, extra])
  assert.equal(merged.length, 10)
  assert.equal(merged.find((t) => t.id === 'daohuo-video').title, '我的带货团')
  assert.equal(merged.find((t) => t.id === 'daohuo-video').builtin, true)
  assert.equal(merged.find((t) => t.id === 'my-team').builtin, false)
})

test('mergeTeams tolerates garbage', () => {
  const merged = mergeTeams([null, 'x', {}, { id: 'ok', title: 'T', roles: [{ skills: ['a', 1, ''] }] }])
  assert.equal(merged.length, 10)
  const team = merged.find((t) => t.id === 'ok')
  assert.deepEqual(team.roles[0].skills, ['a'])
})

test('missingSkills reports only absent names', () => {
  const team = builtinTeam('daohuo-video')
  const missing = missingSkills(team, ['baokuan-video', 'qihao'])
  assert.ok(missing.includes('rea-video'))
  assert.ok(!missing.includes('baokuan-video'))
  assert.ok(!missing.includes('qihao'))
})

test('normalizeTeam fills ids and defaults', () => {
  const t = normalizeTeam({ title: '测试 团 A', roles: [{ title: 'R1' }] })
  assert.equal(t.id, '测试-团-a')
  assert.equal(t.emoji, '🧩')
  assert.equal(t.roles[0].id, 'role-1')
  assert.equal(t.builtin, false)
})

test('slugify is filesystem safe and non-empty', () => {
  assert.equal(slugify('带货视频团'), '带货视频团')
  assert.equal(slugify('  A/B  C  '), 'a-b-c')
  assert.ok(slugify('').length > 0)
})

test('emptyTeam is editable', () => {
  const t = emptyTeam()
  assert.equal(t.roles.length, 1)
  assert.deepEqual(t.stages, [])
})







test('autoCompose fills blanks: stage owners, duties, deliverables, guardrails', () => {
  const raw = {
    id: 'half',
    title: '半成品团',
    goal: '',
    roles: [
      { id: 'r1', title: '调研', skills: ['research'], duty: '', deliverable: '' },
      { id: 'r2', title: '写作', skills: ['copywriting'], duty: '', deliverable: '' },
    ],
    stages: [{ id: 's1', title: '调研一下', deliverable: '', roleIds: [] }],
    guardrails: [],
  }
  const { team, changes } = autoCompose(raw)
  assert.ok(changes.length >= 4)
  assert.equal(team.stages[0].roleIds[0], 'r1')
  assert.ok(team.roles[0].duty.length > 0)
  assert.ok(team.roles[0].deliverable.length > 0)
  assert.equal(team.guardrails.length, 3)
  assert.ok(team.goal.length > 0)
  // 再跑一次不应再产生改动（幂等）
  assert.equal(autoCompose(team).changes.length, 0)
})

test('autoCompose creates one stage per role when there are no stages', () => {
  const { team, changes } = autoCompose({
    id: 'flat',
    title: '无阶段团',
    roles: [
      { id: 'a', title: '写', skills: [] },
      { id: 'b', title: '发', skills: [] },
    ],
    stages: [],
  })
  assert.equal(team.stages.length, 2)
  assert.deepEqual(team.stages.map((s) => s.roleIds[0]), ['a', 'b'])
  assert.ok(changes.some((c) => c.includes('阶段')))
})

test('renderTeamSkill emits front-matter and a runnable SOP', () => {
  const team = normalizeTeam(BUILTIN_TEAMS[0])
  const text = renderTeamSkill({ ...team, skillName: 'team-daohuo-video' }, { skillNames: new Set(['research']) })
  assert.ok(text.startsWith('---\n'))
  assert.ok(text.includes('name: team-daohuo-video'))
  assert.ok(text.includes('description: '))
  assert.ok(text.includes('## 分工'))
  assert.ok(text.includes('## 流程'))
  assert.ok(text.includes('## 复盘'))
  assert.ok(text.includes('怎么用这个 skill'))
  assert.ok(text.includes('本地没装'))
})
