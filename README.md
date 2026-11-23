# game-platform

Vite を使わない、Cloudflare Pages 向けの静的ゲーム一覧サイトです。

## 構成

```
index.html          一覧ページ（games.json を読み込んで表示）
games.json          生成されるゲーム一覧（コミットしても OK）
games/
  <game-folder>/
    index.html      ゲーム本体
    thumbnail.png   任意のサムネイル（無ければフォルダ名の頭文字を表示）
scripts/            games/ を走査して games.json を作る処理
server.mjs          ローカル確認用の Node 標準サーバー（Vite 不要）
dist/               build 出力（Cloudflare Pages の出力ディレクトリ）
```

`games/` 直下のフォルダのうち **`index.html` を持つもの** だけが一覧に出ます。
`.` と `_` で始まるフォルダは無視されます。サムネイルは `thumbnail.*` / `cover.*` を自動で探します。

## ローカルで確認

```bash
npm run dev
```

`http://localhost:5173/` を開くと一覧が表示されます。ローカルサーバーは `games.json` のリクエスト時に
`games/` を走査し直すので、ゲームフォルダを追加したらリロードするだけで反映されます。

一覧だけ作り直す場合:

```bash
npm run generate
```

## Cloudflare Pages

- **Build command:** `npm run build`
- **Build output directory:** `dist`

`build` は `games/` を走査して `games.json` を生成し、`index.html`・`games.json`・`games/` を
`dist/` にコピーします。バンドルやトランスパイルは無く、Cloudflare は静的ファイルを配信するだけです。

> 注意: 静的ホスティングなので、`games/` にフォルダを追加したら **再ビルド（再デプロイ）が必要** です。
> デプロイせずに反映したい場合は Cloudflare Pages Functions + KV/R2 などの動的な仕組みに変更する必要があります。
