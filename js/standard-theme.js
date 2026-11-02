// Apply the shared GHZ theme to existing iframe pages without reloading them.
;(function () {
  function apply(theme) {
    document.body.dataset.theme = theme === 'light' ? 'light' : 'dark'
    document.querySelectorAll('iframe').forEach(frame => {
      try { frame.contentDocument.body.dataset.theme = document.body.dataset.theme } catch (_) {}
    })
  }
  try { apply(localStorage.getItem('ghz-app-theme')) } catch (_) { apply('dark') }
  document.addEventListener('ghz:theme-changed', event => apply(event.detail.theme))
  window.addEventListener('storage', event => {
    if (event.key === 'ghz-app-theme') apply(event.newValue)
  })
  document.querySelectorAll('iframe').forEach(frame => frame.addEventListener('load', () => apply(document.body.dataset.theme)))
})()
