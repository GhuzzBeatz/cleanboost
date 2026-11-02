// Ajuda local: configurar os textos reais de cada produto em js/page-help-content.js.
;(function () {
  document.querySelectorAll('[data-page-panel]').forEach(panel => {
    const info = (window.GHZ_PAGE_HELP || {})[panel.dataset.pagePanel]
    if (!info) return
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'ajuda-btn'
    button.textContent = '💡 Como usar: ' + info.titulo
    button.setAttribute('aria-haspopup', 'dialog')
    const heading = panel.querySelector('.page-heading')
    if (!heading || heading.querySelector('.ajuda-btn')) return
    heading.appendChild(button)
    button.addEventListener('click', () => abrir(button, info))
  })
  function abrir(button, info) {
    if (document.querySelector('.ajuda-dialog')) return
    const dialog = document.createElement('dialog')
    dialog.className = 'ajuda-dialog'
    dialog.setAttribute('aria-labelledby', 'ajuda-titulo')
    const heading = document.createElement('div')
    heading.className = 'ajuda-heading'
    const title = document.createElement('h2')
    title.id = 'ajuda-titulo'
    title.textContent = '💡 Como usar: ' + info.titulo
    const close = document.createElement('button')
    close.type = 'button'
    close.className = 'ajuda-x'
    close.textContent = '×'
    close.setAttribute('aria-label', 'Fechar ajuda')
    heading.append(title, close)
    const intro = document.createElement('p')
    intro.className = 'ajuda-intro'
    intro.textContent = info.intro
    const steps = document.createElement('ol')
    steps.className = 'ajuda-steps'
    info.passos.forEach((text, i) => {
      const li = document.createElement('li')
      const number = document.createElement('span')
      number.className = 'ajuda-n'
      number.setAttribute('aria-hidden', 'true')
      number.textContent = i + 1
      const content = document.createElement('span')
      content.textContent = text
      li.append(number, content)
      steps.appendChild(li)
    })
    const tip = document.createElement('div')
    tip.className = 'ajuda-dica'
    const label = document.createElement('b')
    label.textContent = '💡 Dica: '
    tip.append(label, document.createTextNode(info.dica))
    dialog.append(heading, intro, steps, tip)
    dialog.addEventListener('close', () => { dialog.remove(); button.focus() }, { once: true })
    close.addEventListener('click', () => dialog.close())
    dialog.addEventListener('click', event => {
      const bounds = dialog.getBoundingClientRect()
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close()
    })
    document.body.appendChild(dialog)
    dialog.showModal()
    close.focus()
  }
})()
