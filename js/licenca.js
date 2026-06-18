const SALT_CB   = 'GHZ2026CLEANBOOST'
const LS_KEY_CB = '@CLEANBOOST:licenca'
const PREFIX_CB = 'CLEAN'

function gerarChaveCB(n) {
  const p1 = String(n).padStart(4, '0')
  const p2 = btoa(n + SALT_CB).replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase()
  const p3 = String((n * 41) % 9999).padStart(4, '0')
  return `${PREFIX_CB}-${p1}-${p2}-${p3}`
}
function validarChaveCB(key) {
  if (!key) return false
  const clean = key.trim().toUpperCase()
  const parts = clean.split('-')
  if (parts.length !== 4 || parts[0] !== PREFIX_CB) return false
  const n = parseInt(parts[1])
  if (isNaN(n)) return false
  return gerarChaveCB(n) === clean
}
function licencaAtivaCB() {
  try { return validarChaveCB(localStorage.getItem(LS_KEY_CB) || '') } catch(e) { return false }
}
function salvarLicencaCB(key) { localStorage.setItem(LS_KEY_CB, key.trim().toUpperCase()) }
