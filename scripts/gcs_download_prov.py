import argparse
from concurrent.futures import ThreadPoolExecutor

from google.cloud import storage


def save_prov(blob, directory, filter_range):
    path_parts = blob.name.split("/")
    index = int(path_parts[-2])

    if index < filter_range[0] or index > filter_range[1]:
        return None

    try:
        content = blob.download_as_text()
        with open(f"{directory}/{index}.json", "w") as f:
            f.write(content)

        print(f"Saved content from {blob.name}")

    except Exception as e:
        print(f"Failed to download {blob.name}: {str(e)}")
        return None


def main(bucket_name, prefix, directory, filter_range):
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)

    blobs = [
        blob
        for blob in bucket.list_blobs(prefix=f"{prefix}/")
        if blob.name.endswith("prov.json")
    ]

    print(f"Found {len(blobs)} provenance files")

    with ThreadPoolExecutor(max_workers=20) as executor:
        executor.map(lambda blob: save_prov(blob, directory, filter_range), blobs)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Download provenance files from Google Cloud Storage."
    )
    parser.add_argument("--prefix", type=str, help="GCS path prefix.")
    parser.add_argument("--bucket", type=str, help="GCS bucket name.")
    parser.add_argument(
        "--directory",
        type=str,
        default="prov-json",
        help="Local target directory to save files.",
    )
    parser.add_argument(
        "--range",
        type=int,
        nargs=2,
        default=(1, 6193),
        help="Range of indices to process (inclusive).",
    )

    args = parser.parse_args()

    main(args.bucket, args.prefix, args.directory, tuple(args.range))
