# Step 6: S3イベントでProcessor Lambdaを起動

このステップでは、Input_Bucketへのアップロードをトリガーに
Processor Lambdaが自動実行されるように設定します。

## このステップのゴール
1. Input_BucketへのPUTでProcessor Lambdaが起動する。
2. 不要ファイルでは起動しないようにフィルタできる。

## 手順 1: イベント通知を作成
1. S3で `Input_Bucket` を開きます。
2. `Properties` > `Event notifications` を開きます。
3. `Create event notification` を押します。
4. 名前を `trigger-processor-on-upload` にします。

## 手順 2: イベント種別を選択
1. Event typeは `All object create events` を選びます。
2. Upload完了時に発火する設定であることを確認します。

## 手順 3: フィルタを設定（推奨）
1. Prefixを `uploads/` にします。
2. Suffixは必要なら `.png` か `.jpg` を指定します。
3. 複数拡張子にしたい場合は通知を分けます。

## 手順 4: 宛先にLambdaを選択
1. Destination typeで `Lambda function` を選びます。
2. `mememaker-processor-lambda` を指定します。
3. 保存します。

## 手順 5: 権限の自動付与を確認
1. 保存時にLambda invoke権限が追加されます。
2. 失敗する場合はLambda側の`Permissions`でS3呼び出し許可を確認します。

## 動作確認
1. Input_Bucketの `uploads/` に任意画像をアップロードします。
2. CloudWatch LogsでProcessor Lambdaの実行ログを確認します。
3. Output_Bucketの `memes/` に出力があることを確認します。

## 失敗時の切り分け
1. Lambdaが起動しない
	- Event notificationのPrefix/Suffix条件を見直します。
2. 起動するが失敗する
	- Step 4の環境変数とStep 5のPillow配置を確認します。
3. 無限実行になる
	- Outputを書き戻していないか確認します。
