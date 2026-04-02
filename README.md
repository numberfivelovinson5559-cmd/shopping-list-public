# 🛒 買い物リスト（Supabase版）

URLを開くだけで使える、シンプルな買い物リストアプリです。
Next.js + Supabase で作られており、無料でセルフホストできます。

**デモ：** https://shopping-list-public.vercel.app

## 機能

- 商品の追加・購入済みチェック・削除
- 店舗別タブ表示・フィルター
- カテゴリ・数量・メモ対応
- ダークモード（デバイスごとに記憶）
- カスタム店舗追加（ブラウザごとに記憶）
- 店舗チップのドラッグ＆ドロップ並び替え
- PWA対応（スマホのホーム画面に追加可能）

---

## セルフホスト手順

### 1. このリポジトリをフォーク／クローン

```bash
git clone https://github.com/your-username/shopping-list-public.git
cd shopping-list-public
npm install
```

### 2. Supabaseプロジェクトを作成

[supabase.com](https://supabase.com) でアカウントを作成し、新しいプロジェクトを作成します。

**SQL Editor で以下を実行：**

```sql
-- 買い物アイテムテーブル
create table shopping_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  store text,
  category text,
  quantity text,
  memo text,
  is_purchased boolean not null default false,
  created_at timestamptz not null default now()
);

-- 店舗テーブル（任意）
create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- RLS を無効化（認証なしで使う場合）
alter table shopping_items disable row level security;
alter table stores disable row level security;
```

### 3. 環境変数を設定

`.env.local` を作成：

```bash
cp .env.local .env.local.bak  # バックアップ（任意）
```

`.env.local` を編集：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> Supabase の **Settings → API** で URL と Anon Key を確認できます。

### 4. ローカルで動作確認

```bash
npm run dev
```

http://localhost:3000 で確認します。

### 5. Vercel にデプロイ

**方法A：GitHub連携（推奨）**

1. このリポジトリを GitHub にpushする
2. [vercel.com](https://vercel.com) でリポジトリをインポート
3. Environment Variables に以下を追加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy をクリック

**方法B：Vercel CLI**

```bash
npm install -g vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

---

## カスタマイズ方法

`src/lib/supabase.ts` を編集するだけで、店舗・カテゴリ・色を自由に変更できます。

### 店舗を変更する

```typescript
export const DEFAULT_STORES = [
  "スーパーA",   // ← 自分のよく行く店舗に変更
  "ドラッグストアB",
  "ホームセンターC",
  // ...
] as const;
```

### 店舗の色を変更する

```typescript
export const STORE_COLORS: Record<string, string> = {
  スーパーA: "bg-blue-100 text-blue-700",       // 青
  ドラッグストアB: "bg-green-100 text-green-700", // 緑
  ホームセンターC: "bg-orange-100 text-orange-700", // オレンジ
};
```

Tailwind CSS のカラークラスを使います。`bg-{色}-{濃さ} text-{色}-{濃さ}` の形式です。

### カテゴリを変更する

```typescript
export const CATEGORIES = [
  "食品",
  "日用品",
  "衛生用品",
  // 自由に追加・削除
] as const;
```

---

## 技術スタック

| 技術 | 用途 |
|------|------|
| [Next.js 16](https://nextjs.org/) | フレームワーク（App Router） |
| [Supabase](https://supabase.com/) | データベース（PostgreSQL） |
| [Tailwind CSS](https://tailwindcss.com/) | スタイリング |
| [Vercel](https://vercel.com/) | ホスティング |
| TypeScript | 型安全 |

## ライセンス

MIT
