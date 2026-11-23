import { access, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
export const gamesDir = join(root, 'games')
export const distDir = join(root, 'dist')

const THUMBNAILS = [
  'thumbnail.png',
  'thumbnail.jpg',
  'thumbnail.jpeg',
  'thumbnail.webp',
  'thumbnail.svg',
  'cover.png',
  'cover.jpg',
  'cover.jpeg',
  'cover.webp',
]

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

// games/ 直下のフォルダのうち、index.html を持つものをゲームとして扱う。
export async function collectGames() {
  let entries
  try {
    entries = await readdir(gamesDir, { withFileTypes: true })
  } catch {
    return []
  }

  const games = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue

    const dir = join(gamesDir, entry.name)
    if (!(await exists(join(dir, 'index.html')))) continue

    let thumbnail = null
    for (const file of THUMBNAILS) {
      if (await exists(join(dir, file))) {
        thumbnail = `games/${encodeURIComponent(entry.name)}/${file}`
        break
      }
    }

    games.push({
      name: entry.name,
      url: `games/${encodeURIComponent(entry.name)}/index.html`,
      thumbnail,
    })
  }

  games.sort((a, b) => a.name.localeCompare(b.name, 'ja'))
  return games
}

export async function writeManifest(outFile = join(root, 'games.json')) {
  const games = await collectGames()
  const data = {
    generatedAt: new Date().toISOString(),
    games,
  }
  await writeFile(outFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  return games
}
