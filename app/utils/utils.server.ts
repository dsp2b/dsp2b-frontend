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

// 文件对外访问路径：/<bucket>/<key>，由 routes/dsp2b.$.tsx 从本地卷直接读取
// 使用根相对路径，无需配置域名，www 与 oss 两个入口都可用
export function ossFileUrl(path?: string | null) {
  if (!path) {
    return "";
  }
  return "/dsp2b/" + path;
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
