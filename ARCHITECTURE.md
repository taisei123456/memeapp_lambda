# システム全体図（アーキテクチャ）

## 1. 全体構成

```mermaid
flowchart LR
  U[ユーザー ブラウザ\nindex.html / app.js] -->|1. GET\nfileName, contentType| FURL[Lambda Function URL\nSigner入口]
  FURL --> SL[Signer Lambda\nmememaker-signer-lambda]
  SL -->|2. Presigned URL発行| U

  U -->|3. PUT 画像アップロード| IN[(S3 Input Bucket\nuploads/)]
  IN -->|4. ObjectCreatedイベント| PL[Processor Lambda\nmememaker-processor-lambda]
  PL -->|5. 合成画像を保存| OUT[(S3 Output Bucket\nmemes/)]

  U -->|6. HEAD/GETで確認| OUT
  OUT -->|7. 合成画像を表示| U

  C1[config.js\nSigner URL固定管理] -. 読み込み .-> U
  ST[stamp.png + Pillow] -. 実行時利用 .-> PL
```

## 1.1 シーケンス図（sequenceDiagram）

```mermaid
sequenceDiagram
  autonumber
  participant U as ユーザー/ブラウザ
  participant F as Frontend(S3 Website)
  participant S as Signer Lambda(Function URL)
  participant I as S3 Input Bucket
  participant P as Processor Lambda
  participant O as S3 Output Bucket

  U->>F: 画面を開く
  F->>S: GET /?fileName=...&contentType=...
  S-->>F: uploadUrl, resultUrl, key
  U->>F: 画像を選択して送信
  F->>I: PUT 画像(Presigned URL)
  I-->>P: ObjectCreated イベント
  P->>I: 元画像を取得(GetObject)
  P->>O: 合成画像を保存(PutObject)

  loop 完成までポーリング
    F->>O: HEAD/GET resultUrl
    O-->>F: 200 or 403/404
  end

  F-->>U: 合成画像を表示
```

## 2. コンポーネント責務

- ブラウザ
  - Signerへ問い合わせ
  - Presigned URLでInputへ直接PUT
  - Outputをポーリングして結果表示
- Signer Lambda
  - `uploadUrl` / `resultUrl` / `key` を返却
- Input Bucket
  - 元画像の一時保管（`uploads/`）
- Processor Lambda
  - 画像を読み込み、`stamp.png` を重ねる
  - `memes/` に出力
- Output Bucket
  - 合成後画像の公開配信

## 3. シーケンス（時系列）

1. ブラウザが Function URL に `GET`。
2. Signer Lambda が Presigned URL を返す。
3. ブラウザが Input Bucket へ `PUT`。
4. S3イベントで Processor Lambda 起動。
5. Processor が Output Bucket に保存。
6. ブラウザが Output 側を `HEAD/GET` で確認。
7. 生成完了後、画像を表示。

## 4. 主要設定ポイント

- CORS は Function URL と S3（Input/Output）で整合を取る。
- Event Notification の Prefix は `uploads/`。
- Suffix で拡張子を絞る場合は `.png`/`.jpg`/`.jpeg` の取り扱いに注意。
- Processor Lambda の Runtime と Pillow バイナリ互換を一致させる。
