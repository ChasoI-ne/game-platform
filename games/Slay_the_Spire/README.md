# Slay the Spire — Web Edition

アイアンクラッドを操作する、ブラウザ版のデッキ構築ローグライクです。原作の主要システムを再実装しています。

## 起動方法

`index.html` をブラウザで開いてください（ビルド不要・外部依存なし）。

ローカルサーバーを使う場合:

```bat
cd Slay_the_Spire
python -m http.server 3000
```

ブラウザで `http://localhost:3000/` を開きます。

## 遊び方

- 毎ターンエネルギー3でカードを5枚引く。カードをクリックして使用し、攻撃は敵をクリックして対象を選ぶ。
- `Enter` でターン終了、`1`〜`9` でカード選択、`Esc` で選択解除。
- マップで道を選び、全3幕（各15階）を登り、最終ボスを倒せば勝利。
- 戦闘・エリート・野営・商店・宝箱・事件・ボスの各ノードを実装。
- カード36種、敵28種、遺物21種、ポーション12種、事件7種。
- 進行状況は「保存」ボタンで localStorage にセーブ可能。

## 自動テスト

```bat
node tests/smoke.js
```

ダメージ計算・遺物フック・ステータスカード・状態遷移・セーブ復元・3ランの応力テストを実行します。

## ファイル構成

```text
Slay_the_Spire/
├── index.html
├── README.md
├── css/style.css
├── js/
│   ├── data.js       ... カード・敵・遺物・ポーション・事件の定義
│   ├── ja.js         ... 日本語ローカライズ
│   ├── engine.js     ... ゲーム状態・マップ・戦闘ロジック
│   ├── ui.js         ... 描画・操作・ツールチップ
│   └── main.js       ... 起動処理
├── sprites/
│   ├── items/        ... アイテム定義JSON（id/name/texture/description/category のリファレンス）
│   │   └── textures/ ... アイテム専用SVGアート（ゲームから直接参照）
│   ├── enemies/      ... 敵のSVGアート（第2幕以降の敵が直接参照）
│   └── ui/           ... UIアイコンのSVGアート（ゲームから直接参照）
├── tests/
│   └── smoke.js      ... 自動回帰テスト
└── tools/
    └── generate-assets.js ... アセット再生成スクリプト (`node tools/generate-assets.js`)

※ ゲームが実行時に読む定義は `js/data.js` + `js/ja.js` であり、`sprites/items/*.json` は
   同一内容をリファレンスとして出力したものです（生成スクリプトで同期します）。
```

すべてのビジュアルはオリジナルのベクターアート（SVG）で、絵文字は使用していません。
