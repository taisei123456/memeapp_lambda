# Step 3: API Gateway を作成

この手順では、フロントエンドから Signer_Lambda を呼ぶための入口を作ります。

## 目的
1. フロントエンドが HTTP 経由で Presigned URL を取得できるようにする。
2. Lambda を直接ブラウザ公開しない。

## 事前準備
1. Signer_Lambda が作成済みであること。
2. フロントエンドの URL を把握していること。

## 推奨設定
1. REST API ではなく HTTP API を使います。
2. 構成がシンプルで料金も抑えやすいです。

## 手順 1: HTTP API を作成する
1. API Gateway を開きます。
2. HTTP API を作成します。
3. 統合先に Signer_Lambda を選びます。

## 手順 2: ルートを追加する
1. `GET /get-upload-url` を作成します。
2. そのルートに Signer_Lambda を接続します。
3. 保存してデプロイします。

## 手順 3: CORS を設定する
1. CORS 設定を開きます。
2. Allow origin にフロントのサイトURLを入れます。
3. Allow methods に GET と OPTIONS を入れます。
4. 必要なら Allow headers も追加します。

## 手順 4: デプロイ後の確認
1. invoke URL を取得します。
2. ブラウザまたは curl で `GET /get-upload-url` を呼びます。
3. JSON が返れば成功です。

## フロント側の接続先
1. フロントエンドの入力欄に API Gateway の invoke URL を入れます。
2. 例: `https://xxxx.execute-api.us-east-1.amazonaws.com/get-upload-url`

## 確認ポイント
1. API Gateway がデプロイできる。
2. `GET /get-upload-url` が Lambda に転送される。
3. CORS エラーが出ない。

## よくあるミス
1. ルートが POST になっている。
2. CORS の origin が一致していない。
3. デプロイし忘れて変更が反映されていない。
