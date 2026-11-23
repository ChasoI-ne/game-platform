import { cp, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import {
  collectGames,
  gamesDir,
  distDir,
  root,
  writeManifest,
} from './games.mjs'

const games = await collectGames()

await rm(distDir, { recursive: true, force: true })
await mkdir(distDir, { recursive: true })

await cp(join(root, 'index.html'), join(distDir, 'index.html'))
await cp(join(root, 'assets'), join(distDir, 'assets'), { recursive: true })
await writeManifest(join(distDir, 'games.json'))
await writeManifest(join(root, 'games.json'))

try {
  await cp(gamesDir, join(distDir, 'games'), { recursive: true })
} catch {
  // games/ が無い場合は一覧が空のまま配信する
}

console.log(`dist/ に書き出しました (${games.length} 件)`)
