# Step 4: Processor_Lambda を作成

この手順では、Input_Bucket にアップロードされた画像へスタンプを合成する Lambda を作成します。

## 目的
1. アップロードされた画像を自動処理する。
2. 合成済み画像を Output_Bucket に保存する。

## 事前準備
1. Input_Bucket と Output_Bucket があること。
2. Stamp_Image を用意しておくこと。
3. LabRole が使えること。

## Lambda の基本設定
1. ランタイムは Python 3.12 にします。
2. 実行ロールは LabRole を使います。
3. タイムアウトは画像サイズに応じて少し長めにします。
4. メモリは 512MB 前後から始めると安定しやすいです。

## 環境変数
1. `OUTPUT_BUCKET`
2. `STAMP_PATH=/var/task/stamp.png`

## 実装の流れ
1. S3イベントから Input_Bucket と object key を受け取ります。
2. Input_Bucket から画像を読み込みます。
3. Pillow で画像を開きます。
4. stamp.png を画像に重ねます。
5. Output_Bucket の `memes/` 以下に保存します。

## 無限ループ防止
1. 書き込み先は必ず Output_Bucket にします。
2. Input_Bucket に書き戻さないようにします。
3. Event Notification は Input_Bucket のみ対象にします。

## エラーハンドリング
1. 画像の読み込み失敗を try/except で捕捉します。
2. 合成に失敗したら CloudWatch Logs に記録します。
3. 例外時は処理を終了します。

## 確認ポイント
1. 手動テストで画像を合成できる。
2. 出力先が Output_Bucket になっている。
3. CloudWatch Logs でエラーを追える。

## よくあるミス
1. stamp.png の配置場所が違う。
2. Output_Bucket 名の環境変数が間違っている。
3. Input_Bucket に書き戻してしまい、再起動ループになる。
