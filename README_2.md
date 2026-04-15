# Serverless Meme Maker 詳細ガイド（README_2）

このドキュメントは、memeapp_lambda の全体像、構築手順、実装仕様、運用方法、トラブル対応を一つにまとめた詳細版READMEです。

既存の以下資料を横断して整理しています。
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/steps/step1-s3.md` 〜 `docs/steps/step9-cost-ops.md`
- `frontend/index.html`, `frontend/app.js`, `frontend/config.js`, `frontend/style.css`

---

## 1. プロジェクトの目的

AWS Learner Lab を想定した、学習用サーバーレスWebアプリです。

ユーザーがブラウザから画像をアップロードすると、以下の流れでミーム画像を生成します。

1. フロントエンドが Signer Lambda にリクエスト
2. Signer Lambda が Presigned URL を発行
3. ブラウザが Input S3 へ直接 PUT
4. S3イベントで Processor Lambda が起動
5. Processor Lambda がスタンプ合成して Output S3 に保存
6. フロントエンドが Output をポーリングして表示

---

## 2. 最終アーキテクチャ

### 2.1 構成要素

- Frontend: S3 Static Website
- API入口: Lambda Function URL（API Gateway は不使用）
- Signer Lambda: `mememaker-signer-lambda`
- Processor Lambda: `mememaker-processor-lambda`
- S3 Buckets:
  - `0415-mememaker-frontend-bucket`
  - `0415-mememaker-input-bucket`
  - `0415-mememaker-output-bucket`

### 2.2 データフロー

1. ブラウザが `GET /?fileName=...&contentType=...` で Signer を呼ぶ
2. Signer が `uploadUrl` と `resultUrl` を返す
3. ブラウザが `uploadUrl` に画像を `PUT`
4. Input Bucket の `ObjectCreated` イベントで Processor が起動
5. Processor が `stamp.png` を重ね、`memes/` に出力
6. ブラウザが `resultUrl` を `HEAD` で確認し、完成後 `GET` 表示

---

## 3. リポジトリ構成

```text
README.md
README_2.md

docs/
  ARCHITECTURE.md
  steps/
    step1-s3.md
    step2-signer-lambda.md
    step3-api-gateway.md
    step4-processor-lambda.md
    step5-pillow-stamp-deploy.md
    step6-s3-event-trigger.md
    step7-frontend-minimal.md
    step8-verification.md
    step9-cost-ops.md

frontend/
  index.html
  style.css
  app.js
  config.js
```

### 3.1 各ファイルの役割

- `frontend/index.html`
  - 画面構成（アップロードUI、結果表示、ステータス表示）
- `frontend/style.css`
  - UIスタイル（ダーク調、レスポンシブ対応）
- `frontend/app.js`
  - Signer呼び出し、Presigned PUT、結果ポーリングの実処理
- `frontend/config.js`
  - Signer Function URL を固定設定
- `docs/steps/*`
  - 構築手順と運用ノウハウ

---

## 4. 事前準備

## 4.1 前提

- AWS Learner Lab などで AWS コンソール操作が可能
- Lambda（Python 3.12）を利用可能
- S3 バケット作成と公開設定を実施可能

### 4.2 命名ルール（推奨）

- リージョン: `us-east-1`
- プレフィックス例: `0415-mememaker`
- バケット例:
  - `0415-mememaker-frontend-bucket`
  - `0415-mememaker-input-bucket`
  - `0415-mememaker-output-bucket`

---

## 5. セットアップ全体手順（Step1〜9要約）

## 5.1 Step 1: S3基盤作成

- 3バケットを作成
- Frontend Bucket を Static Website Hosting 有効化
- Frontend / Output を公開読み取り設定
- Input / Output に CORS 設定

重要ポイント:
- `AllowedOrigins` は Frontend の Website endpoint と完全一致が必要
- `Block all public access` の状態を用途別に確認

## 5.2 Step 2: Signer Lambda 作成

- 関数名: `mememaker-signer-lambda`
- Runtime: Python 3.12
- 環境変数:
  - `INPUT_BUCKET`
  - `OUTPUT_BUCKET`
  - `PRESIGNED_EXPIRES=300`

役割:
- `fileName` / `contentType` を受けて拡張子を安全決定
- Presigned PUT URL 生成
- 表示用 `resultUrl` 返却

## 5.3 Step 3: Function URL 設定

- Auth type: `NONE`
- CORS:
  - Origin: Frontend Website endpoint
  - Methods: `GET`, `OPTIONS`
  - Headers: `Content-Type`

注意:
- 既存手順書の見出し名は `step3-api-gateway.md` ですが、内容は Function URL 前提です。

## 5.4 Step 4: Processor Lambda 作成

- 関数名: `mememaker-processor-lambda`
- Runtime: Python 3.12
- 初期推奨: Timeout 30秒 / Memory 512MB
- 環境変数:
  - `OUTPUT_BUCKET`
  - `STAMP_PATH=/var/task/stamp.png`
  - `OUTPUT_PREFIX=memes/`

役割:
- Input 画像取得
- Pillow でスタンプを右下合成
- Output へ保存（ContentType: `image/jpeg`）

## 5.5 Step 5: Pillow + stamp 配備

方式A（最短）:
- 関数zipへ Pillow と `stamp.png` を同梱

方式B（推奨）:
- Lambda Layer で Pillow を管理
- 関数zipは `lambda_function.py` と `stamp.png` のみにする

注意:
- Windowsビルド由来の互換問題（`_imaging` エラー）が出る場合、Amazon Linux互換で再ビルド

## 5.6 Step 6: S3イベント接続

- Input Bucket の Event Notification を作成
- Event type: `All object create events`
- Prefix: `uploads/`（推奨）
- Destination: Processor Lambda

注意:
- Suffixを `.png` 固定にすると jpg/jpeg が起動対象外

## 5.7 Step 7: フロント配備

- `frontend/index.html`
- `frontend/style.css`
- `frontend/app.js`
- `frontend/config.js`

を Frontend Bucket へアップロード。

`frontend/config.js` の `signerEndpoint` に Function URL を設定して再アップロード。

## 5.8 Step 8: E2E受け入れテスト

正常系:
- 画像選択 -> アップロード -> 合成結果表示

確認対象:
- Input `uploads/` に元画像
- Output `memes/` に合成画像
- Signer / Processor の CloudWatch Logs

異常系:
- URL誤設定
- 未選択送信
- 不正入力

## 5.9 Step 9: コスト最適化・運用

- Lambdaメモリ/タイムアウト最小化
- S3 ライフサイクル設定（7日 or 30日削除）
- CloudWatch Logs 保持期間短縮（例: 7日）
- Function URL CORS を最小公開

---

## 6. フロントエンド実装仕様（現行コード準拠）

### 6.1 `config.js`

```js
window.APP_CONFIG = {
  signerEndpoint: 'https://xxxx.lambda-url.us-east-1.on.aws/'
};
```

- 起動時に `window.APP_CONFIG.signerEndpoint` を読み込み
- 未設定時は UI でエラー表示

### 6.2 `app.js` の動作

1. ファイル選択チェック
2. Signer URL を組み立て
   - `fileName`
   - `contentType`
3. `GET` で署名情報取得
4. `uploadUrl` へ `PUT`
   - `Content-Type` をファイルMIMEに一致させる
5. `resultUrl` を `HEAD` ポーリング
   - 間隔: 2000ms
   - 最大: 30回（約60秒）
6. 完成時に `<img>` へ表示

### 6.3 受け付けるレスポンスキー

フロント側は互換のため複数キーを許容:
- `uploadUrl` / `presignedUrl` / `url`
- `resultUrl` / `outputUrl` / `imageUrl`
- `key` / `objectKey` / `fileKey`

---

## 7. IAM・権限設計の最低要件

### 7.1 Signer Lambda 実行ロール

最低限必要:
- Input Bucket への `s3:PutObject`

### 7.2 Processor Lambda 実行ロール

最低限必要:
- Input Bucket への `s3:GetObject`
- Output Bucket への `s3:PutObject`

### 7.3 S3 側公開ポリシー

学習用途の最短構成として Frontend / Output を公開読み取り可にする。
実運用は CloudFront + OAC での制限公開を推奨。

---

## 8. CORS整合ルール（重要）

CORS失敗は最も起きやすい問題です。以下を同時に満たしてください。

1. Function URL の Allowed Origin が Frontend URL と完全一致
2. Input Bucket CORS に Frontend Origin を設定
3. Output Bucket CORS に Frontend Origin を設定
4. CORSヘッダーの二重管理を避ける

よくある症状:
- `Access-Control-Allow-Origin contains multiple values`

対策:
- Function URL側とLambdaレスポンス側のどちらか一方に統一

---

## 9. 既知の落とし穴と対処

## 9.1 `cannot import name '_imaging' from PIL`

原因:
- Pillow のビルド環境が Lambda 実行環境と不一致

対処:
- Amazon Linux互換（CloudShell等）で再ビルドして再配備

## 9.2 jpgだけ処理されない

原因:
- S3 Event Notification の Suffix が `.png` 固定

対処:
- Suffix を外すか、拡張子別に通知を追加

## 9.3 PUT時の `SignatureDoesNotMatch`

原因:
- Presigned URL発行時の `contentType` とPUT時ヘッダー不一致

対処:
- フロント送信時の `Content-Type` をファイルMIMEに合わせる

## 9.4 結果が表示されない（403/404）

確認順:
1. Processor Lambda が起動しているか
2. Output Bucket `memes/` に出力があるか
3. Outputの公開ポリシー/CORS

---

## 10. テスト観点（チェックリスト）

### 10.1 正常系

- [ ] 画像選択なし送信で適切にエラー表示
- [ ] pngアップロードで成功
- [ ] jpg/jpegアップロードで成功
- [ ] `uploads/` に元画像が保存
- [ ] `memes/` に結果画像が保存
- [ ] 画面に結果画像が表示

### 10.2 異常系

- [ ] Signer URL不正時にUIへエラー
- [ ] CORS不整合時に原因が特定可能
- [ ] Pillow欠落時にログで原因追跡可能

### 10.3 合格基準

- 正常系を連続3回成功
- 異常系で原因特定手順を説明可能

---

## 11. 運用ガイド

### 11.1 日次/週次確認

- S3オブジェクト増加量
- Lambdaエラー率
- CloudWatch Logsの増加量

### 11.2 月次確認

- 不要画像の削除状況
- ライフサイクルルール適用状況
- 不要Lambda/Function URLの棚卸し

### 11.3 障害時の一次切り分け順

1. フロントUIステータス
2. Signerログ
3. Processorログ
4. Input/Outputの実データ

---

## 12. 学習構成から実運用へ拡張する場合

- Frontend を CloudFront 配信
- Output Bucket 直接公開をやめ、OAC経由配信
- 画像形式バリデーション強化
- 失敗時の再試行/Dead Letter Queue導入
- IaC（SAM/CDK/Terraform）化

---

## 13. 補足: ドキュメント間の差分メモ

- `step3-api-gateway.md` という名前だが内容は Function URL 手順
- 一部手順に「Function URL入力欄」の記述があるが、現行フロントは `config.js` 固定設定
- 現行UIとコードを正として再現する場合は `frontend/config.js` の更新が必須

---

## 14. 最短で再現したい人向け手順

1. Step1でS3 3バケット作成・CORS設定
2. Step2でSigner Lambda作成
3. Step3でFunction URL発行 + CORS設定
4. Step4でProcessor Lambda作成
5. Step5でPillowとstamp配備
6. Step6でInputイベント通知をProcessorへ接続
7. Step7でfrontend 4ファイル配備 + `config.js`更新
8. Step8でE2E確認
9. Step9でライフサイクル・ログ保持を設定

---

このREADME_2は、学習用途での「最短で動かす」だけでなく、「なぜ失敗するか」「どこを確認すべきか」まで追えることを重視して整理しています。
