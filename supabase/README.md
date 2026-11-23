# INDIEPORT / Supabase セットアップ

このディレクトリは、既存のフロントエンド（`src/`）を変更せずに追加した Supabase 用 DB 定義です。

- Migration: `supabase/migrations/001_initial_schema.sql`
- 対象: Supabase Postgres（RLS / Auth / Storage を使用）
- 既存フロントエンドへの変更: **なし**

> **検証状態について**
> この SQL は 2026-11-23 に再レビューし、依存関係・権限・RLS・再実行時の挙動・初期データの一致を静的に確認しました。
> しかし **実際の Supabase プロジェクトに対して実行した検証はまだ行っていません**。
> 実行前に必ずステージング環境で確認してください。未検証項目は末尾にまとめています。

---

## 1. このマイグレーションで作られるもの

### テーブル

| テーブル | 役割 |
|---|---|
| `profiles` | ユーザー情報（`auth.users` と 1:1） |
| `genres` | ジャンルマスタ（UIの `all` は登録しない） |
| `tags` | タグマスタ |
| `platforms` | 対応OSマスタ |
| `games` | ゲーム情報 |
| `game_tags` | ゲーム↔タグ |
| `game_platforms` | ゲーム↔対応OS |
| `game_screenshots` | スクリーンショット（Storage パス） |
| `game_likes` | いいね／お気に入り |
| `comments` | コメント（返信可） |
| `reviews` | 評価（1〜5）とレビュー文 |
| `follows` | ユーザーフォロー |
| `collections` | コレクション（リスト本体） |
| `collection_items` | コレクション内のゲーム |

### 主な制約・仕組み

- `auth.users` への INSERT をトリガーに `public.profiles` を自動作成します。メタデータはサニタイズし、制約違反を起こさないようにしています。
- `games.search_text` は AFTER トリガーから `SECURITY DEFINER` 関数で再生成します（BEFORE トリガーは `author_id` / `published_at` のみを設定）。タグ変更時も再生成されます。
- コメントの `parent_id` は、返信先が同じ `game_id` に属することを BEFORE トリガーで保証します。
- `like_count` / `rating_avg` / `review_count` / `follower_count` / `following_count` はトリガーで集計します（UPDATE で対象 ID が変わった場合も両方を再計算）。
- `downloads` は `public.increment_game_downloads()`（service_role のみ）経由でのみ更新できます。
- `featured` / `trending` / `is_new` / `rating_avg` / `like_count` などは投稿者に UPDATE 権限がありません。
- 全テーブルで RLS を有効化し、anon / authenticated ごとにポリシーを分けています。
- Storage バケットと `storage.objects` の RLS も設定します。`game-assets` は作者なら下書きでも読み取れます。

### インデックス

一覧画面の検索・絞り込み・並び替えを高速化するインデックスも作られます（すべて `if not exists` 付き）。

| インデックス | 対象 |
|---|---|
| `games_published_release_idx` | 公開済みゲームの新着順 |
| `games_popular_idx` | 公開済みゲームの人気順 |
| `games_rating_idx` | 公開済みゲームの評価順 |
| `games_genre_idx` | ジャンル絞り込み |
| `games_author_idx` | 作者別一覧 |
| `games_search_trgm` | `search_text` の部分一致検索（GIN / pg_trgm） |
| `game_tags_tag_idx` | タグからゲームを逆引き |
| `comments_game_idx` / `comments_parent_idx` | ゲーム単位・返信元からのコメント取得 |
| `reviews_game_idx` / `game_likes_game_idx` | ゲーム単位の集計・一覧 |
| `follows_following_idx` | フォロワー一覧 |
| `collections_user_idx` / `collection_items_game_idx` | コレクション一覧・逆引き |

> `games_search_trgm` は `gin_trgm_ops` の存在するスキーマを実行時に検出して作成します。`pg_trgm` が既に別スキーマに入っていても動作します。

---

## 2. 実行手順

### 方法A: Supabase Dashboard（SQL Editor）

1. Supabase Dashboard を開き、対象プロジェクトを選択します。
2. 左メニューから **SQL Editor** を開きます。
3. `supabase/migrations/001_initial_schema.sql` の内容を貼り付けます。
4. **Run** を押します。

このファイルは `begin; ... commit;` で囲まれているため、途中でエラーが発生すると全体がロールバックされます。

### 方法B: Supabase CLI（ローカル開発）

```bash
# プロジェクトにリンク済みの場合
supabase link --project-ref <YOUR_PROJECT_REF>

# migration を適用
supabase db push

# または、ローカル DB をリセットして最初から適用
supabase db reset
```

> `supabase db reset` はローカル DB のデータを消去します。本番では実行しないでください。

---

## 3. 実行後の確認クエリ

SQL Editor で以下を実行してください。

```sql
-- RLS が有効か確認
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- テーブル一覧
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

-- ポリシー一覧
select c.relname as table_name, p.polname as policy_name
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'storage')
order by c.relname, p.polname;

-- インデックス
select indexname, tablename
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

-- 初期データ
select id, label, sort_order from public.genres order by sort_order;
select id from public.platforms order by id;
select count(*) as tag_count from public.tags;  -- 38 件

-- トリガー
select c.relname as table_name, t.tgname, t.tgenabled
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
where not t.tgisinternal
order by c.relname, t.tgname;

-- コメントの親子が別ゲームになっていないか（0 件が正常）
select c.id, c.game_id, p.game_id as parent_game_id
from public.comments c
join public.comments p on p.id = c.parent_id
where c.game_id <> p.game_id;

-- Storage バケット
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('avatars', 'game-covers', 'game-screenshots', 'game-assets')
order by id;
```

期待値の例:

- `rowsecurity = true` が全 public テーブルに付く
- `genres` は 9 件（`all` は含まない）
- `platforms` は 6 件
- `tags` は 38 件
- バケットは 4 件（`game-assets` のみ `public = false`）
- `game-assets` の `file_size_limit` は 52428800（50 MiB）、`allowed_mime_types` は後述のリスト

---

## 4. ユーザー登録と profiles 自動作成

1. Supabase Dashboard → **Authentication** → **Add user** でユーザーを作成します。
2. 作成後、以下を確認します。

```sql
select id, handle, display_name, created_at
from public.profiles
order by created_at desc
limit 5;
```

`handle` は以下の優先順位で生成されます。

1. `raw_user_meta_data -> 'handle'`
2. `raw_user_meta_data -> 'user_name'`
3. メールのローカル部分（`foo@example.com` → `foo`）
4. `user`

生成時の安全策:

- 小文字英数字と `_` 以外を除去し、3 文字未満なら `user` を前置き、24 文字以内に制限します（`^[a-z0-9_]{3,30}$` を満たします）。
- 重複時は末尾に連番を付けます。同時登録などで一意制約違反が起きた場合は、UUID 由来のハンドルで再試行します。
- `display_name` は `display_name` / `full_name` / `name` / メールローカル部分 / `Creator` の順に使用し、前後の空白を除去、最大 80 文字に切り詰めます。空文字になる場合は `Creator` を使います。
- `avatar_url` も前後の空白を除去し、空文字なら null にします。

> 未検証: OAuth プロバイダーによって `raw_user_meta_data` のキー名が異なる場合、想定した名前が入らないことがあります。必要なら `public.handle_new_user()` のキー変換を調整してください。

---

## 5. デモ用ゲームデータの投入（任意）

既存 `src/data/games.js` の16作品を投入する関数を用意していますが、**自動実行はしません**。
`auth.users` と `public.profiles` に実際のユーザーが存在する必要があるためです。

1. 作者にするユーザーの UUID を取得します。

```sql
select id, handle from public.profiles order by created_at desc limit 1;
```

2. デモデータを投入します。

```sql
select private.seed_demo_games('ここに作者のUUID');
```

3. 確認します。

```sql
select slug, title, author_id, status, like_count
from public.games
order by slug;

select count(*) from public.game_tags;        -- 48 件
select count(*) from public.game_platforms;   -- 作品ごとの対応OS数
```

この関数は `on conflict (slug) do nothing` なので、再実行しても重複しません。
既存レコードは上書きしません。

> デモデータの `rating_avg` / `review_count` / `downloads` / `featured` などは、既存フロントエンドの仮データと同じ初期値です。実際の `reviews` / `game_likes` は空なので、トリガーが後にこれらのカウンターを上書きする点に注意してください（仕様どおりの動作です）。

---

## 5.1 初期データが `src/data/games.js` と一致しているか

2026-11-23 に `src/data/games.js` と本 SQL の seed 記述を実際に読み直して比較しました（ファイル変更なし）。

| 項目 | `src/data/games.js` | SQL seed | 結果 |
|---|---|---|---|
| genres（`all` 除外） | 9 件 | 9 件 | ID・label・icon すべて一致 |
| platforms | 6 件（Windows / macOS / Linux / Web / iOS / Android） | 6 件 | 一致 |
| tags | 38 件 | 38 件 | 過不足なし |

> これは静的なファイル比較です。DB 実行後のレコード一致は未検証です。

---

## 6. Storage のパス規則とアクセス制御

| バケット | public | パス形式 | 読み取り | 書き込み |
|---|---|---|---|---|
| `avatars` | ✅ | `<user_uuid>/<file>` | 誰でも（public bucket） | 本人のみ |
| `game-covers` | ✅ | `<game_uuid>/<file>` | 誰でも（public bucket） | ゲーム作者のみ |
| `game-screenshots` | ✅ | `<game_uuid>/<file>` | 誰でも（public bucket） | ゲーム作者のみ |
| `game-assets` | ❌ | `<game_uuid>/<file>` | 作者は下書き含め常に可。他人は「公開済みかつ無料」のみ | ゲーム作者のみ |

`game-assets` は非公開バケットです。

- 作者は `status` に関係なく自分のゲームのファイルを読めます（下書きの確認に必要）。
- 無料ゲーム（`price = 0`）の公開済みファイルは anon でも SELECT 可能です。
- 有料ゲームのファイルは RLS では読めません。**service_role で署名付き URL を生成して配布する**必要があります（未実装）。
- public バケットは URL を知っていれば RLS に関係なくアクセスできます。機密ファイルは必ず `game-assets` に置いてください。

### アップロード制限と許可 MIME タイプ

| バケット | 1 ファイル上限 | 許可 MIME |
|---|---|---|
| `avatars` / `game-covers` / `game-screenshots` | 2 MiB | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |
| `game-assets` | 50 MiB | 下記のとおり |

`game-assets` の許可 MIME（HTML ゲーム投稿に必要な形式を含む）:

- ゲーム本体: `text/html`, `text/css`, `text/javascript`, `application/javascript`, `application/json`, `application/wasm`
- パッケージ: `application/zip`, `application/x-zip-compressed`
- 画像: `image/png`, `image/jpeg`, `image/webp`, `image/gif`, `image/svg+xml`
- 音声: `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/mp4`
- 動画: `video/mp4`, `video/webm`
- フォント: `font/woff`, `font/woff2`, `application/vnd.ms-fontobject`

> `allowed_mime_types` / `file_size_limit` はバージョン依存カラムなので、SQL 側で `information_schema` の存在確認を行ってから更新しています。
> 未検証: 実際の Supabase プロジェクトでこれらの MIME が期待どおり受け付けられるかは確認していません。クライアントが誤った MIME を送るケース（例: `.wasm` を `application/octet-stream` で送信）では拒否される可能性があります。

---

## 7. 投稿者が不正変更できないカラム

`authenticated` ロールの `games` に対する権限を列レベルで制限しています。

### 投稿者が変更できるカラム

`slug`, `title`, `tagline`, `description`, `about`, `features`, `art_style`, `palette`, `accent`, `cover_path`, `price`, `release_date`, `play_minutes`, `genre`, `status`

`status` を `published` にすると、BEFORE トリガーが `published_at` を設定します。

### 投稿者が変更できないカラム

`id`, `author_id`, `downloads`, `rating_avg`, `review_count`, `like_count`, `featured`, `trending`, `is_new`, `published_at`, `search_text`, `created_at`, `updated_at`

これらは service_role、または SECURITY DEFINER トリガー／RPC 経由でのみ更新されます。

具体例:

```sql
-- これは authenticated では失敗します（権限エラー）
update public.games set like_count = 999 where slug = 'void-runner';

-- ダウンロード数は信頼できるサーバー側からのみ更新
select public.increment_game_downloads('-game-uuid-'::uuid, 1);
```

`public.increment_game_downloads(uuid, integer)` は `service_role` にのみ EXECUTE を付与しています。**anon / authenticated からは呼び出せません。**

---

## 8. 再実行時の挙動とトリガー一覧

この migration は冪等性を考慮しています。

| 対象 | 再実行時の動作 |
|---|---|
| `create table if not exists` | 既存テーブルはそのまま利用 |
| `create or replace function` | 関数定義を更新 |
| `create index if not exists` | 既存インデックスはそのまま利用 |
| `drop trigger if exists` → `create trigger` | トリガーを作り直し |
| `drop policy if exists` → `create policy` | ポリシーを作り直し |
| `insert ... on conflict ...` | 初期データを更新／スキップ |
| Storage バケット設定 | 列の存在を `information_schema` で確認してから更新 |

**注意:**

- 既存テーブルのカラム構成がこのファイルと異なる場合、`create table if not exists` では修正されません。その場合は別の migration で `alter table ... add column` などを行ってください。
- `profiles.handle` の一意制約に違反する既存データがある場合、再実行ではなくデータ修正が必要です。
- カスタムで追加した RLS ポリシーは削除されません（このファイルが作成した名前のポリシーのみ作り直します）。
- genres の seed は `on conflict do update` なので、再実行すると label / icon / sort_order がこのファイルの値に戻ります。

### トリガーの挙動（INSERT / UPDATE / DELETE）

| トリガー | 発火タイミング | 挙動 |
|---|---|---|
| `on_auth_user_created` | auth.users INSERT | `profiles` を自動作成（メタデータをサニタイズ、衝突時リトライ） |
| `trg_games_set_derived` | games INSERT / UPDATE | `author_id` と `published_at` を設定／解除。**`search_text` は触らない** |
| `trg_games_refresh_search` | games INSERT / UPDATE | 対象列が変わったときだけ `search_text` を再生成（再帰なし） |
| `trg_set_updated_at_games` 他 | 各テーブル UPDATE | `updated_at` を現在時刻に更新 |
| `trg_game_tags_refresh_search` | game_tags INSERT / UPDATE / DELETE | 新旧の `game_id` の `search_text` を再生成 |
| `trg_profiles_refresh_search` 等 | profiles / genres / tags UPDATE | 全ゲームの `search_text` を再生成 |
| `trg_comments_validate_parent` | comments INSERT / UPDATE(parent_id, game_id) | 返信先が同じゲーム・存在する・自分自身でないことを検証 |
| `trg_game_likes_count` | game_likes INSERT / UPDATE / DELETE | 新旧 `game_id` の `like_count` を再計算 |
| `trg_reviews_stats` | reviews INSERT / UPDATE / DELETE | 新旧 `game_id` の `rating_avg` / `review_count` を再計算 |
| `trg_follows_counts` | follows INSERT / UPDATE / DELETE | 新旧 follower / following のカウンターを再計算 |
| DELETE 時のカスケード | 各 FK | 子レコードは DB の `on delete cascade` で削除（対応する AFTER トリガーも発火） |

> 未検証: 上記は SQL 定義からの静的な確認です。実際の DB で INSERT / UPDATE / DELETE を実行して挙動を確認していません。

### ロールバック

自動の down migration は用意していません。必要な場合は、影響範囲を確認した上で手動で DROP してください。

```sql
-- 例: 開発環境のみ。外部キーや Storage オブジェクトへの参照に注意。
drop schema if exists private cascade;
drop table if exists public.collection_items cascade;
drop table if exists public.collections cascade;
drop table if exists public.follows cascade;
drop table if exists public.reviews cascade;
drop table if exists public.comments cascade;
drop table if exists public.game_likes cascade;
drop table if exists public.game_screenshots cascade;
drop table if exists public.game_platforms cascade;
drop table if exists public.game_tags cascade;
drop table if exists public.games cascade;
drop table if exists public.platforms cascade;
drop table if exists public.tags cascade;
drop table if exists public.genres cascade;
drop table if exists public.profiles cascade;
```

---

## 9. フロントエンド実装時の設定（将来用）

既存フロントエンドは変更していないため、ここに記載のみ行います。

```bash
# .env.local（クライアントに埋め込む値）
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<ANON_KEY>

# サーバー/Edge Functions のみ。フロントには絶対に置かない。
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
```

推奨する接続方針:

- ブラウザからは anon key + RLS 経由で `games` / `genres` / `tags` / `platforms` / `comments` / `follows` / `collections` などを操作します。
- `downloads` 更新、有料 `game-assets` の署名付き URL 発行、モデレーション（`featured` / `trending` 変更）は service_role を持つサーバー側で行います。
- 新しいユーザー登録画面を作る場合は Supabase Auth の `signUp()` を使い、プロフィール作成はトリガーに任せます。

---

## 10. 未検証・今後の確認事項

1. **実プロジェクトでの実行検証**: この SQL はまだ Supabase 上で実行していません。構文・依存関係は静的にレビューしていますが、実行前にステージングで確認してください。
2. **`storage.buckets` の設定カラム**: `file_size_limit` / `allowed_mime_types` の存在を `information_schema` で判定してから更新しています。極端に古い／カスタマイズされたプロジェクトでは調整が必要です。
3. **許可 MIME の実挙動**: `game-assets` の MIME リストは仕様から決定しました。実際のアップロードで HTML / wasm / zip が受け付けられるか未検証です。
4. **Storage の署名付き URL**: 非公開バケット `game-assets` の有料ファイル配布には service_role 側の実装が必要です。未実装です。
5. **public バケットの URL 露出**: `game-covers` / `game-screenshots` は public なので、RLS に関係なく URL を知るユーザーが読めます。運用上問題ないか確認してください。
6. **日本語全文検索**: `pg_trgm` による部分一致を採用しています。形態素解析が必要な場合は別途拡張（例: `pg_japanese`）と検索設計の見直しが必要です。
7. **Auth メタデータ**: `handle_new_user()` が参照するキーは推測です。OAuth プロバイダーに応じて調整してください。サニタイズとリトライは入れていますが、実登録での確認は未実施です。
8. **レビューの集計**: `private.seed_demo_games()` で投入した `rating_avg` / `review_count` は初期値です。実際に `reviews` が作成／削除されるとトリガーが再計算して上書きします。
9. **自分自身へのいいね／レビュー**: 両方ともポリシーで禁止していますが、運営方針で許可する場合は `game_likes_insert_own` / `private.can_review_game()` を変更してください。
10. **管理画面**: `featured` / `trending` / `is_new` を変更する管理 UI はまだありません。当面は service_role から直接更新してください。
11. **初期データの DB 反映**: `src/data/games.js` との一致はファイル比較で確認済みですが、DB 実行後のレコードは未確認です。
