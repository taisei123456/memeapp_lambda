# Step 1: S3を作成

この手順では、アプリ全体の土台になる3つのS3バケットを作成します。

## 目的
1. Frontend_Bucket に静的Webサイトを置く。
2. Input_Bucket にユーザー画像を保存する。
3. Output_Bucket に合成済み画像を保存する。

## 事前準備
1. リージョンを `us-east-1` に固定します。
2. バケット名は世界で一意になる名前にします。
3. すべて小文字とハイフンで統一します。

## 作成するバケット
1. Frontend_Bucket: 例 `yourname-frontend-bucket`
2. Input_Bucket: 例 `yourname-input-bucket`
3. Output_Bucket: 例 `yourname-output-bucket`

## 手順 1: 3つのバケットを作成する
1. AWSコンソールで S3 を開きます。
2. バケットを作成 を押します。
3. Frontend_Bucket の名前を入力して、リージョンを `us-east-1` にします。
4. 同じ手順で Input_Bucket と Output_Bucket も作成します。
5. 3つとも同じリージョンであることを確認します。

## 手順 2: Frontend_Bucket に静的Webサイト設定を入れる
1. Frontend_Bucket を開きます。
2. プロパティ タブを開きます。
3. Static website hosting を有効化します。
4. Index document に `index.html` を設定します。
5. 変更を保存します。

## 手順 3: Frontend_Bucket を公開表示できるようにする
1. 権限 タブを開きます。
2. バケットポリシーを追加して `s3:GetObject` を許可します。
3. 対象は Frontend_Bucket 配下のオブジェクトのみにします。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadForWebsite",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::yourname-frontend-bucket/*"
    }
  ]
}
```

## 手順 4: Input_Bucket に CORS を設定する
1. Input_Bucket を開きます。
2. Permissions タブを開きます。
3. CORS configuration を編集します。
4. フロントエンドのオリジンから PUT を許可します。

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": ["http://yourname-frontend-bucket.s3-website-us-east-1.amazonaws.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## 手順 5: Output_Bucket に CORS を設定する
1. Output_Bucket を開きます。
2. Permissions タブを開きます。
3. CORS configuration を編集します。
4. フロントエンドのオリジンから GET を許可します。

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["http://yourname-frontend-bucket.s3-website-us-east-1.amazonaws.com"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

## 補足
1. Output画像をブラウザで直接表示するなら、Output_Bucket に GetObject 許可が必要です。
2. Input_Bucket は公開不要です。
3. 最初は検証しやすいように設定し、あとで AllowedOrigins を実URLに合わせます。

## 確認ポイント
1. 3つのバケットが表示される。
2. すべて `us-east-1` にある。
3. Frontend_Bucket で static website hosting が有効になっている。
4. Input_Bucket と Output_Bucket に CORS が入っている。

## よくあるミス
1. リージョンが混在している。
2. AllowedOrigins が実際のサイトURLと違う。
3. Frontend_Bucket の公開設定が足りず 403 になる。
