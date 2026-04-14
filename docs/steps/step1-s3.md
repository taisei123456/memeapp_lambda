# Step 1: S3の土台を作る

このステップでは、アプリで使う3つのS3バケットを作成し、
フロント表示・アップロード・結果表示に必要な最小設定まで完了させます。

## このステップのゴール
1. `Frontend_Bucket` を静的Webサイトとして公開できる。
2. `Input_Bucket` にブラウザからPresigned URL経由でPUTできる。
3. `Output_Bucket` の画像をブラウザで参照できる。

## 先に決める値
1. リージョン: `us-east-1`
2. バケット名プレフィックス: 例 `0415-mememaker`
3. バケット名
   - `0415-mememaker-frontend-bucket`
   - `0415-mememaker-input-bucket`
   - `0415-mememaker-output-bucket`

## 手順 1: 3つのバケットを作成
1. AWSコンソールでS3を開きます。
2. `Frontend_Bucket` を作成します。
3. `Input_Bucket` を作成します。
4. `Output_Bucket` を作成します。
5. 3つともリージョンが `us-east-1` であることを確認します。

## 手順 2: Frontend_Bucketを静的サイト化
1. `Frontend_Bucket` の `Properties` を開きます。
2. `Static website hosting` を `Enable` にします。
3. `Index document` に `index.html` を設定します。
4. 保存後、Website endpointを控えます。

## 手順 3: Frontend_Bucketを公開読み取り可能にする
1. `Permissions` を開きます。
2. `Block all public access` を解除します。
3. バケットポリシーに以下を設定します。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadForWebsite",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::0415-mememaker-frontend-bucket/*"
    }
  ]
}
```

## 手順 4: Input_BucketにCORSを設定
1. `Input_Bucket` の `Permissions` を開きます。
2. `CORS configuration` に以下を設定します。

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": ["http://0415-mememaker-frontend-bucket.s3-website-us-east-1.amazonaws.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## 手順 5: Output_BucketにCORSを設定
1. `Output_Bucket` の `Permissions` を開きます。
2. `CORS configuration` に以下を設定します。

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["http://0415-mememaker-frontend-bucket.s3-website-us-east-1.amazonaws.com"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

## 手順 6: Output_Bucketの公開読み取りを設定
1. `Output_Bucket` も `GetObject` を許可します。
2. テスト時はバケットポリシーで全公開でも可、運用時はCloudFront+OAC推奨です。

最小構成のポリシー例:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadOutput",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::0415-mememaker-output-bucket/*"
    }
  ]
}
```

## 完了チェック
1. 3バケットが存在する。
2. Frontend_BucketにWebsite endpointがある。
3. Input/OutputにCORSが設定済み。
4. Frontend/Outputの読み取りポリシーが有効。

## 失敗時の切り分け
1. 403が出る: バケットポリシーまたはBlock Public Accessを再確認。
2. CORSエラー: AllowedOriginsが完全一致しているか確認。
3. 表示されない: Website endpointのURLを間違えていないか確認。
