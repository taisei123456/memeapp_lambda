# Step 5: Pillow とスタンプ画像のデプロイ

この手順では、Processor_Lambda が画像合成に使う Pillow と stamp.png を Lambda に載せます。

## 目的
1. Lambda 上で画像加工を動かす。
2. スタンプ画像を関数から参照できるようにする。

## 方法 A: 関数 zip に同梱する
1. Pillow を含めた zip を作成します。
2. `stamp.png` も zip に入れます。
3. その zip を Lambda にアップロードします。

### メリット
1. 構成が単純です。
2. すぐ試しやすいです。

### デメリット
1. zip が大きくなりやすいです。
2. Pillow のビルドで詰まりやすいです。

## 方法 B: Lambda Layer を使う
1. Pillow を Layer 化します。
2. 関数本体には handler と stamp.png を置きます。
3. Layer を Processor_Lambda にアタッチします。

### メリット
1. 関数コードが軽くなります。
2. 再利用しやすいです。

### デメリット
1. Layer の作成手順が少し増えます。

## 推奨
1. 初期は方法 A でもよいです。
2. 安定運用を考えるなら方法 B が扱いやすいです。

## Learner Lab で注意する点
1. Pillow のビルド環境差分で import error が出ることがあります。
2. Amazon Linux 互換環境で Layer を作ると安定しやすいです。
3. Windows ローカルで作るより、Lambda 互換の環境を使う方が安全です。

## 確認ポイント
1. Lambda で Pillow を import できる。
2. stamp.png を読み込める。
3. 画像合成のテストが通る。
