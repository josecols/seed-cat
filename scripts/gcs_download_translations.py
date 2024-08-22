import argparse
from concurrent.futures import ThreadPoolExecutor

from google.cloud import storage


def save_translation(blob, filter_range):
    path_parts = blob.name.split("/")
    index = int(path_parts[-2])

    if index < filter_range[0] or index > filter_range[1]:
        return None

    try:
        content = blob.download_as_text()
        print(f"Saved content from {blob.name}")
        return content, index
    except Exception as e:
        print(f"Failed to download {blob.name}: {str(e)}")
        return None


def main(bucket_name, prefix, file_size, filter_range):
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)

    blobs = [
        blob
        for blob in bucket.list_blobs(prefix=prefix)
        if blob.name.endswith("translation.txt")
    ]

    print(f"Found {len(blobs)} translation files")

    items = [""] * file_size
    with ThreadPoolExecutor(max_workers=20) as executor:
        results = executor.map(lambda blob: save_translation(blob, filter_range), blobs)
        for result in results:
            if result is not None:
                text, index = result
                items[index - 1] = text

    return items


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Download and combine translation files from Google Cloud Storage."
    )
    parser.add_argument("--prefix", type=str, help="GCS path prefix")
    parser.add_argument("--bucket", type=str, help="GCS bucket name.")
    parser.add_argument(
        "--size", type=int, default=6193, help="Number of lines in corpus."
    )
    parser.add_argument(
        "--range",
        type=int,
        nargs=2,
        default=(1, 6193),
        help="Range of indices to process (inclusive).",
    )

    args = parser.parse_args()

    translations = main(args.bucket, f"{args.prefix}/", args.size, tuple(args.range))

    with open("corpus.txt", "w") as f:
        for translation in translations:
            f.write(f"{translation}\n")
