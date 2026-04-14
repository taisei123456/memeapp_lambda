# Step 5: Pillowとstamp.pngをデプロイ

このステップでは、Processor Lambdaで必要なPillowを利用可能にします。
最短で進めるため、まずはLayer方式を推奨します。

## このステップのゴール
1. Processor Lambdaで `from PIL import Image` が成功する。
2. `stamp.png` を `/var/task/stamp.png` で読み込める。

## 方式の選択
1. 方式A: 関数zip同梱
2. 方式B: Lambda Layer（推奨）

## 方式A: 関数zip同梱（最短）
1. 作業フォルダを作成します。
2. `pip install Pillow -t .` を実行します。
3. `lambda_function.py` と `stamp.png` を同じフォルダへ置きます。
4. フォルダ直下をzip化します。
5. Lambdaへアップロードします。

注意:
1. Windowsで作ったwheelがLambda実行環境と一致しない場合があります。
2. その場合は方式Bへ切り替えます。

## 方式B: Layer（安定）
1. Amazon Linux互換環境で以下構成を作成します。
	- `python/` フォルダ配下にPillowをインストール
2. `python` フォルダを含むzipを作ります。
3. Lambda Layerとして公開します。
4. Processor LambdaにLayerをアタッチします。
5. 関数本体zipには `lambda_function.py` と `stamp.png` のみ含めます。

Layer用ディレクトリ例:
1. `python/PIL/...`

## stamp.png配置ルール
1. `stamp.png` は関数zipのルートに置きます。
2. `STAMP_PATH=/var/task/stamp.png` と一致させます。

## 動作確認
1. Processor LambdaのTestを実行します。
2. `No module named PIL` が出ないことを確認します。
3. Output_Bucketに画像が生成されることを確認します。

## 失敗時の切り分け
1. PIL importエラー
	- Layerが未アタッチ、または互換性不一致です。
2. stamp読み込みエラー
	- zip階層が1段ずれている可能性があります。
3. 画像処理時エラー
	- 入力画像形式とPillow依存ライブラリを確認します。
