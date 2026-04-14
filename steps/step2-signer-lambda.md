# Step 2: Signer_Lambda を作成

この手順では、フロントエンドに返す Presigned URL を発行する Lambda を作成します。

## 目的
1. フロントエンドが安全に Input_Bucket へ画像をアップロードできるようにする。
2. AWS の認証情報をブラウザに出さない。

## 事前準備
1. Input_Bucket と Output_Bucket が作成済みであること。
2. LabRole の ARN を確認しておくこと。
3. Python 3.12 を使う前提で進めること。

## Lambda の基本設定
1. Lambda コンソールで関数を作成します。
2. ランタイムは Python 3.12 を選びます。
3. 実行ロールは LabRole を指定します。
4. タイムアウトは短めでよいです。
5. メモリは 128MB から始めても問題ありません。

## 環境変数
1. `INPUT_BUCKET`
2. `OUTPUT_BUCKET`
3. `AWS_REGION=us-east-1`

## 実装の考え方
1. UUID で object key を作ります。
2. 例として `uploads/{uuid}.png` のような形式にします。
3. `boto3.generate_presigned_url` を使って PUT 用 URL を発行します。
4. 返却値には uploadUrl、key、resultUrl を含めます。

## 返却する JSON の例
```json
{
  "uploadUrl": "https://...",
  "key": "uploads/xxxxxxxx.png",
  "resultUrl": "https://your-output-bucket.s3.amazonaws.com/memes/xxxxxxxx.png"
}
```

## 手順 1: Lambda のコードを書く
1. boto3 で S3 クライアントを作成します。
2. UUID を使って object key を決めます。
3. `put_object` ではなく `generate_presigned_url` を使います。
4. 成功時は HTTP 200 を返します。
5. 失敗時は HTTP 500 を返します。

## 手順 2: resultUrl の作り方を統一する
1. フロント側で画像表示しやすいように URL の形式を固定します。
2. 例: `https://{output-bucket}.s3.amazonaws.com/memes/{key-filename}`
3. `key-filename` は input のファイル名から派生させてもよいです。

## 手順 3: エラーハンドリングを入れる
1. 例外は try/except で捕捉します。
2. エラー時は JSON で理由を返します。
3. CloudWatch Logs で追えるようにログも残します。

## 確認ポイント
1. Lambda がデプロイできる。
2. 手動実行で Presigned URL を返せる。
3. エラー時に 500 を返せる。

## よくあるミス
1. LabRole が付いていない。
2. `INPUT_BUCKET` の環境変数名が違う。
3. resultUrl の形式がフロントと一致していない。
