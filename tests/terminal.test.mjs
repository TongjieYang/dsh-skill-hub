import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runInTerminal } from '../lib/terminal.js'

test('runInTerminal 拒绝空命令与 NUL 字节', async () => {
  await assert.rejects(() => runInTerminal({ script: '   ', dir: '/tmp', platform: 'linux' }), /没有可执行的命令/)
  await assert.rejects(() => runInTerminal({ script: 'echo a\u0000b', dir: '/tmp', platform: 'linux' }), /非法字符/)
})

test('runInTerminal 在未知平台报可读错误，而不是静默成功', async () => {
  await assert.rejects(
    () => runInTerminal({ script: 'echo hi', dir: '/tmp', platform: 'plan9' }),
    /没找到可用的终端程序/,
  )
})
