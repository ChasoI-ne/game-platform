import { games, formatDate, formatNumber, formatPrice, getGenreLabel } from '../data/games.js'
import { coverFor, screenshotFor } from '../cover.js'
import { icon } from '../icons.js'
import { badge, breadcrumb, escapeHtml, gameCard, sectionHead, starRating } from '../components.js'

function relatedGames(game) {
  const sameGenre = games.filter((item) => item.id !== game.id && item.genre === game.genre)
  const popularOthers = games
    .filter((item) => item.id !== game.id && item.genre !== game.genre)
    .sort((a, b) => b.downloads - a.downloads)
  return [...sameGenre, ...popularOthers].slice(0, 4)
}

function infoRow(label, value, iconName) {
  return `
  <div class="info-row">
    <span class="info-label">${icon(iconName, { size: 16 })} ${label}</span>
    <span class="info-value">${value}</span>
  </div>`
}

export function renderDetail(game) {
  const related = relatedGames(game)
  const initial = game.author.slice(0, 2).toUpperCase()
  const playHours = game.playMinutes >= 60 ? `${Math.round(game.playMinutes / 60)}時間前後` : `${game.playMinutes}分前後`

  const heroBadges = [
    game.isNew ? badge('NEW', 'pink') : '',
    game.featured ? badge('注目', 'gold') : '',
    game.trending ? badge('人気', 'violet') : '',
  ]
    .filter(Boolean)
    .join('')

  return `
  <div class="page page--detail">
    <div class="container">
      ${breadcrumb([
        { label: 'ホーム', href: '#/' },
        { label: 'ゲームを探す', href: '#/games' },
        { label: game.title },
      ])}
    </div>

    <section class="detail-hero">
      <div class="detail-hero-glow" aria-hidden="true" style="--game-accent: ${game.accent}"></div>
      <div class="container detail-hero-inner">
        <div class="detail-cover">
          <img src="${coverFor(game, 'wide')}" alt="${escapeHtml(game.title)}のカバーアート" width="960" height="540" />
          <div class="detail-cover-shine" aria-hidden="true"></div>
        </div>

        <div class="detail-hero-content">
          <div class="detail-badges">${heroBadges}</div>
          <span class="detail-genre">${escapeHtml(getGenreLabel(game.genre))}</span>
          <h1 class="detail-title">${escapeHtml(game.title)}</h1>
          <p class="detail-tagline">${escapeHtml(game.tagline)}</p>

          <div class="detail-author">
            <span class="author-avatar">${escapeHtml(initial)}</span>
            <span class="author-text">
              <strong>${escapeHtml(game.author)}</strong>
              <small>${escapeHtml(game.handle)}</small>
            </span>
          </div>

          <div class="detail-tags">
            ${game.tags.map((tag) => `<span class="tag">${icon('tag', { size: 13 })} ${escapeHtml(tag)}</span>`).join('')}
          </div>

          <div class="detail-actions">
            <button class="btn btn--primary btn--lg" type="button" data-dummy="ゲームの起動">${icon('play', { size: 18 })} 今すぐ遊ぶ</button>
            <button class="btn btn--outline btn--lg" type="button" data-dummy="ダウンロード">${icon('download', { size: 18 })} ダウンロード</button>
            <button class="btn btn--square btn--outline" type="button" aria-label="お気に入りに追加" data-dummy="お気に入り機能">${icon('heart', { size: 19 })}</button>
            <button class="btn btn--square btn--outline" type="button" aria-label="この作品を共有" data-dummy="共有機能">${icon('share', { size: 19 })}</button>
          </div>
          <p class="detail-disclaimer">${icon('info', { size: 15 })} プレイ・ダウンロード機能はまだ実装されていません</p>
        </div>
      </div>
    </section>

    <div class="container detail-layout">
      <div class="detail-main">
        <section class="panel">
          <div class="panel-heading">
            <span class="panel-icon">${icon('book', { size: 19 })}</span>
            <h2>このゲームについて</h2>
          </div>
          <p class="about-lead">${escapeHtml(game.description)}</p>
          <p class="about-text">${escapeHtml(game.about)}</p>
        </section>

        <section class="panel">
          <div class="panel-heading">
            <span class="panel-icon">${icon('image', { size: 19 })}</span>
            <h2>スクリーンショット</h2>
          </div>
          <div class="screenshot-grid">
            ${[0, 1, 2]
              .map(
                (index) => `
              <button class="screenshot" type="button" data-dummy="スクリーンショットの拡大表示" aria-label="スクリーンショット ${index + 1} を拡大">
                <img src="${screenshotFor(game, index)}" alt="${escapeHtml(game.title)}のスクリーンショット ${index + 1}" width="640" height="400" loading="lazy" />
              </button>`,
              )
              .join('')}
          </div>
        </section>

        <section class="panel">
          <div class="panel-heading">
            <span class="panel-icon">${icon('sparkles', { size: 19 })}</span>
            <h2>この作品の特徴</h2>
          </div>
          <ul class="feature-list">
            ${game.features.map((feature) => `<li>${icon('check', { size: 17 })} <span>${escapeHtml(feature)}</span></li>`).join('')}
          </ul>
        </section>
      </div>

      <aside class="detail-side">
        <section class="panel side-panel side-panel--price">
          <span class="side-label">価格</span>
          <strong class="side-price${game.price === 0 ? ' is-free' : ''}">${formatPrice(game.price)}</strong>
          <button class="btn btn--primary btn--block" type="button" data-dummy="購入機能">${icon('heart', { size: 17 })} この作品を応援する</button>
          <p class="side-note">購入機能はまだ実装されていません</p>
        </section>

        <section class="panel side-panel">
          <div class="panel-heading panel-heading--small">
            <span class="panel-icon">${icon('info', { size: 18 })}</span>
            <h2>ゲーム情報</h2>
          </div>
          <div class="info-list">
            ${infoRow('ジャンル', escapeHtml(getGenreLabel(game.genre)), 'grid')}
            ${infoRow('発売日', formatDate(game.releaseDate), 'calendar')}
            ${infoRow('プレイ時間', playHours, 'clock')}
            ${infoRow('ダウンロード', formatNumber(game.downloads), 'download')}
            ${infoRow('対応OS', game.platforms.map(escapeHtml).join(' / '), 'monitor')}
          </div>
        </section>

        <section class="panel side-panel">
          <div class="panel-heading panel-heading--small">
            <span class="panel-icon">${icon('star', { size: 18 })}</span>
            <h2>評価</h2>
          </div>
          ${starRating(game.rating, game.reviewCount)}
        </section>
      </aside>
    </div>

    <section class="section related-section">
      <div class="container">
        ${sectionHead({
          eyebrow: 'YOU MAY ALSO LIKE',
          title: 'こちらもおすすめ',
          subtitle: 'この作品を気に入ったら、こちらもどうぞ。',
          href: '#/games',
          linkLabel: 'もっと探す',
        })}
        <div class="game-grid">${related.map(gameCard).join('')}</div>
      </div>
    </section>
  </div>`
}

export function renderNotFound() {
  return `
  <div class="page page--notfound">
    <div class="container notfound">
      <span class="notfound-code">404</span>
      <h1>ページが見つかりませんでした</h1>
      <p>お探しのゲームは存在しないか、URLが間違っているかもしれません。</p>
      <a class="btn btn--primary btn--lg" href="#/games">${icon('grid', { size: 18 })} ゲーム一覧へ戻る</a>
    </div>
  </div>`
}
