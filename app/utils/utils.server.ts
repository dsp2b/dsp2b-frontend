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
  width: number = 270,
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

export function notifyCollectionUpdate(id: string, blueprint_id?: string) {
  try {
    // 通知更新
    fetch(process.env.RPC_URL! + "/collection/" + id + "/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        blueprint_id: blueprint_id,
      }),
    });
  } catch (e) {
    console.error(e);
  }
}
