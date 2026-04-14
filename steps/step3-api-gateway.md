# Step 3: Function URLを設定する

このステップでは、Signer Lambdaをブラウザから直接呼ぶために
Lambda Function URLを設定します。

## このステップのゴール
1. Signer LambdaにURLでアクセスできる。
2. フロントからのCORS呼び出しが通る。
3. ブラウザからテストしてJSONが返る。

## 手順 1: Function URLを作成
1. Lambdaコンソールで `mememaker-signer-lambda` を開きます。
2. `Configuration` > `Function URL` を開きます。
3. `Create function URL` を押します。
4. Auth type を `NONE` にします。
5. 保存してURLを控えます。

URL例:
1. `https://abcde12345.lambda-url.us-east-1.on.aws/`

## 手順 2: CORS設定
1. Allow origins
	- `http://0415-mememaker-frontend-bucket.s3-website-us-east-1.amazonaws.com`
2. Allow methods
	- `GET`
	- `OPTIONS`
3. Allow headers
	- `Content-Type`
4. 変更を保存します。

## 手順 3: アクセス確認
1. ブラウザで以下を実行します。
	- `https://abcde12345.lambda-url.us-east-1.on.aws/?fileName=test.png&contentType=image/png`
2. `uploadUrl` と `resultUrl` がJSONに含まれるか確認します。

## 手順 4: フロントに設定
1. フロント画面の `Lambda Function URL` 入力欄へURLを貼ります。
2. 末尾 `/` はあってもなくても動きます。
3. 保存後、ブラウザを再読み込みして値が残ることを確認します。

## 失敗時の切り分け
1. 403が返る
	- Function URLのAuth typeが `NONE` か確認します。
2. CORSエラー
	- Allow originsが完全一致しているか確認します。
3. 500が返る
	- Step 2の環境変数とCloudWatch Logsを確認します。
