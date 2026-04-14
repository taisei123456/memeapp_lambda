# Step 4: Processor Lambdaを作る

このステップでは、Input_Bucketに置かれた画像にスタンプを合成し、
Output_Bucketへ保存するLambdaを作成します。

## このステップのゴール
1. S3イベントを受け取って画像処理できる。
2. `memes/` 配下へ合成画像を書き込める。
3. エラー時にCloudWatchで追跡できる。
4. Pillow未導入の段階では、ここではコード配置まで完了すればよい。

## 手順 1: Lambda関数を作成
1. Lambdaで新規作成します。
2. 関数名を `mememaker-processor-lambda` にします。
3. Runtime を `Python 3.12` にします。
4. 実行ロールをLabRoleにします。
5. Timeoutを `30 sec`、Memoryを `512 MB` で開始します。

## 手順 2: 環境変数を設定
1. `OUTPUT_BUCKET=0415-mememaker-output-bucket`
2. `STAMP_PATH=/var/task/stamp.png`
3. `OUTPUT_PREFIX=memes/`

## 手順 3: コードを配置
`lambda_function.py` を次で置き換えます。

```python
import io
import logging
import os
from urllib.parse import unquote_plus

import boto3
from PIL import Image


logger = logging.getLogger()
logger.setLevel(logging.INFO)

OUTPUT_BUCKET = os.environ["OUTPUT_BUCKET"].strip()
STAMP_PATH = os.environ.get("STAMP_PATH", "/var/task/stamp.png")
OUTPUT_PREFIX = os.environ.get("OUTPUT_PREFIX", "memes/")

if not OUTPUT_BUCKET:
    raise ValueError("OUTPUT_BUCKET must not be empty")

if not OUTPUT_PREFIX.endswith("/"):
    OUTPUT_PREFIX = f"{OUTPUT_PREFIX}/"

s3 = boto3.client("s3")


def _output_key(input_key: str) -> str:
    name = input_key.rsplit("/", 1)[-1]
    return f"{OUTPUT_PREFIX}{name}"


def _merge(base_img: Image.Image, stamp_img: Image.Image) -> Image.Image:
    base = base_img.convert("RGBA")
    stamp = stamp_img.convert("RGBA")

    target_w = max(80, int(base.width * 0.25))
    ratio = target_w / stamp.width
    target_h = max(40, int(stamp.height * ratio))
    stamp = stamp.resize((target_w, target_h), Image.Resampling.LANCZOS)

    margin = max(12, int(min(base.width, base.height) * 0.03))
    x = base.width - stamp.width - margin
    y = base.height - stamp.height - margin

    base.alpha_composite(stamp, (x, y))
    return base.convert("RGB")


def lambda_handler(event, context):
    records = (event or {}).get("Records", [])
    if not records:
        logger.warning("No Records")
        return {"statusCode": 200, "message": "No records"}

    with Image.open(STAMP_PATH) as stamp:
        for record in records:
            src_bucket = record["s3"]["bucket"]["name"]
            src_key = unquote_plus(record["s3"]["object"]["key"])

            logger.info("processing s3://%s/%s", src_bucket, src_key)

            obj = s3.get_object(Bucket=src_bucket, Key=src_key)
            body = obj["Body"].read()

            with Image.open(io.BytesIO(body)) as base:
                merged = _merge(base, stamp)

            out = io.BytesIO()
            merged.save(out, format="JPEG", quality=92)
            out.seek(0)

            dst_key = _output_key(src_key)
            s3.put_object(
                Bucket=OUTPUT_BUCKET,
                Key=dst_key,
                Body=out.getvalue(),
                ContentType="image/jpeg",
                CacheControl="no-cache",
            )

            logger.info("saved s3://%s/%s", OUTPUT_BUCKET, dst_key)

    return {"statusCode": 200, "message": "Processed successfully"}
```

## 手順 4: スタンプ画像を同梱
1. 関数コードと同じzipのルートに `stamp.png` を入れます。
2. `STAMP_PATH` が `/var/task/stamp.png` なので同名で配置します。

## 手順 5: 手動テスト（Step 5 完了後に実施）
1. Testイベントを作成します。
2. 以下を貼り付けます。

```json
{
  "Records": [
    {
      "s3": {
        "bucket": {
          "name": "0415-mememaker-input-bucket"
        },
        "object": {
          "key": "uploads/sample.png"
        }
      }
    }
  ]
}
```

3. Step 5 で Pillow と `stamp.png` の配置が終わってから実行します。
4. `Output_Bucket/memes/` に出力されるか確認します。

## 失敗時の切り分け
1. `No module named PIL`
   - Step 5のPillowデプロイが不足しています。
2. `No such file or directory: /var/task/stamp.png`
   - zip同梱位置とファイル名を確認します。
3. 出力がない
   - `OUTPUT_BUCKET` とロール権限を確認します。
