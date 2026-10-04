window.GHZ_APP_ID = 'cleanboost'
;(function () {
  function normalize(key) {
    return String(key || '').trim().toUpperCase()
  }

  async function activateOnline(key, phone) {
    const { ipcRenderer } = require('electron')
    return await ipcRenderer.invoke('license:activate', {
      license_key: normalize(key),
      phone: String(phone || '')
    })
  }

  async function validateOnline() {
    const { ipcRenderer } = require('electron')
    return await ipcRenderer.invoke('license:validate')
  }

  async function openMainAfterActivation() {
    const { ipcRenderer } = require('electron')
    return await ipcRenderer.invoke('app:open-main-after-activation')
  }

  window.ghzLicense = { normalize, activateOnline, validateOnline, openMainAfterActivation }
  window.licencaAtivaCB = () => false
})()
