# Step 7: フロントエンドを配置して接続

このステップでは、`frontend/index.html` `frontend/app.js` `frontend/style.css` `frontend/config.js` をS3へ配置し、
Function URL経由のアップロード処理を実際に動かします。

## このステップのゴール
1. フロント画面がS3 Website endpointで表示される。
2. config.js の固定URLでアップロードできる。
3. 合成結果画像が画面に表示される。

## 手順 1: ファイルを確認
1. `frontend/index.html`
2. `frontend/app.js`
3. `frontend/style.css`
4. `frontend/config.js`

チェックポイント:
1. `app.js` が Function URLへGETし、`fileName` と `contentType` を付ける。
2. `uploadUrl` へのPUT時に `Content-Type` を送る。

## 手順 2: Frontend_Bucketへアップロード
1. S3で `Frontend_Bucket` を開きます。
2. 上記4ファイルをアップロードします。
3. 既存ファイルがあれば上書きします。

## 手順 3: 画面表示を確認
1. `Frontend_Bucket` の Website endpointを開きます。
2. 画面が崩れず表示されるか確認します。
3. 404なら `index.html` の配置場所を確認します。

## 手順 4: Function URLを設定
1. `frontend/config.js` の signerEndpoint にStep 3のURLを設定します。
2. S3に再アップロード後、ブラウザを再読み込みします。

## 手順 5: アップロードを実行
1. 画像ファイルを選択します。
2. `アップロードして合成` を押します。
3. ステータス表示が進行することを確認します。
4. 完了後、合成結果が表示されることを確認します。

## 失敗時の切り分け
1. 署名URL取得で失敗
	- Function URLとCORS設定を確認。
2. PUTで失敗
	- `Content-Type` 不一致、Input_Bucket CORSを確認。
3. 結果が表示されない
	- Processor LambdaとOutput_Bucket公開設定を確認。
