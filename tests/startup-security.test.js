const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const { hashStartupItem, openVirusTotal } = require('../js/startup-security')

test('hash de comandos, variáveis e atalhos; rejeição de arquivos inválidos', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'cleanboost-test-'))
  const file = path.join(dir, 'program with spaces.exe')
  const contents = 'fixture, never executed'
  const hash = crypto.createHash('sha256').update(contents).digest('hex')
  const old = process.env.CLEANBOOST_TEST_DIR
  try {
    await fs.writeFile(file, contents)
    process.env.CLEANBOOST_TEST_DIR = dir
    for (const caminho of [`"${file}" --argument`, `${file} --argument`, '"%CLEANBOOST_TEST_DIR%/program with spaces.exe" /start']) {
      assert.deepEqual(await hashStartupItem({ caminho, registro: 'HKCU' }, {}), { ok: true, hash })
    }
    assert.deepEqual(await hashStartupItem({ caminho: path.join(dir, 'test.lnk'), registro: 'STARTUP_FOLDER' }, {
      readShortcutLink: () => ({ target: file })
    }), { ok: true, hash })
    await fs.mkdir(path.join(dir, 'folder.exe'))
    for (const caminho of ['', 'relative.exe', path.join(dir, 'missing.exe'), path.join(dir, 'folder.exe'), path.join(dir, 'private.txt')]) {
      assert.equal((await hashStartupItem({ caminho, registro: 'STARTUP_FOLDER' }, {})).ok, false)
    }
    assert.equal((await hashStartupItem(null, {})).ok, false)
    assert.equal((await hashStartupItem({ caminho: path.join(dir, 'bad.lnk') }, {
      readShortcutLink: () => { throw new Error('Invalid shortcut') }
    })).ok, false)
  } finally {
    if (old === undefined) delete process.env.CLEANBOOST_TEST_DIR
    else process.env.CLEANBOOST_TEST_DIR = old
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test('somente SHA-256 pode abrir a URL fixa do VirusTotal', async () => {
  const urls = []
  const shell = { openExternal: async url => urls.push(url) }
  for (const hash of [null, {}, '', 'a'.repeat(63), 'g'.repeat(64), 'https://example.com', 'a'.repeat(64) + '\n']) {
    assert.equal((await openVirusTotal(hash, shell)).ok, false)
  }
  assert.deepEqual(urls, [])
  assert.equal((await openVirusTotal('A'.repeat(64), shell)).ok, true)
  assert.deepEqual(urls, ['https://www.virustotal.com/gui/file/' + 'a'.repeat(64)])
  assert.equal((await openVirusTotal('a'.repeat(64), { openExternal: async () => { throw new Error('Failed') } })).ok, false)
})
