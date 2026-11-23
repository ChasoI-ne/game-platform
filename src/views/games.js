import { games, genres, getGenreLabel } from '../data/games.js'
import { icon } from '../icons.js'
import { breadcrumb, escapeHtml, gameCard } from '../components.js'

const sortOptions = [
  { id: 'popular', label: '人気順' },
  { id: 'new', label: '新着順' },
  { id: 'rating', label: '評価順' },
]

const defaultState = { q: '', genre: 'all', sort: 'popular' }

function readState(query) {
  const genre = query.get('genre') ?? defaultState.genre
  const sort = query.get('sort') ?? defaultState.sort
  return {
    q: query.get('q') ?? defaultState.q,
    genre: genres.some((item) => item.id === genre) ? genre : defaultState.genre,
    sort: sortOptions.some((item) => item.id === sort) ? sort : defaultState.sort,
  }
}

function matchesQuery(game, query) {
  if (!query) return true
  const haystack = [
    game.title,
    game.tagline,
    game.author,
    game.handle,
    game.description,
    getGenreLabel(game.genre),
    ...game.tags,
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(query.toLowerCase())
}

function filteredGames(state) {
  const result = games.filter(
    (game) =>
      (state.genre === 'all' || game.genre === state.genre) && matchesQuery(game, state.q),
  )

  if (state.sort === 'new') {
    result.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
  } else if (state.sort === 'rating') {
    result.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
  } else {
    result.sort((a, b) => b.downloads - a.downloads)
  }
  return result
}

export function renderGames(route) {
  const state = readState(route.query)

  const html = `
  <div class="page page--games">
    <div class="page-head">
      <div class="container">
        ${breadcrumb([{ label: 'ホーム', href: '#/' }, { label: 'ゲームを探す' }])}
        <span class="eyebrow">DISCOVER</span>
        <h1 class="page-title">ゲームを探す</h1>
        <p class="page-lead">あなたの次のお気に入りが、ここに。<br class="only-desktop" />タイトルやジャンルから、自由に作品を探せます。</p>
      </div>
    </div>

    <div class="container games-content">
      <form class="search-hero" id="games-search-form" role="search">
        ${icon('search', { size: 22 })}
        <label class="sr-only" for="games-search">ゲームを検索</label>
        <input id="games-search" type="search" name="q" value="${escapeHtml(state.q)}" placeholder="タイトル、作者、タグで検索..." autocomplete="off" />
        <button class="btn btn--primary" type="submit">検索</button>
      </form>

      <div class="genre-filters" id="genre-filters" role="group" aria-label="ジャンルで絞り込む">
        ${genres
          .map(
            (genre) => `
          <button class="chip${state.genre === genre.id ? ' is-active' : ''}" type="button" data-genre="${genre.id}" aria-pressed="${state.genre === genre.id}">
            ${icon(genre.icon, { size: 16 })}<span>${genre.label}</span>
          </button>`,
          )
          .join('')}
      </div>

      <div class="results-bar">
        <p class="result-count" id="result-count"></p>
        <div class="sort-tabs" id="sort-tabs" role="group" aria-label="並び替え">
          ${sortOptions
            .map(
              (option) => `
            <button class="sort-tab${state.sort === option.id ? ' is-active' : ''}" type="button" data-sort="${option.id}" aria-pressed="${state.sort === option.id}">${option.label}</button>`,
            )
            .join('')}
        </div>
      </div>

      <div class="game-grid" id="games-grid"></div>

      <div class="empty-state" id="games-empty" hidden>
        <span class="empty-icon">${icon('search', { size: 30 })}</span>
        <h2>ゲームが見つかりませんでした</h2>
        <p>キーワードやジャンルを変えて、もう一度探してみてください。</p>
        <button class="btn btn--primary" type="button" id="reset-filters">条件をリセット</button>
      </div>
    </div>
  </div>`

  function init() {
    const grid = document.querySelector('#games-grid')
    const empty = document.querySelector('#games-empty')
    const count = document.querySelector('#result-count')
    const searchInput = document.querySelector('#games-search')
    const searchForm = document.querySelector('#games-search-form')
    const genreFilters = document.querySelector('#genre-filters')
    const sortTabs = document.querySelector('#sort-tabs')
    const resetButton = document.querySelector('#reset-filters')

    const syncUrl = () => {
      const params = new URLSearchParams()
      if (state.q) params.set('q', state.q)
      if (state.genre !== defaultState.genre) params.set('genre', state.genre)
      if (state.sort !== defaultState.sort) params.set('sort', state.sort)
      const query = params.toString()
      history.replaceState(null, '', `#/games${query ? `?${query}` : ''}`)
    }

    const draw = () => {
      const result = filteredGames(state)
      grid.innerHTML = result.map(gameCard).join('')
      grid.hidden = result.length === 0
      empty.hidden = result.length > 0
      count.innerHTML = `<strong>${result.length}</strong> 件のゲーム${
        state.q ? ` <span>／ 「${escapeHtml(state.q)}」の検索結果</span>` : ''
      }${state.genre !== 'all' ? ` <span>／ ${escapeHtml(getGenreLabel(state.genre))}</span>` : ''}`

      genreFilters.querySelectorAll('[data-genre]').forEach((button) => {
        const active = button.dataset.genre === state.genre
        button.classList.toggle('is-active', active)
        button.setAttribute('aria-pressed', String(active))
      })
      sortTabs.querySelectorAll('[data-sort]').forEach((button) => {
        const active = button.dataset.sort === state.sort
        button.classList.toggle('is-active', active)
        button.setAttribute('aria-pressed', String(active))
      })
    }

    searchForm.addEventListener('submit', (event) => {
      event.preventDefault()
      state.q = searchInput.value.trim()
      syncUrl()
      draw()
      searchInput.focus()
    })

    searchInput.addEventListener('input', () => {
      state.q = searchInput.value.trim()
      syncUrl()
      draw()
    })

    genreFilters.addEventListener('click', (event) => {
      const button = event.target.closest('[data-genre]')
      if (!button) return
      state.genre = button.dataset.genre
      syncUrl()
      draw()
    })

    sortTabs.addEventListener('click', (event) => {
      const button = event.target.closest('[data-sort]')
      if (!button) return
      state.sort = button.dataset.sort
      syncUrl()
      draw()
    })

    resetButton.addEventListener('click', () => {
      state.q = ''
      state.genre = defaultState.genre
      state.sort = defaultState.sort
      searchInput.value = ''
      syncUrl()
      draw()
      searchInput.focus()
    })

    draw()
  }

  return { html, init }
}
