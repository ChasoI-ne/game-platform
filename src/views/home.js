import { games, genres, formatNumber, getGenreLabel } from '../data/games.js'
import { coverFor } from '../cover.js'
import { icon } from '../icons.js'
import { escapeHtml, gameCard, sectionHead } from '../components.js'

const byPopularity = [...games].sort((a, b) => b.downloads - a.downloads)
const byRelease = [...games].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
const featured = games.filter((game) => game.featured)
const recent = games.filter((game) => game.isNew).length
  ? games.filter((game) => game.isNew)
  : byRelease.slice(0, 4)

const totalDownloads = games.reduce((sum, game) => sum + game.downloads, 0)

function statRow() {
  const items = [
    { value: String(games.length), label: '掲載作品' },
    { value: String(genres.length - 1), label: 'ジャンル' },
    { value: formatNumber(totalDownloads), label: '累計ダウンロード' },
  ]
  return `
  <div class="hero-stats">
    ${items
      .map(
        (item) => `
      <div class="hero-stat">
        <strong>${item.value}</strong>
        <span>${item.label}</span>
      </div>`,
      )
      .join('')}
  </div>`
}

function hero() {
  const game = games.find((item) => item.id === 'hoshikuzu-requiem') ?? games[0]
  return `
  <section class="hero">
    <div class="hero-backdrop" aria-hidden="true">
      <img src="${coverFor(game, 'wide')}" alt="" />
    </div>
    <div class="hero-grain" aria-hidden="true"></div>
    <div class="container hero-inner">
      <div class="hero-copy">
        <span class="hero-kicker">${icon('sparkles', { size: 15 })} 今週の注目作品</span>
        <h1 class="hero-title">${escapeHtml(game.title)}</h1>
        <p class="hero-tagline">${escapeHtml(game.tagline)}</p>
        <p class="hero-description">${escapeHtml(game.description)}</p>
        <div class="hero-meta">
          <span class="hero-meta-rating">${icon('star', { size: 16 })} <strong>${game.rating.toFixed(1)}</strong></span>
          <span class="hero-meta-dot"></span>
          <span>${escapeHtml(getGenreLabel(game.genre))}</span>
          <span class="hero-meta-dot"></span>
          <span>${escapeHtml(game.author)}</span>
        </div>
        <div class="hero-actions">
          <a class="btn btn--primary btn--lg" href="#/game/${game.id}">${icon('play', { size: 18 })} 作品を見る</a>
          <a class="btn btn--glass btn--lg" href="#/games">${icon('grid', { size: 18 })} すべてのゲーム</a>
        </div>
      </div>
      <a class="hero-poster" href="#/game/${game.id}" aria-label="${escapeHtml(game.title)}の詳細を見る">
        <div class="hero-poster-glow" aria-hidden="true"></div>
        <img src="${coverFor(game)}" alt="${escapeHtml(game.title)}のカバーアート" width="640" height="400" />
        <div class="hero-poster-caption">
          <span>FEATURED</span>
          <strong>${escapeHtml(game.title)}</strong>
        </div>
      </a>
    </div>
    <div class="container">${statRow()}</div>
  </section>`
}

function genreSection() {
  return `
  <section class="section section--genres">
    <div class="container">
      ${sectionHead({
        eyebrow: 'BROWSE BY GENRE',
        title: 'ジャンルから探す',
        subtitle: '今の気分にぴったりの一本がきっと見つかる。',
        href: '#/games',
        linkLabel: 'すべてのゲーム',
      })}
      <div class="genre-grid">
        ${genres
          .filter((genre) => genre.id !== 'all')
          .map(
            (genre) => `
          <a class="genre-tile" href="#/games?genre=${genre.id}">
            <span class="genre-tile-icon">${icon(genre.icon, { size: 22 })}</span>
            <span class="genre-tile-label">${genre.label}</span>
            <span class="genre-tile-count">${games.filter((game) => game.genre === genre.id).length} 作品 ${icon('arrowUpRight', { size: 14 })}</span>
          </a>`,
          )
          .join('')}
      </div>
    </div>
  </section>`
}

export function renderHome() {
  return `
  <div class="page page--home">
    ${hero()}

    <section class="section">
      <div class="container">
        ${sectionHead({
          eyebrow: 'EDITOR’S PICKS',
          title: '注目のゲーム',
          subtitle: 'スタッフが真心を込めて選んだ、今見てほしい作品。',
          href: '#/games?sort=popular',
        })}
        <div class="game-grid">${featured.map(gameCard).join('')}</div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
        ${sectionHead({
          eyebrow: 'FRESH RELEASES',
          title: '新着ゲーム',
          subtitle: '届きたての、フレッシュな作品たち。',
          href: '#/games?sort=new',
          linkLabel: '新着をすべて見る',
        })}
        <div class="game-grid">${recent.slice(0, 4).map(gameCard).join('')}</div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        ${sectionHead({
          eyebrow: 'MOST PLAYED',
          title: '人気ゲーム',
          subtitle: 'たくさんのプレイヤーに遊ばれている作品。',
          href: '#/games?sort=popular',
          linkLabel: '人気をすべて見る',
        })}
        <div class="game-grid">${byPopularity.slice(0, 4).map(gameCard).join('')}</div>
      </div>
    </section>

    ${genreSection()}

    <section class="creator-section">
      <div class="container">
        <div class="creator-panel">
          <div class="creator-panel-glow" aria-hidden="true"></div>
          <div class="creator-copy">
            <span class="eyebrow">FOR CREATORS</span>
            <h2>あなたの作品を、<br />世界に届けよう。</h2>
            <p>INDIEPORT は、インディーゲームの作者のための場所です。作品を公開し、プレイヤーと出会う未来を目指しています。</p>
          </div>
          <div class="creator-action">
            <button class="btn btn--light btn--lg" type="button" data-dummy="作品の投稿機能">${icon('plus', { size: 18 })} 作品を投稿する</button>
            <span class="creator-note">${icon('info', { size: 14 })} 投稿機能は現在未実装です</span>
          </div>
        </div>
      </div>
    </section>
  </div>`
}
