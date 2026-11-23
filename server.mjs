import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeManifest } from './scripts/games.mjs'

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)))
const baseDir = resolve(projectRoot, process.argv[2] ?? '.')
const port = Number(process.env.PORT) || 5173

// 起動時に games/ を走査して一覧を最新にする
await writeManifest()

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.wasm': 'application/wasm',
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
    let pathname = decodeURIComponent(url.pathname)
    if (pathname === '/') pathname = '/index.html'

    // ローカル確認中に games/ へフォルダを追加してもリロードで反映されるようにする
    if (pathname === '/games.json' && baseDir === projectRoot) {
      await writeManifest()
    }

    const filePath = resolve(baseDir, `.${normalize(pathname)}`)
    if (filePath !== baseDir && !filePath.startsWith(baseDir + sep)) {
      res.writeHead(403).end('Forbidden')
      return
    }

    const info = await stat(filePath).catch(() => null)
    if (!info?.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found')
      return
    }

    const body = await readFile(filePath)
    res.writeHead(200, {
      'Content-Type': MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    })
    res.end(body)
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end(String(error))
  }
}).listen(port, () => {
  console.log(`http://localhost:${port}/  (${baseDir})`)
})
