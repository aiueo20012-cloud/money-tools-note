# 通信費・固定費見直しナビ (money-tools-note)

毎月のスマホ代、サブスク代、固定費を見える化し、利用者が自分に合う通信費見直しの方法を調べられる完全静的Webサイトです。

## 特徴
- 外部API・DB・Google Cloud不要、個人情報送信なし、ブラウザ内完結計算
- スマートフォン最適化、高速・軽量な静的構成
- GitHub Pages対応（リポジトリ名: `money-tools-note`）

## GitHub Pagesへの公開手順

このリポジトリは**2種類の方法**のどちらでも公開できます。お好みの方法をお選びください。

---

### 方法A：GitHub Actions による自動ビルド＆デプロイ（推奨）

リポジトリ内の `.github/workflows/deploy.yml` により、`main` ブランチにプッシュするだけで自動でビルドされ公開されます。

1. GitHubでリポジトリ名 `money-tools-note` を作成し、ローカルのファイルをプッシュします。
2. GitHubのリポジトリ画面で **「Settings」** タブを開きます。
3. 左サイドバーの **「Pages」** を選択します。
4. **「Build and deployment」** の **「Source」** を **「GitHub Actions」** に変更します。
5. 数分でビルドとデプロイが完了し、公開URL（`https://<ユーザー名>.github.io/money-tools-note/`）が発行されます。

---

### 方法B：ブランチからの直接デプロイ（ビルド不要で公開する場合）

当サイトは `index.html`、`style.css`、`script.js` のみでも単体動作する構成になっています。

1. `npm run build` を実行すると `dist` フォルダに最適化された静的ファイル一式（HTML、CSS、JS）が生成されます。
2. `dist` の中身を `main` ブランチのルート、または `gh-pages` ブランチに配置します。
3. リポジトリの **「Settings」** → **「Pages」** で Source を **「Deploy from a branch」** に設定し、ブランチとフォルダ（`/root`）を指定して **Save** します。

---

## 主なファイル構成

- `index.html`: 全14ページを収録したメインHTMLファイル
- `style.css`: 濃紺（#12304A）と深緑（#1F8A70）をベースにしたレスポンシブスタイルシート
- `script.js`: クライアント完結のルーターおよび各種計算シミュレーター
- `vite.config.ts`: `base: './'` の相対パス設定
- `.github/workflows/deploy.yml`: GitHub Actions用自動デプロイ設定
