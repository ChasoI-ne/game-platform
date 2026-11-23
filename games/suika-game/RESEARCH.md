# スイカゲーム リサーチメモ

調査日: 2026-11-23 / 対象: Nintendo Switch版『スイカゲーム』（Aladdin X）および主要ブラウザ版
目的: 再現（RECREATE）のための仕様確定。各項目は実装に影響する独立事実として count し、重複表現は1件として扱わない。

## 調査結果一覧（16件 / 出典8以上）

| # | 事実 | 出典URL | 確度 | 実装への反映 |
|---|---|---|---|---|
| 1 | フルーツは11段階。進化順は さくらんぼ→いちご→ぶどう→デコポン→かき→りんご→なし→もも→パイナップル→メロン→スイカ | https://ja.wikipedia.org/wiki/スイカゲーム , https://www.nintendo.com/jp/topics/article/e9d2815a-23be-4dab-9264-1b959470e4fb , https://fily.co.jp/diary/suikagame-beginners-guide/ | 確認済み | `FRUITS` を11段階で定義。進化は `tier+1`。 |
| 2 | 同じ種類のフルーツ同士が触れると次の段階に合体（シンカ）する | https://suikagame.jp/ , https://note.com/rimo_ton/n/nebeb17abb01b , https://tech-blog.abeja.asia/entry/suikagame-rla-20240819 | 確認済み | 衝突時に同 tier なら合体キューへ。 |
| 3 | 落下するのは最初の5種類（さくらんぼ〜かき/ミカン）のみ。残り6種は合体で生成する | https://ja.wikipedia.org/wiki/スイカゲーム , https://suika.games/ja/how-to-play , https://www.senilog.com/5791/ | 確認済み | `MAX_DROP_TIER = 4`、出現は5種から一様ランダム。 |
| 4 | 箱からフルーツが溢れる（上部ラインを超える）とゲームオーバー | https://note.com/rimo_ton/n/nebeb17abb01b , https://suika.co , https://soft.takinoko.net/softapp/suika/index.html | 確認済み | `DEAD_LINE_Y` を設け、超過でゲームオーバー |
| 5 | ライン超過は即終了ではなく猶予がある。ブラウザ版では約1.0〜3.0秒（実装例: 1.5秒/2秒/3秒） | https://suika.games/ja/how-to-play , https://hinata-ya.tech/games/en/games/suika/source/ , https://github.com/itsakeyfut/suika-game , https://soft.takinoko.net/softapp/suika/index.html | 確認済み | `DANGER_LIMIT = 1.8秒`、落下直後1.2秒は判定除外。 |
| 6 | 合成時スコア（Switch版）: 0/1/3/6/10/15/21/28/36/45/55（さくらんぼ→スイカの順） | https://altema.jp/suikagame/rule , https://niwaka-games.com/2026/10/14/26845/ , https://fily.co.jp/diary/suikagame-beginners-guide/ | 確認済み | 新しい果物の `score` を加算。 |
| 7 | スイカ同士が合体すると消滅し高得点（66点）・演出付き。ゲームは続行 | https://ja.wikipedia.org/wiki/スイカゲーム , https://fily.co.jp/diary/suikagame-beginners-guide/ , https://suikagame.gg/faq | 確認済み | 双スイカで2体を除去し +66点、専用演出。 |
| 8 | いちごやぶどうを含む全フルーツの当たり判定は円形 | https://fily.co.jp/diary/suikagame-beginners-guide/ , https://news.denfaminicogamer.jp/kikakuthetower/231031f , https://gametamashii.com/suikagame-5/ | 確認済み | 全果物を円形剛体として扱う。 |
| 9 | 合体後のフルーツは2つの果物の「中心」に生成される | https://fily.co.jp/diary/suikagame-beginners-guide/ , https://news.denfaminicogamer.jp/kikakuthetower/231031f , https://gist.github.com/gigun-dev/88385c470b6df5f00c7de796605d4e60 | 確認済み | マージ座標 = 両者の中点。速度は運動量平均。 |
| 10 | 果物が育つほど密度が下がり、小さい果物ほど大きい果物を押し動かしやすい（プレイヤー間の共通認識・公式明示なし） | https://news.denfaminicogamer.jp/kikakuthetower/231031f , https://fily.co.jp/diary/suikagame-beginners-guide/ | 推測 | 密度を tier に応じて低減（mass ∝ r² / (1+0.12*tier)）。 |
| 11 | 操作はマウス移動＋クリック、矢印/A/D＋スペース、タッチのドラッグ＆リリース | https://suika.games/ja/controls-guide , https://github.com/itsakeyfut/suika-game , https://hinata-ya.tech/games/en/games/suika/source/ | 確認済み | マウス・タッチ・キーボードの3系統を実装。 |
| 12 | 落下後は再投下まで短いクールダウン（実装例 400〜500ms）があり、ネクスト表示がある | https://hinata-ya.tech/games/en/games/suika/source/ , https://gist.github.com/gigun-dev/88385c470b6df5f00c7de796605d4e60 , https://news.denfaminicogamer.jp/kikakuthetower/231031f | 確認済み | `DROP_COOLDOWN = 420ms`、ネクスト表示を実装。 |
| 13 | 時間制限はなく、ライン超過のみで終了する | https://playsuikagame.org/suika-game-tips , https://suikagame.fun/blog/what-is-suika-game | 確認済み | タイマーなし。 |
| 14 | 基本戦略は「大きい果物を片側、小さい果物を反対側に分ける」 | https://suikagame.fun/blog/what-is-suika-game , https://news.denfaminicogamer.jp/kikakuthetower/231031f | 確認済み | タイトル画面の遊び方に反映。 |
| 15 | 連続合成（コンボ）でボーナスが入るブラウザ版がある（5秒以内・最大+5など仕様は版により不同） | https://suikagame.fun/wiki/scoring , https://github.com/itsakeyfut/suika-game | 一部確認 | 1.6秒以内の連続合成に +1〜+5 の控えめなボーナス。 |
| 16 | ブラウザ版によってはスイカが最終段で、2個合体しても消えず並ぶ（公式と差別化） | https://suikagame.gg/faq | 確認済み | 本実装は公式仕様（消滅＋66点）を採用し、選択しない旨を記録。 |

## 確認できたコアの快感（本家越えの基準）
1. 同じ果物が当たった瞬間に「次の果物へ変わる」視覚・音の気持ちよさ
2. 連鎖合成が起きたときの高得点と一気に盤面が整理される感覚
3. ギリギリでラインを割らずに耐える緊張と回避
4. 大きい果物（デカ玉）を端に固定して育てる配置の駆け引き
5. ダブルスイカという到達目標

## 本家の弱点と改善軸（最大5つ）
- Switch版はブラウザ/Pc/タッチで遊べない → **改善1: ブラウザ＋タッチ対応・即リトライ**
- 初心者は進化順とスコアを把握しづらい → **改善2: 進化チェーン表示＋ネクストプレビュー**
- マージの瞬間のフィードバックが控えめ → **改善3: パーティクル・スコア演出・画面揺れ（強度off可）**
- ライン超過の理由が分かりにくい → **改善4: 危険ラインの点滅と警告表示**
- 音・揺れの調整手段が限られる → **改善5: 音量・ミュート・揺れoff設定とフォーカス喪失時の自動ポーズ**

## 設計反映（確定値）
- 論理キャンバス 460×640、壁 16px、デッドライン y=104、保持位置 y=52
- 半径: 15/20/26/32/39/47/56/66/77/89/102
- 重力 1900px/s²、反発 0.12、摩擦 0.30、サブステップ 1/120s
- 出現5種一様、ドロップクールダウン 420ms、超過猶予 1.8s
- スコア 0/1/3/6/10/15/21/28/36/45/55、ダブルスイカ +66、コンボ +1〜+5
