# GPAGET

GPAGET は、授業・課題・過去問を一括で管理できる学習支援アプリです。

## 概要

このアプリは、以下のような機能を持っています。

- ユーザー登録 / ログイン
- 授業管理
- 特別課題（課題）管理
- 試験管理
- カレンダー表示
- 過去問画像アップロード
- 進捗管理

## 技術スタック

- フロントエンド: React + Vite
- バックエンド: Flask + SQLAlchemy
- 認証: JWT
- データ保存: SQLite（ローカル開発用）
- 公開先: Render

## プロジェクト構成

```text
GPAGET/
├─ backend/
│  ├─ app.py
│  ├─ requirements.txt
│  └─ uploads/
├─ frontend/
│  ├─ package.json
│  ├─ vite.config.js
│  └─ src/
└─ README.md
```

## ローカル実行方法

### 1. Python 仮想環境を作成

```bash
python -m venv .venv
```

### 2. 仮想環境を有効化

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. バックエンド依存関係をインストール

```bash
cd backend
pip install -r requirements.txt
```

### 4. バックエンドを起動

```bash
python app.py
```

### 5. フロントエンド依存関係をインストール

```bash
cd ../frontend
npm install
```

### 6. フロントエンドを起動

```bash
npm run dev
```

## Render 公開手順

### バックエンド（Web Service）

- Root Directory: `backend`
- Build Command:

```bash
pip install -r requirements.txt
```

- Start Command:

```bash
gunicorn app:app
```

### フロントエンド（Static Site）

- Root Directory: `frontend`
- Build Command:

```bash
npm install && npm run build
```

- Publish Directory:

```text
dist
```

## 環境変数

Render の環境変数として、以下を設定することを推奨します。

```text
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///app.db
ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
```

## CORS 設定について

フロントエンドとバックエンドを分離して公開する場合、バックエンド側でフロントエンドの公開URLを許可する必要があります。

`ALLOWED_ORIGINS` に公開済みフロントエンドURLを設定してください。

## GitHub への反映

```bash
git add .
git commit -m "Update project"
git push origin main
```

## 注意事項

- 本番公開時は SQLite ではなく PostgreSQL などの外部データベースの利用を推奨します。
- アップロードされた画像や DB のファイルは Render 上で永続化されない可能性があるため、外部ストレージや外部DBを利用する設計が安全です。
- `.env` などの秘密情報は GitHub に push しないでください。

## ライセンス

このプロジェクトは個人学習用途を想定しています。
