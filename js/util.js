function fmtBytes(b) {
  b = Number(b) || 0
  if (b >= 1073741824) return (b / 1073741824).toFixed(2) + ' GB'
  if (b >= 1048576)    return (b / 1048576).toFixed(1) + ' MB'
  if (b >= 1024)       return (b / 1024).toFixed(0) + ' KB'
  return b + ' B'
}

function fmtData(d) {
  if (!d) return '—'
  const p = d.split('-')
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d
}

function avisoModal(msg) {
  const o = document.createElement('div')
  o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)'
  o.innerHTML = `<div style="background:#1e1e1e;border:1px solid #cc0000;border-radius:14px;padding:28px 32px;max-width:380px;text-align:center;box-shadow:0 0 40px rgba(204,0,0,.3)">
    <div style="font-size:13px;color:#f0f0f0;margin-bottom:18px;line-height:1.6">${msg}</div>
    <button onclick="this.closest('div[style]').remove()" style="padding:9px 24px;border:none;border-radius:8px;background:#cc0000;color:#fff;cursor:pointer;font-size:13px;font-weight:700;font-family:inherit">OK</button>
  </div>`
  document.body.appendChild(o)
}

function confirmar(msg, cb) {
  const o = document.createElement('div')
  o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)'
  o.innerHTML = `<div style="background:#1e1e1e;border:1px solid #cc0000;border-radius:14px;padding:28px 32px;max-width:400px;text-align:center;box-shadow:0 0 40px rgba(204,0,0,.3)">
    <div style="font-size:24px;margin-bottom:10px">⚠️</div>
    <div style="font-size:13px;color:#f0f0f0;margin-bottom:18px;line-height:1.5">${msg}</div>
    <div style="display:flex;gap:10px;justify-content:center">
      <button id="cfnN" style="padding:9px 20px;border:1px solid #333;border-radius:8px;background:transparent;color:#a0a0a0;cursor:pointer;font-size:13px;font-family:inherit">Cancelar</button>
      <button id="cfnS" style="padding:9px 20px;border:none;border-radius:8px;background:#cc0000;color:#fff;cursor:pointer;font-size:13px;font-weight:700;font-family:inherit">Confirmar</button>
    </div>
  </div>`
  document.body.appendChild(o)
  o.querySelector('#cfnS').onclick = () => { o.remove(); cb(true) }
  o.querySelector('#cfnN').onclick = () => { o.remove(); cb(false) }
}

function aviso(tipo, msg, elId = 'avisoEl') {
  const el = document.getElementById(elId)
  if (!el) return
  el.textContent = msg
  el.className = `aviso ${tipo === 'ok' ? 'av-ok' : 'av-err'}`
  el.style.display = 'block'
  setTimeout(() => el.style.display = 'none', 4000)
}
