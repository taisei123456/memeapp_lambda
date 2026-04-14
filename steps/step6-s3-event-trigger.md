# Step 6: S3イベントトリガー設定

この手順では、Input_Bucket に画像が置かれたら Processor_Lambda が自動で動くようにします。

## 目的
1. ユーザー操作なしで画像合成を開始する。
2. アップロード完了後に自動で Output_Bucket へ保存する。

## 事前準備
1. Processor_Lambda が作成済みであること。
2. Input_Bucket が作成済みであること。

## 手順 1: Event Notification を開く
1. Input_Bucket を開きます。
2. Properties または Event notifications を開きます。
3. 新しいイベント通知を追加します。

## 手順 2: イベント種別を選ぶ
1. Event type は ObjectCreated にします。
2. アップロードされた瞬間に起動するようにします。

## 手順 3: 送信先を設定する
1. 送信先に Processor_Lambda を指定します。
2. 保存します。

## 手順 4: 必要ならファイル種別を絞る
1. suffix フィルタを使うと、png や jpg のみ対象にできます。
2. 例: `.png`, `.jpg`, `.jpeg`

## 重要な注意
1. Processor_Lambda の出力先は Output_Bucket にします。
2. Input_Bucket に戻すと無限ループの原因になります。

## 確認ポイント
1. Input_Bucket にファイルを置くと Lambda が動く。
2. CloudWatch Logs に起動ログが残る。
3. Output_Bucket に合成済み画像が保存される。
