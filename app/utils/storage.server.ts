import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

// 本地文件存储
// 目录布局为 <ROOT>/<BUCKET>/<key>，与对外 URL /<BUCKET>/<key> 一一对应
// 存储只有本地磁盘一种实现，路径与桶名固定，不再需要运行时配置
const BUCKET = "dsp2b";
const ROOT = "/data";

export function bucketDir(): string {
  return path.join(ROOT, BUCKET);
}

/**
 * 把对象 key 解析成磁盘绝对路径，并阻止路径穿越
 */
export function resolveKey(key: string): string {
  if (!key) {
    throw new Error("empty key");
  }
  const base = bucketDir();
  const full = path.resolve(base, path.normalize(key));
  if (full !== base && !full.startsWith(base + path.sep)) {
    throw new Error("invalid key");
  }
  return full;
}

const CONTENT_TYPES: { [ext: string]: string } = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".zip": "application/zip",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
};

export function contentTypeOf(key: string): string {
  return CONTENT_TYPES[path.extname(key).toLowerCase()] || "application/octet-stream";
}

export async function putObject(key: string, data: Buffer): Promise<void> {
  const file = resolveKey(key);
  await fsp.mkdir(path.dirname(file), { recursive: true });
  // 先写临时文件再 rename，避免读到半截文件
  const tmp = file + ".tmp-" + process.pid + "-" + Date.now();
  await fsp.writeFile(tmp, data);
  await fsp.rename(tmp, file);
}

export async function statObject(
  key: string
): Promise<{ size: number; mtime: Date } | null> {
  try {
    const st = await fsp.stat(resolveKey(key));
    if (!st.isFile()) {
      return null;
    }
    return { size: st.size, mtime: st.mtime };
  } catch (e: any) {
    if (e && (e.code === "ENOENT" || e.code === "ENOTDIR")) {
      return null;
    }
    throw e;
  }
}

export function createObjectStream(key: string): fs.ReadStream {
  return fs.createReadStream(resolveKey(key));
}
