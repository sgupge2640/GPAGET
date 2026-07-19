# GPAGET

GPAGET は、授業・課題・過去問・学習進捗をまとめて管理できる学習支援アプリです。

## 概要

主な機能:

- ユーザー登録 / ログイン
- 授業管理
- 特別課題管理
- カレンダー表示
- 過去問画像アップロード
- 学習時間の記録と可視化

## 公開URL

- フロントエンド: https://gpaget-front.onrender.com
- バックエンド API: https://gpaget.onrender.com
- GitHub: https://github.com/sgupge2640/GPAGET.git

## 技術スタック

- フロントエンド: React + Vite
- バックエンド: Flask + SQLAlchemy
- データベース: Supabase (PostgreSQL)
- 認証: JWT
- 公開先: Render

## ローカル実行

### バックエンド

1. 必要パッケージをインストール

```bash
cd backend
pip install -r requirements.txt
```

2. 環境変数を設定

```text
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
ALLOWED_ORIGINS=http://localhost:5173
```

3. アプリを起動

```bash
python app.py
```

### フロントエンド

1. 依存関係をインストールして開発サーバーを起動

```bash
cd frontend
npm install
npm run dev
```

2. 必要に応じて API の接続先を設定

```text
VITE_API_BASE_URL=http://localhost:5000
```

## Supabase セットアップ

1. Supabase プロジェクトを作成
2. Database の接続文字列を取得し、`DATABASE_URL` に設定
3. Supabase の SQL Editor で `backend/supabase_schema.sql` を実行してテーブルを作成

> `DATABASE_URL` が未設定のときは、開発用として `backend/app.db` (SQLite) を利用します。

## Render 設定メモ

### バックエンド

- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn app:app`

### フロントエンド

- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

## 環境変数

Render + Supabase 構成では、以下の環境変数を設定してください。

```text
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
ALLOWED_ORIGINS=https://gpaget-front.onrender.com
VITE_API_BASE_URL=https://gpaget.onrender.com
```

> Supabase の接続文字列は `postgres://...` 形式でも自動で `postgresql://...` に正規化されます。

## 補足

- アップロードされた画像や DB の保存データは、Render の無料プランでは永続化が保証されない場合があります。
- 秘密情報は GitHub に push しないでください。
