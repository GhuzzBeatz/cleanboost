const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path    = require('path')
const fs      = require('fs')
const os      = require('os')
const { execSync, exec } = require('child_process')
const createLocalLicenseGate = require('./js/local-license-gate')

app.setName('CleanBoost')

const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) app.quit()

// ── DADOS ──────────────────────────────────────────────────
function getDataDir() {
  return app.isPackaged
    ? path.join(app.getPath('userData'), 'data')
    : path.join(__dirname, 'data')
}
function lerJSON(nome, padrao) {
  const f = path.join(getDataDir(), nome + '.json')
  try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch(e) { return padrao }
}
function salvarJSON(nome, dados) {
  const dir = getDataDir()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, nome + '.json'), JSON.stringify(dados, null, 2))
}

// ── JANELA ─────────────────────────────────────────────────
let win = null
const licenseGate = createLocalLicenseGate({
  storageKey: '@CLEANBOOST:licenca', prefix: 'CLEAN', salt: 'GHZ2026CLEANBOOST', multiplier: 41
})

app.on('second-instance', () => {
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
})

function createWindow() {
  const dir = getDataDir()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  win = new BrowserWindow({
    width: 1300, height: 840, minWidth: 1100, minHeight: 700,
    title: 'CleanBoost', autoHideMenuBar: true, show: false,
    webPreferences: {
      nodeIntegration: true, nodeIntegrationInSubFrames: true,
      contextIsolation: false, webSecurity: false,
      devTools: !app.isPackaged,
      additionalArguments: ['--data-dir=' + dir]
    }
  })
  licenseGate.attach(win)
  win.once('ready-to-show', () => { win.show(); win.focus() })
  setTimeout(() => { if (win && !win.isVisible()) win.show() }, 4000)
  win.on('page-title-updated', e => e.preventDefault())
}

// ── HELPERS ────────────────────────────────────────────────
function ps(cmd) {
  try {
    return execSync(`powershell -NoProfile -Command "${cmd}"`, { encoding: 'utf8', timeout: 15000 }).trim()
  } catch(e) { return '' }
}

function tamanhoDir(dirPath) {
  let total = 0
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const item of items) {
      const full = path.join(dirPath, item.name)
      try {
        if (item.isDirectory()) total += tamanhoDir(full)
        else total += fs.statSync(full).size
      } catch(e) {}
    }
  } catch(e) {}
  return total
}

function deletarDentroDir(dirPath) {
  let deletados = 0, bytes = 0
  try {
    const items = fs.readdirSync(dirPath)
    for (const item of items) {
      const full = path.join(dirPath, item)
      try {
        const stat = fs.statSync(full)
        bytes += stat.isDirectory() ? tamanhoDir(full) : stat.size
        if (stat.isDirectory()) fs.rmSync(full, { recursive: true, force: true })
        else fs.unlinkSync(full)
        deletados++
      } catch(e) {}
    }
  } catch(e) {}
  return { deletados, bytes }
}

function fmtBytes(b) {
  if (b >= 1073741824) return (b / 1073741824).toFixed(2) + ' GB'
  if (b >= 1048576)    return (b / 1048576).toFixed(1) + ' MB'
  if (b >= 1024)       return (b / 1024).toFixed(0) + ' KB'
  return b + ' B'
}

// ── DIAGNÓSTICO ─────────────────────────────────────────────
ipcMain.handle('diag:hardware', async () => {
  try {
    const totalRam = os.totalmem()
    const livreRam = os.freemem()
    const cpus     = os.cpus()
    const uptime   = os.uptime()

    // Informações via WMI
    const nomePC     = ps("(Get-ComputerInfo).CsName")
    const sistemaOp  = ps("(Get-ComputerInfo).WindowsProductName")
    const versaoOS   = ps("(Get-ComputerInfo).OsVersion")
    const fabricante = ps("(Get-WmiObject Win32_ComputerSystem).Manufacturer")
    const modelo     = ps("(Get-WmiObject Win32_ComputerSystem).Model")
    const ramDetalhe = ps("Get-WmiObject Win32_PhysicalMemory | Select-Object -First 1 | ForEach-Object { $_.Manufacturer + ' ' + $_.PartNumber + ' ' + ($_.Speed) + 'MHz' }")
    const placaMae   = ps("(Get-WmiObject Win32_BaseBoard).Product")
    const placaVideo = ps("(Get-WmiObject Win32_VideoController | Select-Object -First 1).Name")
    const resolucao  = ps("(Get-WmiObject Win32_VideoController | Select-Object -First 1).CurrentHorizontalResolution").replace(/\s+/g,'') + 'x' + ps("(Get-WmiObject Win32_VideoController | Select-Object -First 1).CurrentVerticalResolution").replace(/\s+/g,'')
    const hds        = ps(`Get-WmiObject Win32_DiskDrive | ForEach-Object { $_.Model + ' ' + [math]::Round($_.Size/1GB) + 'GB' } | Out-String`).trim()
    const cpuNome    = cpus[0]?.model || ps("(Get-WmiObject Win32_Processor | Select-Object -First 1).Name")
    const cpuNucleos = cpus.length

    // Uptime formatado
    const dias   = Math.floor(uptime / 86400)
    const horas  = Math.floor((uptime % 86400) / 3600)
    const minutos = Math.floor((uptime % 3600) / 60)
    const uptimeFmt = dias > 0
      ? `${dias}d ${horas}h ${minutos}m`
      : `${horas}h ${minutos}m`

    return {
      ok: true,
      nomePC, sistemaOp, versaoOS, fabricante, modelo,
      cpu: cpuNome, cpuNucleos,
      totalRam, livreRam,
      ramDetalhe,
      placaMae, placaVideo,
      resolucao: resolucao === 'x' ? 'N/D' : resolucao,
      hds, uptimeFmt,
      ramUsoPct: Math.round((1 - livreRam / totalRam) * 100)
    }
  } catch(e) {
    return { ok: false, erro: e.message }
  }
})

ipcMain.handle('diag:cpu', async () => {
  try {
    // CPU usage via wmic
    const uso = ps("(Get-WmiObject Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average")
    return { uso: parseInt(uso) || 0 }
  } catch(e) { return { uso: 0 } }
})

ipcMain.handle('diag:disco', async () => {
  try {
    const raw = ps("Get-WmiObject Win32_LogicalDisk -Filter DriveType=3 | ForEach-Object { $_.DeviceID + '|' + $_.Size + '|' + $_.FreeSpace } | Out-String")
    const discos = raw.trim().split('\n').filter(l => l.includes('|')).map(linha => {
      const [letra, total, livre] = linha.trim().split('|')
      return {
        letra: letra.trim(),
        total: parseInt(total) || 0,
        livre: parseInt(livre) || 0,
        usado: (parseInt(total) || 0) - (parseInt(livre) || 0)
      }
    })
    return { discos }
  } catch(e) { return { discos: [] } }
})

// ── LIMPEZA ─────────────────────────────────────────────────
ipcMain.handle('limpar:analisar', async () => {
  const resultado = []

  // 1. Temp do Windows
  const tempWin = process.env.TEMP || path.join(os.tmpdir())
  const tempWin2 = path.join(process.env.SystemRoot || 'C:\\Windows', 'Temp')
  let bytesTemp = 0
  try { bytesTemp += tamanhoDir(tempWin) } catch(e) {}
  try { bytesTemp += tamanhoDir(tempWin2) } catch(e) {}
  resultado.push({ id: 'temp', nome: 'Arquivos Temporários', icon: '🗑️', bytes: bytesTemp, descricao: 'Pasta Temp do Windows e sistema' })

  // 2. Prefetch
  const prefetch = path.join(process.env.SystemRoot || 'C:\\Windows', 'Prefetch')
  let bytesPre = 0
  try { bytesPre = tamanhoDir(prefetch) } catch(e) {}
  resultado.push({ id: 'prefetch', nome: 'Prefetch do Windows', icon: '⚡', bytes: bytesPre, descricao: 'Arquivos de pré-carregamento do sistema' })

  // 3. Cache Chrome
  const chromeCachePath = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Cache')
  let bytesChrome = 0
  try { bytesChrome = tamanhoDir(chromeCachePath) } catch(e) {}
  resultado.push({ id: 'chrome', nome: 'Cache do Google Chrome', icon: '🌐', bytes: bytesChrome, descricao: 'Cache, imagens e dados temporários do Chrome' })

  // 4. Cache Edge
  const edgeCachePath = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache')
  let bytesEdge = 0
  try { bytesEdge = tamanhoDir(edgeCachePath) } catch(e) {}
  resultado.push({ id: 'edge', nome: 'Cache do Microsoft Edge', icon: '🌐', bytes: bytesEdge, descricao: 'Cache e dados temporários do Edge' })

  // 5. Cache Firefox
  const ffPath = path.join(os.homedir(), 'AppData', 'Local', 'Mozilla', 'Firefox', 'Profiles')
  let bytesFF = 0
  try {
    if (fs.existsSync(ffPath)) {
      fs.readdirSync(ffPath).forEach(p => {
        const cachePath = path.join(ffPath, p, 'cache2')
        try { bytesFF += tamanhoDir(cachePath) } catch(e) {}
      })
    }
  } catch(e) {}
  resultado.push({ id: 'firefox', nome: 'Cache do Firefox', icon: '🦊', bytes: bytesFF, descricao: 'Cache e dados temporários do Firefox' })

  // 6. Lixeira
  let bytesLixeira = 0
  try {
    const raw = ps("(New-Object -ComObject Shell.Application).NameSpace(10).Items() | Measure-Object -Property Size -Sum | Select-Object -ExpandProperty Sum")
    bytesLixeira = parseInt(raw) || 0
  } catch(e) {}
  resultado.push({ id: 'lixeira', nome: 'Lixeira', icon: '🗑️', bytes: bytesLixeira, descricao: 'Arquivos na Lixeira do Windows' })

  // 7. Miniaturas (Thumbs.db / thumbnail cache)
  const thumbPath = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Windows', 'Explorer')
  let bytesThumb = 0
  try { bytesThumb = tamanhoDir(thumbPath) } catch(e) {}
  resultado.push({ id: 'thumbs', nome: 'Cache de Miniaturas', icon: '🖼️', bytes: bytesThumb, descricao: 'Cache de visualização de imagens' })

  const totalBytes = resultado.reduce((s, r) => s + r.bytes, 0)
  return { itens: resultado, totalBytes }
})

ipcMain.handle('limpar:executar', async (event, ids) => {
  const log = []
  let totalBytes = 0

  for (const id of ids) {
    let bytes = 0
    try {
      if (id === 'temp') {
        const t1 = deletarDentroDir(process.env.TEMP || os.tmpdir())
        const t2 = deletarDentroDir(path.join(process.env.SystemRoot || 'C:\\Windows', 'Temp'))
        bytes = t1.bytes + t2.bytes
        log.push(`✅ Temp do Windows: ${fmtBytes(bytes)} liberados`)
      }
      if (id === 'prefetch') {
        const r = deletarDentroDir(path.join(process.env.SystemRoot || 'C:\\Windows', 'Prefetch'))
        bytes = r.bytes
        log.push(`✅ Prefetch: ${fmtBytes(bytes)} liberados`)
      }
      if (id === 'chrome') {
        const cp = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Cache')
        const r = deletarDentroDir(cp)
        bytes = r.bytes
        log.push(`✅ Cache Chrome: ${fmtBytes(bytes)} liberados`)
      }
      if (id === 'edge') {
        const ep = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache')
        const r = deletarDentroDir(ep)
        bytes = r.bytes
        log.push(`✅ Cache Edge: ${fmtBytes(bytes)} liberados`)
      }
      if (id === 'firefox') {
        const ffPath = path.join(os.homedir(), 'AppData', 'Local', 'Mozilla', 'Firefox', 'Profiles')
        if (fs.existsSync(ffPath)) {
          fs.readdirSync(ffPath).forEach(p => {
            try {
              const r = deletarDentroDir(path.join(ffPath, p, 'cache2'))
              bytes += r.bytes
            } catch(e) {}
          })
        }
        log.push(`✅ Cache Firefox: ${fmtBytes(bytes)} liberados`)
      }
      if (id === 'lixeira') {
        ps("Clear-RecycleBin -Force -ErrorAction SilentlyContinue")
        log.push(`✅ Lixeira esvaziada`)
      }
      if (id === 'thumbs') {
        const tp = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Windows', 'Explorer')
        const r = deletarDentroDir(tp)
        bytes = r.bytes
        log.push(`✅ Cache miniaturas: ${fmtBytes(bytes)} liberados`)
      }
      totalBytes += bytes
    } catch(e) {
      log.push(`⚠️ ${id}: ${e.message}`)
    }
  }

  // Salvar histórico
  const hist = lerJSON('historico', [])
  hist.unshift({ data: new Date().toLocaleString('pt-BR'), bytes: totalBytes, log, ids })
  if (hist.length > 50) hist.pop()
  salvarJSON('historico', hist)

  return { ok: true, totalBytes, log }
})

// ── INICIALIZAÇÃO ──────────────────────────────────────────
ipcMain.handle('inicio:listar', async () => {
  const items = []
  const seen  = new Set()

  // Método 1: leitura direta do registro via Node (mais confiável)
  try {
    const { execFileSync } = require('child_process')
    const regPaths = [
      ['HKCU', 'Software\\Microsoft\\Windows\\CurrentVersion\\Run'],
      ['HKLM', 'Software\\Microsoft\\Windows\\CurrentVersion\\Run'],
      ['HKLM', 'Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run'],
      ['HKCU', 'Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce'],
    ]
    for (const [hive, subkey] of regPaths) {
      try {
        const out = execFileSync('reg', ['query', `${hive}\\${subkey}`], {
          encoding: 'utf8', timeout: 8000, windowsHide: true
        })
        const lines = out.split('\n').filter(l => l.includes('    '))
        for (const line of lines) {
          const parts = line.trim().split(/\s{4}/)
          if (parts.length >= 3) {
            const nome = parts[0].trim()
            const tipo = parts[1].trim()
            const valor = parts.slice(2).join('    ').trim()
            if (nome && valor && !seen.has(nome.toLowerCase())) {
              seen.add(nome.toLowerCase())
              items.push({ id: items.length, registro: `${hive}\\${subkey}`, nome, caminho: valor, ativo: true })
            }
          }
        }
      } catch(e) {}
    }
  } catch(e) {}

  // Método 2: PowerShell via Get-ItemProperty (fallback)
  if (items.length === 0) {
    try {
      const raw = ps(`
        $paths = @(
          'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
          'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
          'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run'
        )
        foreach ($regPath in $paths) {
          try {
            $key = Get-Item -Path $regPath -ErrorAction Stop
            $key.GetValueNames() | Where-Object { $_ -ne '' } | ForEach-Object {
              $val = $key.GetValue($_)
              "$regPath|$_|$val"
            }
          } catch {}
        }
      `)
      raw.trim().split('\n').filter(l => l.includes('|')).forEach((linha, i) => {
        const parts = linha.trim().split('|')
        const nome  = parts[1]?.trim() || ''
        const valor = parts.slice(2).join('|').trim()
        if (nome && !seen.has(nome.toLowerCase())) {
          seen.add(nome.toLowerCase())
          items.push({ id: items.length, registro: parts[0]?.trim() || '', nome, caminho: valor, ativo: true })
        }
      })
    } catch(e) {}
  }

  // Método 3: Pasta Startup do usuário
  try {
    const startupPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup')
    if (fs.existsSync(startupPath)) {
      fs.readdirSync(startupPath).forEach(file => {
        if (file === 'desktop.ini') return
        const nome = file.replace(/\.(lnk|exe|bat|cmd)$/i, '')
        if (!seen.has(nome.toLowerCase())) {
          seen.add(nome.toLowerCase())
          items.push({ id: items.length, registro: 'STARTUP_FOLDER', nome, caminho: path.join(startupPath, file), ativo: true })
        }
      })
    }
  } catch(e) {}

  return { items }
})

ipcMain.handle('inicio:desativar', async (event, { registro, nome, caminho }) => {
  try {
    if (registro === 'STARTUP_FOLDER') {
      // Remover arquivo da pasta Startup
      if (caminho && fs.existsSync(caminho)) fs.unlinkSync(caminho)
      return { ok: true }
    }
    // Remover chave do registro
    const hive = registro.startsWith('HKCU') ? 'HKCU' : 'HKLM'
    const sub  = registro.replace(/^(HKCU|HKLM)\\/, '')
    try {
      const { execFileSync } = require('child_process')
      execFileSync('reg', ['delete', `${hive}\\${sub}`, '/v', nome, '/f'], {
        encoding: 'utf8', timeout: 8000, windowsHide: true
      })
      return { ok: true }
    } catch(e) {
      // Fallback PowerShell
      ps(`Remove-ItemProperty -Path '${registro}' -Name '${nome}' -ErrorAction SilentlyContinue`)
      return { ok: true }
    }
  } catch(e) { return { ok: false, erro: e.message } }
})

// ── PLANO DE ENERGIA ───────────────────────────────────────
ipcMain.handle('energia:status', async () => {
  try {
    const raw = ps("(powercfg /getactivescheme)")
    const nomes = { 'a1841308-3541-4fab-bc81-f71556f20b4a':'Economia de Energia', '381b4222-f694-41f0-9685-ff5bb260df2e':'Equilibrado', '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c':'Alto Desempenho', 'e9a42b02-d5df-448d-aa00-03f14749eb61':'Alto Desempenho Extremo' }
    const guid  = (raw.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i) || [])[1] || ''
    return { guid, nome: nomes[guid?.toLowerCase()] || raw.split('(')[1]?.replace(')','').trim() || 'Desconhecido' }
  } catch(e) { return { guid: '', nome: 'Desconhecido' } }
})

ipcMain.handle('energia:alterar', async (event, guid) => {
  try {
    ps(`powercfg /setactive ${guid}`)
    return { ok: true }
  } catch(e) { return { ok: false, erro: e.message } }
})

// ── HISTÓRICO ──────────────────────────────────────────────
ipcMain.handle('hist:ler',    async () => lerJSON('historico', []))
ipcMain.handle('hist:limpar', async () => { salvarJSON('historico', []); return { ok: true } })

// ── DADOS ──────────────────────────────────────────────────
ipcMain.handle('dados:ler',    async (e, nome) => lerJSON(nome, {}))
ipcMain.handle('dados:salvar', async (e, nome, dados) => { salvarJSON(nome, dados); return { ok: true } })

// ── CICLO ──────────────────────────────────────────────────
app.whenReady().then(async () => {
  if (!gotSingleInstanceLock) return
  createWindow()
  await win.loadFile('pages/licenca.html')
  if (await licenseGate.authorizeFromStorage(win)) await win.loadFile('index.html')
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
