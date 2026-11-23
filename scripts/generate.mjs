import { writeManifest } from './games.mjs'

const games = await writeManifest()
console.log(`games.json を生成しました (${games.length} 件)`)
