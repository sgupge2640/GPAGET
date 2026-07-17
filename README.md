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
- GitHub: https://github.com/sgupge2640/GPAGET.git

## 技術スタック

- フロントエンド: React + Vite
- バックエンド: Flask + SQLAlchemy
- 認証: JWT
- 公開先: Render

## ローカル実行

### バックエンド

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

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

Render では、以下の環境変数を設定してください。

```text
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///app.db
ALLOWED_ORIGINS=https://gpaget-front.onrender.com
```

## 補足

- アップロードされた画像や DB の保存データは、Render の無料プランでは永続化が保証されない場合があります。
- 秘密情報は GitHub に push しないでください。
