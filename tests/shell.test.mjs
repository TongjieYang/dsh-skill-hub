import test from 'node:test'
import assert from 'node:assert/strict'

import { SHELLS, SHELL_LIST, detectShell, persistFor, shellFromPath } from '../lib/shell.js'

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





