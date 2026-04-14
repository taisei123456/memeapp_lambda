# Serverless Meme Maker (AWS Learner Lab)

このリポジトリは、S3 + Lambda を使って「画像アップロード -> スタンプ合成 -> 結果表示」までを行う、学習用のサーバーレスWebアプリです。

## 1. このアプリでできること

- ブラウザから画像をアップロード
- Signer Lambda が Presigned URL を発行
- フロントが Presigned URL で Input S3 に PUT
- S3イベントで Processor Lambda が起動
- Processor Lambda が stamp.png を重ねて Output S3 に保存
- フロントが Output S3 の画像を表示

## 2. 構成（最終形）

- Frontend: S3 Static Website
- API入口: Lambda Function URL（API Gatewayは未使用）
- Signer: mememaker-signer-lambda
- Processor: mememaker-processor-lambda
- Storage:
  - 0415-mememaker-frontend-bucket
  - 0415-mememaker-input-bucket
  - 0415-mememaker-output-bucket

処理フロー:

1. フロントが Signer Lambda の Function URL を呼ぶ
2. Signer が uploadUrl / resultUrl を返す
3. フロントが uploadUrl へ画像を PUT
4. Input_Bucket の ObjectCreated イベントで Processor 起動
5. Processor が memes/ に出力
6. フロントが resultUrl をポーリングして表示

## 3. ファイル構成

- index.html: 画面
- style.css: スタイル
- app.js: フロント処理本体
- config.js: Signer Function URL の設定ファイル
- steps/: 作業手順書（step1〜step9）

## 4. これまでに行った主な改善

### 4.1 API Gateway依存を削除

- 当初の API Gateway 前提をやめ、Function URL で最短構成に変更
- 手順書全体を Function URL 中心で統一

### 4.2 フロント設定の簡略化

- Function URL を画面入力ではなく config.js で固定管理
- UI から URL 入力欄を削除（誤入力防止）

### 4.3 CORSの安定化

- CORSヘッダーの二重付与問題を整理
- Function URL 側で CORS を管理し、ブラウザの `multiple values` エラーを回避

### 4.4 Pillow依存の互換性対応

- Windowsビルド由来の `_imaging` import エラーを解消
- CloudShell で Lambda 実行環境互換の Pillow を作成し再デプロイ

### 4.5 受け入れ拡張子の落とし穴を解消

- S3イベント通知の suffix が `.png` 固定だと jpg が起動しない問題を確認
- 画像形式を増やす場合は suffix を外すか、通知を拡張子ごとに分割

## 5. セットアップ手順（最短）

詳細は steps 配下を参照してください。

1. Step 1: S3バケット作成・CORS・公開設定
2. Step 2: Signer Lambda 作成
3. Step 3: Signer Function URL 設定
4. Step 4: Processor Lambda 作成
5. Step 5: Pillow と stamp.png をデプロイ
6. Step 6: Input S3 イベント通知を Processor へ接続
7. Step 7: フロント配備
8. Step 8: 受け入れテスト
9. Step 9: コスト最適化

## 6. 設定ファイル（重要）

config.js の signerEndpoint を環境に合わせて設定します。

```js
window.APP_CONFIG = {
  signerEndpoint: 'https://xxxx.lambda-url.us-east-1.on.aws/'
};
```

## 7. よくあるエラーと対処

### 7.1 CORS: multiple values

症状:
- `Access-Control-Allow-Origin contains multiple values`

原因:
- Function URL側とLambdaレスポンス側で CORS を二重設定

対処:
- CORS管理を片側に統一（推奨: Function URL 側）

### 7.2 Processorで `cannot import name '_imaging'`

症状:
- `Runtime.ImportModuleError` / `cannot import name '_imaging' from 'PIL'`

原因:
- Pillow のビルドターゲットが Lambda 実行環境と不一致

対処:
- CloudShell で Python 3.12 x86_64 互換パッケージを作成して再アップロード

### 7.3 jpgだけ処理されない

症状:
- Output 側で 403 が続く、Processor ログが出ない

原因:
- Event notification の suffix が `.png` のみ

対処:
- suffix を外す、または `.jpg` `.jpeg` を追加

## 8. デプロイ時チェックリスト

- [ ] Frontend_Bucket に index.html / style.css / app.js / config.js を配置
- [ ] Signer Function URL が有効（Auth type: NONE）
- [ ] Function URL CORS が Frontend origin と一致
- [ ] Processor Lambda の Runtime/Architecture と zip 内容が一致
- [ ] Input_Bucket イベント通知が Processor Lambda を指している
- [ ] Output_Bucket の公開設定とCORSが有効

## 9. セキュリティ・運用メモ

- 学習用途では Output の公開を許可して簡略化
- 実運用では CloudFront + OAC + 認可設計を推奨
- Function URL の公開範囲（origin）を必要最小限に制限
- S3 ライフサイクルと CloudWatch Logs 保持期間でコスト抑制

## 10. 次の改善候補

- 画像形式のバリデーション強化（フロント + Lambda）
- 失敗時のユーザー向けエラーメッセージ改善
- 生成結果のメタ情報表示（処理時間、出力形式など）
- CI/CD での自動デプロイ
