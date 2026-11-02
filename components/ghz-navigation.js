;(function () {
  const shell = document.querySelector('.app-shell')
  const toggle = document.getElementById('sidebarToggle')
  const search = document.getElementById('menuSearch')
  const buttons = [...document.querySelectorAll('.nav-button')]
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  buttons.forEach(button => {
    const text = [...button.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').trim()
    const label = document.createElement('span')
    label.className = 'nav-label'
    label.textContent = text
    button.querySelector('span').classList.add('nav-icon')
    ;[...button.childNodes].filter(n => n.nodeType === 3).forEach(n => n.remove())
    button.appendChild(label)
    button.title = text
    button.setAttribute('aria-label', text)
  })
  function collapse(value) {
    shell.classList.toggle('sidebar-collapsed', value)
    toggle.setAttribute('aria-expanded', String(!value))
    toggle.title = value ? 'Expandir menu' : 'Recolher menu'
    toggle.setAttribute('aria-label', toggle.title)
    localStorage.setItem('ghz-sidebar-collapsed', String(value))
  }
  function filter() {
    const query = normalize(search.value)
    let count = 0
    buttons.forEach(button => { button.hidden = !normalize(button.getAttribute('aria-label')).includes(query); if (!button.hidden) count++ })
    document.getElementById('menuSearchEmpty').hidden = count > 0
    document.getElementById('menuSearchStatus').textContent = query ? `${count} abas encontradas` : ''
  }
  collapse(localStorage.getItem('ghz-sidebar-collapsed') === 'true')
  toggle.addEventListener('click', () => collapse(!shell.classList.contains('sidebar-collapsed')))
  search.addEventListener('input', filter)
  search.addEventListener('keydown', event => {
    if (event.key === 'Escape') { search.value = ''; filter() }
    if (event.key === 'Enter' || event.key === 'ArrowDown') {
      const first = buttons.find(button => !button.hidden)
      if (first) { event.preventDefault(); if (event.key === 'Enter') first.click(); else first.focus() }
    }
  })
  buttons.forEach(button => button.addEventListener('click', () => { search.value = ''; filter() }))
  document.getElementById('menuSearchFocus').addEventListener('click', () => { collapse(false); search.focus() })
  document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('.ghz-support-link').forEach(link => { link.title = link.textContent.trim(); link.setAttribute('aria-label', link.title) }), { once: true })
})()
