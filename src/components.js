import { icon } from './icons.js'
import { coverFor } from './cover.js'
import { formatNumber, formatPrice, getGenreLabel } from './data/games.js'

export const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char])

export const brand = (compact = false) => `
  <a class="brand${compact ? ' brand--compact' : ''}" href="#/" aria-label="INDIEPORT ホームへ">
    <span class="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" width="32" height="32">
        <defs><linearGradient id="brand-gradient" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ff5c7a"/><stop offset="1" stop-color="#9b6bff"/></linearGradient></defs>
        <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#brand-gradient)"/>
        <path d="M12.5 9.2 23 16l-10.5 6.8V9.2Z" fill="#11121a"/>
      </svg>
    </span>
    <span class="brand-name">INDIE<span>PORT</span></span>
  </a>`

const navItems = [
  { label: 'ホーム', href: '#/', match: 'home' },
  { label: 'ゲームを探す', href: '#/games', match: 'games' },
  { label: '新着', href: '#/games?sort=new', match: 'new' },
  { label: '人気', href: '#/games?sort=popular', match: 'popular' },
]

export function header(route) {
  const active =
    route.name === 'game' && route.params.id
      ? 'games'
      : route.name === 'games'
        ? route.query.sort === 'new'
          ? 'new'
          : route.query.sort === 'popular'
            ? 'popular'
            : 'games'
        : 'home'

  return `
  <header class="site-header" id="site-header">
    <div class="container header-inner">
      ${brand()}

      <nav class="main-nav" id="main-nav" aria-label="メインナビゲーション">
        ${navItems
          .map(
            (item) => `
          <a class="nav-link${active === item.match ? ' is-active' : ''}" href="${item.href}"${active === item.match ? ' aria-current="page"' : ''}>${item.label}</a>`,
          )
          .join('')}
      </nav>

      <div class="header-actions">
        <form class="header-search" id="header-search-form" role="search">
          <label class="sr-only" for="global-search">ゲームを検索</label>
          ${icon('search', { size: 17 })}
          <input id="global-search" type="search" name="q" placeholder="ゲームを検索" autocomplete="off" />
        </form>
        <button class="btn btn--primary btn--small btn--upload" type="button" data-dummy="作品の投稿機能">${icon('plus', { size: 17 })}<span>作品を投稿</span></button>
        <button class="avatar-btn" type="button" aria-label="アカウント" data-dummy="アカウント機能">
          <span>IN</span>
        </button>
        <button class="nav-toggle" id="nav-toggle" type="button" aria-label="メニューを開く" aria-expanded="false" aria-controls="main-nav">
          ${icon('menu', { size: 22 })}
        </button>
      </div>
    </div>
  </header>`
}

export function footer() {
  return `
  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        ${brand()}
        <p>インディーゲームに、居場所を。<br />作者の想いを、プレイヤーへ届ける場所。</p>
      </div>
      <div class="footer-links">
        <div class="footer-col">
          <h3>探す</h3>
          <a href="#/games">すべてのゲーム</a>
          <a href="#/games?sort=new">新着ゲーム</a>
          <a href="#/games?sort=popular">人気ゲーム</a>
        </div>
        <div class="footer-col">
          <h3>ジャンル</h3>
          <a href="#/games?genre=action">アクション</a>
          <a href="#/games?genre=puzzle">パズル</a>
          <a href="#/games?genre=rpg">RPG</a>
          <a href="#/games?genre=story">ビジュアルノベル</a>
        </div>
        <div class="footer-col">
          <h3>INDIEPORT について</h3>
          <span class="footer-note">このサイトはUIデモです</span>
          <span class="footer-note">投稿・購入・ログインは未実装</span>
        </div>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© 2026 INDIEPORT</span>
      <span>Made for indie creators, everywhere.</span>
    </div>
  </footer>`
}

export function badge(text, tone = 'accent') {
  return `<span class="badge badge--${tone}">${escapeHtml(text)}</span>`
}

export function gameCard(game) {
  const badges = [
    game.isNew ? badge('NEW', 'pink') : '',
    game.trending ? badge('人気', 'violet') : '',
    game.featured ? badge('注目', 'gold') : '',
  ]
    .filter(Boolean)
    .slice(0, 2)
    .join('')

  return `
  <a class="game-card" href="#/game/${encodeURIComponent(game.id)}" aria-label="${escapeHtml(game.title)}の詳細を見る">
    <div class="card-media">
      <img src="${coverFor(game)}" alt="${escapeHtml(game.title)}のカバーアート" width="640" height="400" loading="lazy" />
      ${badges ? `<div class="card-badges">${badges}</div>` : ''}
      <span class="card-hover-label">${icon('arrowUpRight', { size: 18 })} 詳細を見る</span>
    </div>
    <div class="card-body">
      <span class="card-genre">${escapeHtml(getGenreLabel(game.genre))}</span>
      <h3 class="card-title">${escapeHtml(game.title)}</h3>
      <p class="card-tagline">${escapeHtml(game.tagline)}</p>
      <div class="card-author">${icon('user', { size: 14 })} ${escapeHtml(game.author)}</div>
      <div class="card-footer">
        <span class="card-stat" title="評価">${icon('star', { size: 14 })} ${game.rating.toFixed(1)}</span>
        <span class="card-stat" title="ダウンロード数">${icon('download', { size: 14 })} ${formatNumber(game.downloads)}</span>
        <span class="card-price${game.price === 0 ? ' is-free' : ''}">${formatPrice(game.price)}</span>
      </div>
    </div>
  </a>`
}

export function sectionHead({ eyebrow = '', title, subtitle = '', href = '', linkLabel = 'すべて見る' }) {
  return `
  <div class="section-head">
    <div class="section-head-text">
      ${eyebrow ? `<span class="eyebrow">${escapeHtml(eyebrow)}</span>` : ''}
      <h2 class="section-title">${escapeHtml(title)}</h2>
      ${subtitle ? `<p class="section-subtitle">${escapeHtml(subtitle)}</p>` : ''}
    </div>
    ${href ? `<a class="section-link" href="${href}">${escapeHtml(linkLabel)} ${icon('arrowRight', { size: 17 })}</a>` : ''}
  </div>`
}

export function starRating(value, count) {
  const full = Math.round(value)
  const stars = Array.from({ length: 5 }, (_, i) =>
    i < full
      ? icon('star', { size: 18, className: 'star--filled' })
      : icon('star', { size: 18, className: 'star--empty' }),
  ).join('')
  return `
  <div class="star-rating" aria-label="5点満点中${value}点">
    <span class="star-icons">${stars}</span>
    <strong>${value.toFixed(1)}</strong>
    <span class="rating-count">(${count}件の評価)</span>
  </div>`
}

export function breadcrumb(items) {
  return `
  <nav class="breadcrumb" aria-label="パンくずリスト">
    ${items
      .map((item, index) =>
        item.href
          ? `<a href="${item.href}">${escapeHtml(item.label)}</a>`
          : `<span aria-current="page">${escapeHtml(item.label)}</span>`,
      )
      .join(`<span class="breadcrumb-sep">${icon('chevronRight', { size: 14 })}</span>`)}
  </nav>`
}

export function toastContainer() {
  return '<div class="toast-container" id="toast-container" role="status" aria-live="polite"></div>'
}
