# Step 2: Signer Lambdaを作る

このステップでは、フロントに返すPresigned URLを発行するLambdaを作成します。
ブラウザにAWS資格情報を渡さない構成の中核です。

## このステップのゴール
1. `GET`呼び出しで `uploadUrl` と `resultUrl` を返せる。
2. `fileName` と `contentType` を受け取り、拡張子を安全に処理できる。
3. エラー時にJSONで原因を返せる。

## 先に決める値
1. 関数名: `mememaker-signer-lambda`
2. ランタイム: Python 3.12
3. 環境変数
   - `INPUT_BUCKET`
   - `OUTPUT_BUCKET`
   - `PRESIGNED_EXPIRES=300`

## IAM権限の確認
1. Signer Lambdaの実行ロールには、Input_Bucket への `s3:PutObject` を許可します。
2. Presigned URL はそのロール権限で署名されるため、権限不足だとPUT時に失敗します。
3. 必要に応じて `s3:AbortMultipartUpload` などを追加します。

## 手順 1: Lambda関数を作成
1. Lambdaコンソールで `Create function` を押します。
2. `Author from scratch` を選びます。
3. 名前を `mememaker-signer-lambda` にします。
4. Runtime を `Python 3.12` にします。
5. Execution role は LabRole を選びます。

## 手順 2: コードを貼り付けてデプロイ
`lambda_function.py` を次に置き換えます。

```python
import json
import logging
import os
import re
import uuid

import boto3
from botocore.config import Config


logger = logging.getLogger()
logger.setLevel(logging.INFO)

INPUT_BUCKET = os.environ["INPUT_BUCKET"].strip()
OUTPUT_BUCKET = os.environ["OUTPUT_BUCKET"].strip()
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
PRESIGNED_EXPIRES = int(os.environ.get("PRESIGNED_EXPIRES", "300"))

if not INPUT_BUCKET or not OUTPUT_BUCKET:
    raise ValueError("INPUT_BUCKET / OUTPUT_BUCKET must not be empty")

s3 = boto3.client("s3", region_name=AWS_REGION, config=Config(signature_version="s3v4"))


def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "body": json.dumps(body, ensure_ascii=False),
    }


def _safe_extension(file_name: str | None, content_type: str | None) -> str:
    if file_name and "." in file_name:
        ext = file_name.rsplit(".", 1)[-1].lower()
        if re.fullmatch(r"[a-z0-9]{1,8}", ext):
            return ext

    mapping = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
        "image/gif": "gif",
    }
    return mapping.get((content_type or "").lower(), "png")


def lambda_handler(event, context):
    try:
        query = (event or {}).get("queryStringParameters") or {}
        file_name = query.get("fileName")
        content_type = query.get("contentType", "image/png")

        ext = _safe_extension(file_name, content_type)
        file_id = str(uuid.uuid4())

        input_key = f"uploads/{file_id}.{ext}"
        output_key = f"memes/{file_id}.{ext}"

        upload_url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": INPUT_BUCKET,
                "Key": input_key,
                "ContentType": content_type,
            },
            ExpiresIn=PRESIGNED_EXPIRES,
            HttpMethod="PUT",
        )

        result_url = f"https://{OUTPUT_BUCKET}.s3.amazonaws.com/{output_key}"

        logger.info("generated", extra={"input_key": input_key, "output_key": output_key})

        return _response(
            200,
            {
                "uploadUrl": upload_url,
                "key": input_key,
                "outputKey": output_key,
                "resultUrl": result_url,
                "contentType": content_type,
                "expiresIn": PRESIGNED_EXPIRES,
            },
        )

    except Exception as e:
        logger.exception("failed to generate presigned url")
        return _response(
            500,
            {
                "message": "Failed to generate presigned URL",
                "error": str(e),
            },
        )
```

## 手順 3: 環境変数を設定
1. `Configuration` > `Environment variables` を開きます。
2. 以下を保存します。
   - `INPUT_BUCKET=0415-mememaker-input-bucket`
   - `OUTPUT_BUCKET=0415-mememaker-output-bucket`
   - `PRESIGNED_EXPIRES=300`
3. `Deploy` を実行します。

## 手順 4: テストイベントを作成
1. Testイベントを新規作成します。
2. 以下を貼り付けて実行します。

```json
{
  "version": "2.0",
  "routeKey": "GET /",
  "rawPath": "/",
  "queryStringParameters": {
    "fileName": "sample.png",
    "contentType": "image/png"
  }
}
```

## 手順 5: 成功判定
1. `statusCode: 200`
2. `body` に `uploadUrl` がある。
3. `body` に `resultUrl` がある。

## よくあるエラーと対処
1. `Invalid bucket name`
   - 環境変数の末尾スペースを削除します。
2. `AccessDenied`
   - 実行ロールとバケットポリシーを再確認します。
3. `SignatureDoesNotMatch` (アップロード時)
   - フロントの `Content-Type` と署名時の `contentType` を一致させます。
