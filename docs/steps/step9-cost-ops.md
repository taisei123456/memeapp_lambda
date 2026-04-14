# Step 9: コスト最適化と運用手順

このステップでは、Learner Labで無駄課金を防ぎながら
運用しやすい状態に整えます。

## このステップのゴール
1. 使っていないリソースを残さない。
2. ログと画像の増加を制御する。
3. 障害時に最短で復旧できる。

## 対策 1: Lambda設定を最小に保つ
1. Signer Lambda
	- Memory: 128MB
	- Timeout: 10秒
2. Processor Lambda
	- Memory: 512MBから開始
	- Timeout: 30秒
3. 実測で不足時のみ段階的に増やします。

## 対策 2: S3ライフサイクルを設定
1. Input_Bucket
	- `uploads/` を7日で削除
2. Output_Bucket
	- `memes/` を7日または30日で削除
3. 検証データを自動で掃除します。

## 対策 3: CloudWatch Logs保持期間
1. `mememaker-signer-lambda` のログ保持を7日に設定
2. `mememaker-processor-lambda` のログ保持を7日に設定
3. 無制限保持を避けます。

## 対策 4: Function URLの公開最小化
1. CORSのAllowed originsをFrontend URLのみに限定
2. 不要になったFunction URLは削除
3. 学習終了時はLambdaごと削除してもよい

## 対策 5: 月次チェックリスト
1. S3容量の確認
2. Lambda実行回数の確認
3. エラー率の確認
4. 不要ファイルの削除

## 障害時の運用順序
1. フロントエラー表示を確認
2. Signer Lambdaログを確認
3. Processor Lambdaログを確認
4. Input/Outputバケットの実データを確認

## 終了時のクリーンアップ
1. Input/Output画像を削除
2. 不要なLambda関数を削除
3. 不要なS3バケットを削除
4. 課金対象が残っていないことを確認
