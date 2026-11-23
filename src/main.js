import './style.css'
import { footer, header, toastContainer } from './components.js'
import { icon } from './icons.js'
import { getGameById } from './data/games.js'
import { renderHome } from './views/home.js'
import { renderGames } from './views/games.js'
import { renderDetail, renderNotFound } from './views/detail.js'

const app = document.querySelector('#app')

function parseRoute() {
  const raw = (window.location.hash || '#/').replace(/^#/, '')
  const [pathname, search = ''] = raw.split('?')
  const query = new URLSearchParams(search)
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return { name: 'home', query }
  if (segments[0] === 'games') return { name: 'games', query }
  if (segments[0] === 'game' && segments[1]) {
    return { name: 'game', params: { id: decodeURIComponent(segments[1]) }, query }
  }
  return { name: 'notfound', query }
}

function showToast(message) {
  const container = document.querySelector('#toast-container')
  if (!container) return

  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.innerHTML = `${icon('info', { size: 18 })}<span></span>`
  toast.querySelector('span').textContent = `${message}はまだ実装されていません`
  container.appendChild(toast)
  // レイアウトを確定させてからクラスを付与し、トランジションを確実に動かす
  void toast.offsetWidth
  toast.classList.add('is-visible')

  window.setTimeout(() => {
    toast.classList.remove('is-visible')
    window.setTimeout(() => toast.remove(), 320)
  }, 3200)
}

function closeMobileNav() {
  const siteHeader = document.querySelector('#site-header')
  const toggle = document.querySelector('#nav-toggle')
  if (!siteHeader?.classList.contains('nav-open')) return
  siteHeader.classList.remove('nav-open')
  toggle?.setAttribute('aria-expanded', 'false')
  toggle?.setAttribute('aria-label', 'メニューを開く')
  if (toggle) toggle.innerHTML = icon('menu', { size: 22 })
}

function render() {
  const route = parseRoute()
  let view
  let init

  if (route.name === 'home') {
    view = renderHome()
  } else if (route.name === 'games') {
    const result = renderGames(route)
    view = result.html
    init = result.init
  } else if (route.name === 'game') {
    const game = getGameById(route.params.id)
    view = game ? renderDetail(game) : renderNotFound()
  } else {
    view = renderNotFound()
  }

  app.innerHTML = `${header(route)}<main id="main">${view}</main>${footer()}${toastContainer()}`
  init?.()
  window.scrollTo({ top: 0, behavior: 'auto' })
}

document.addEventListener('click', (event) => {
  const toggle = event.target.closest('#nav-toggle')
  if (toggle) {
    const siteHeader = document.querySelector('#site-header')
    const isOpen = siteHeader.classList.toggle('nav-open')
    toggle.setAttribute('aria-expanded', String(isOpen))
    toggle.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く')
    toggle.innerHTML = icon(isOpen ? 'close' : 'menu', { size: 22 })
    return
  }

  const dummy = event.target.closest('[data-dummy]')
  if (dummy) {
    event.preventDefault()
    showToast(dummy.dataset.dummy)
    return
  }

  if (event.target.closest('.main-nav a')) closeMobileNav()
})

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'header-search-form') return
  event.preventDefault()
  const query = new FormData(event.target).get('q')?.trim() ?? ''
  window.location.hash = query ? `#/games?q=${encodeURIComponent(query)}` : '#/games'
  event.target.querySelector('input')?.blur()
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMobileNav()
})

window.addEventListener('resize', () => {
  if (window.innerWidth > 860) closeMobileNav()
})

window.addEventListener('hashchange', render)

if (!window.location.hash) window.location.replace('#/')
render()
