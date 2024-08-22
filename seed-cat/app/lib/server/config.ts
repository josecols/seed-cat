export function cloudStorageSupport() {
  return Boolean(
    process.env.GCS_BUCKET && process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

export function localMTInference() {
  return !process.env.HUGGINGFACE_TOKEN
}
