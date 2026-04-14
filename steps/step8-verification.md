# Step 8: 受け入れテストを実施

このステップでは、システム全体をE2Eで確認します。
各サービスが正しい順序で動いていることを判定します。

## このステップのゴール
1. アップロードから表示までを連続で成功させる。
2. 失敗時の原因が特定できる。

## E2Eテスト観点
1. Frontend表示
2. Signer Lambda応答
3. Input_Bucket保存
4. Processor Lambda起動
5. Output_Bucket生成
6. フロント表示完了

## 手順 1: 正常系テスト
1. Frontend Website endpointを開きます。
2. Function URLを設定します。
3. PNG画像を1枚アップロードします。
4. 結果表示まで待ちます。

成功条件:
1. ステータスがエラーにならない。
2. 結果画像が画面に表示される。

## 手順 2: S3保存確認
1. Input_Bucketの `uploads/` に元画像がある。
2. Output_Bucketの `memes/` に合成画像がある。

## 手順 3: CloudWatchログ確認
1. `mememaker-signer-lambda` の実行ログがある。
2. `mememaker-processor-lambda` の実行ログがある。
3. 例外スタックが出ていない。

## 手順 4: 異常系テスト
1. Function URLをわざと間違える。
2. 画像未選択で送信する。
3. 0バイト画像など不正入力で試す。

成功条件:
1. UIにエラーが表示される。
2. ブラウザコンソールまたはCloudWatchで原因が追える。

## 最終判定
1. 正常系が連続3回成功する。
2. 異常系で原因を特定できる。
3. 再現手順を説明できる。
