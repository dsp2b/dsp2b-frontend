export async function formData(
  request: Request
): Promise<{ [key: string]: string }> {
  return Object.fromEntries(
    (await request.formData()).entries()
  ) as unknown as any;
}

export async function jsonData<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

export function ossFileUrl(path?: string | null) {
  if (!path) {
    return "";
  }
  return process.env.MINIO_URL + "/" + process.env.MINIO_BUCKET + "/" + path;
}

export function thumbnailUrl(
  path?: string | null,
  width: number = 280,
  height: number = 200
) {
  if (!path) {
    return "";
  }
  return (
    process.env.API_URL +
    "/image/thumbnail/" +
    width +
    "/" +
    height +
    "/" +
    path
  );
}
