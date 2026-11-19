import test from 'node:test'
import assert from 'node:assert/strict'

import { SHELLS, SHELL_LIST, detectShell, persistFor, shellFromPath } from '../lib/shell.js'
import { buildKeyScript, buildLoadAll } from '../lib/keygen.js'

test('mainstream shells are covered, with a label each', () => {
  const ids = SHELL_LIST.map((s) => s.id)
  for (const id of ['zsh', 'bash', 'posix', 'fish', 'powershell', 'cmd']) {
    assert.ok(ids.includes(id), `missing shell ${id}`)
    assert.ok(SHELLS[id].label.length > 0, `missing label for ${id}`)
  }
})

test('detectShell prefers the explicit choice, then $SHELL, then the platform default', () => {
  assert.equal(detectShell({ shell: 'fish', env: { SHELL: '/bin/zsh' }, platform: 'darwin' }), 'fish')
  assert.equal(detectShell({ env: { SHELL: '/usr/local/bin/fish' }, platform: 'darwin' }), 'fish')
  assert.equal(detectShell({ env: { SHELL: '/bin/bash' }, platform: 'linux' }), 'bash')
  assert.equal(detectShell({ env: {}, platform: 'darwin' }), 'zsh')
  assert.equal(detectShell({ env: {}, platform: 'win32' }), 'powershell')
  // an unknown shell name must not leak through
  assert.equal(detectShell({ shell: 'elvish', env: { SHELL: '/bin/zsh' }, platform: 'darwin' }), 'zsh')
})

test('shellFromPath understands real shell paths', () => {
  assert.equal(shellFromPath('/bin/zsh'), 'zsh')
  assert.equal(shellFromPath('/usr/bin/fish'), 'fish')
  assert.equal(shellFromPath('/bin/sh'), 'posix')
  assert.equal(shellFromPath('/bin/dash'), 'posix')
  assert.equal(shellFromPath('C:\\Windows\\System32\\cmd.exe'), 'cmd')
  assert.equal(shellFromPath('/bin/mytool'), '')
})

test('each shell gets its own export syntax', () => {
  const read = "security find-generic-password -s 'skill-hub:weread' -a 'ytj' -w"
  assert.equal(SHELLS.zsh.exportLine('K', read), `export K="$(${read})"`)
  assert.equal(SHELLS.bash.exportLine('K', read), `export K="$(${read})"`)
  assert.equal(SHELLS.posix.exportLine('K', read), `export K="$(${read})"`)
  // fish has no $() and no export
  assert.equal(SHELLS.fish.exportLine('K', read), `set -gx K (${read})`)
  assert.ok(!SHELLS.fish.exportLine('K', read).includes('export'))
  assert.ok(!SHELLS.fish.exportLine('K', read).includes('$('))
})

test('persist names the right file per shell', () => {
  const home = '/home/u'
  assert.equal(persistFor({ shell: 'zsh', env: 'K', read: 'r', home }).fileLabel, '~/.zshenv')
  assert.equal(persistFor({ shell: 'bash', env: 'K', read: 'r', home }).fileLabel, '~/.bashrc')
  assert.equal(persistFor({ shell: 'fish', env: 'K', read: 'r', home }).fileLabel, '~/.config/fish/config.fish')
  assert.equal(persistFor({ shell: 'posix', env: 'K', read: 'r', home }).fileLabel, '~/.profile')
  assert.equal(persistFor({ shell: 'powershell', env: 'K', read: 'r', home }).fileLabel, '$PROFILE')
  // cmd has no profile file at all — we must say so instead of inventing one
  assert.equal(persistFor({ shell: 'cmd', env: 'K', read: 'r', home }).fileLabel, '')
  assert.equal(persistFor({ shell: 'zsh', env: 'K', read: 'r', home }).file, '/home/u/.zshenv')
  assert.equal(persistFor({ shell: 'fish', env: 'K', read: 'r', home }).file, '/home/u/.config/fish/config.fish')
})

test('key script follows the chosen shell on macOS', () => {
  const zsh = buildKeyScript({ env: 'WEREAD_API_KEY', service: 'weread', account: 'ytj', platform: 'darwin', shell: 'zsh' })
  assert.match(zsh.export, /^export WEREAD_API_KEY="\$\(security find-generic-password/)
  assert.equal(zsh.persist.fileLabel, '~/.zshenv')
  assert.equal(zsh.shell, 'zsh')

  const fish = buildKeyScript({ env: 'WEREAD_API_KEY', service: 'weread', account: 'ytj', platform: 'darwin', shell: 'fish' })
  assert.match(fish.export, /^set -gx WEREAD_API_KEY \(security find-generic-password/)
  assert.equal(fish.persist.fileLabel, '~/.config/fish/config.fish')
  // the add/verify commands are shell-independent — they stay the same
  assert.equal(fish.addPrompt, zsh.addPrompt)
})

test('key script follows the chosen shell on Windows', () => {
  const ps = buildKeyScript({ env: 'ARK_API_KEY', service: 'ark', account: 'u', platform: 'win32', shell: 'powershell' })
  assert.match(ps.export, /^\$env:ARK_API_KEY = /)
  assert.equal(ps.persist.fileLabel, '$PROFILE')

  const cmd = buildKeyScript({ env: 'ARK_API_KEY', service: 'ark', account: 'u', platform: 'win32', shell: 'cmd' })
  assert.match(cmd.export, /^for \/f "usebackq delims=" %A in \(`powershell -NoProfile -Command "/)
  assert.match(cmd.export, /do set "ARK_API_KEY=%A"$/)
  assert.equal(cmd.persist.fileLabel, '')
})

test('a Windows-only shell choice on macOS falls back to POSIX instead of emitting nonsense', () => {
  const odd = buildKeyScript({ env: 'WEREAD_API_KEY', service: 'weread', account: 'ytj', platform: 'darwin', shell: 'powershell' })
  assert.match(odd.export, /^export WEREAD_API_KEY="\$\(security find-generic-password/)
  assert.equal(odd.shell, 'posix')
})

test('buildLoadAll exports every key in the requested shell', () => {
  const keys = [
    { env: 'WEREAD_API_KEY', service: 'skill-hub:weread', account: 'ytj' },
    { env: 'ARK_API_KEY', service: 'skill-hub:ark', account: 'ytj' },
  ]
  const fish = buildLoadAll(keys, 'darwin', 'fish')
  assert.equal(fish.ok, true)
  assert.equal((fish.script.match(/set -gx /g) ?? []).length, 2)
  assert.ok(!fish.script.includes('export '))
  assert.ok(!fish.script.startsWith('#!/bin/sh'))

  const zsh = buildLoadAll(keys, 'darwin', 'zsh')
  assert.ok(zsh.script.startsWith('#!/bin/sh'))
  assert.equal((zsh.script.match(/export /g) ?? []).length, 2)
})
