export async function formData(
  request: Request
): Promise<{ [key: string]: string }> {
  return Object.fromEntries(
    (await request.formData()).entries()
  ) as unknown as any;
}

export async function jsonData(request: Request): Promise<any> {
  return await request.json();
}

// MINIO_ENDPOINT=192.168.1.136
// MINIO_PORT=9000
// MINIO_USE_SSL=false
// MINIO_ACCESS_KEY=dsp2b
// MINIO_SECRET_KEY=lfeDlVECKBSXe5tSGvysdLj8mMDAe8QhXRfHz9JX
// MINIO_BUCKET=dev-dsp2b

export function ossFileUrl(path: string) {
  return process.env.MINIO_URL + "/" + process.env.MINIO_BUCKET + "/" + path;
}
