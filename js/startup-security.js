const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function expandEnvironment(value) {
  return value.replace(/%([^%]+)%/g, (match, name) => {
    const key = Object.keys(process.env).find(key => key.toLowerCase() === name.toLowerCase())
    return key ? process.env[key] : match
  })
}

async function hashStartupItem(item, shell) {
  try {
    if (!item || typeof item.caminho !== 'string' || !item.caminho.trim() || item.caminho.includes('\0')) {
      throw new Error('Caminho inválido.')
    }
    let target = expandEnvironment(item.caminho.trim())
    if (item.registro !== 'STARTUP_FOLDER') {
      // Preserve spaces inside the executable path; never execute the command.
      const match = target.startsWith('"')
        ? target.match(/^"([^"]+)"(?:\s|$)/)
        : target.match(/^(.+?\.(?:exe|dll|lnk|bat|cmd|ps1|vbs))(?=\s|$)/i)
      if (!match) throw new Error('Não foi possível identificar o arquivo do comando.')
      target = match[1]
    }
    if (path.extname(target).toLowerCase() === '.lnk') {
      target = expandEnvironment(shell.readShortcutLink(target).target || '')
    }
    if (!path.isAbsolute(target) || !/\.(exe|dll|bat|cmd|ps1|vbs)$/i.test(target)) {
      throw new Error('Tipo de arquivo ou caminho não suportado.')
    }
    if (!(await fs.promises.stat(target)).isFile()) throw new Error('O caminho não é um arquivo comum.')
    const hash = crypto.createHash('sha256')
    for await (const chunk of fs.createReadStream(target)) hash.update(chunk)
    return { ok: true, hash: hash.digest('hex') }
  } catch (error) {
    return { ok: false, erro: error.message }
  }
}

async function openVirusTotal(hash, shell) {
  if (typeof hash !== 'string' || hash.length !== 64 || !/^[a-f0-9]{64}$/i.test(hash)) {
    return { ok: false, erro: 'Hash SHA-256 inválido.' }
  }
  try {
    await shell.openExternal('https://www.virustotal.com/gui/file/' + hash.toLowerCase())
    return { ok: true }
  } catch (error) {
    return { ok: false, erro: error.message }
  }
}

module.exports = { hashStartupItem, openVirusTotal }
