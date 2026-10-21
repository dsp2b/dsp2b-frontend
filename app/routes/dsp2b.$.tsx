import { LoaderFunction } from "@remix-run/node";
import {
  contentTypeOf,
  createObjectStream,
  statObject,
} from "~/utils/storage.server";

/**
 * 本地文件存储的静态下载路由
 *
 * 对外 URL 形如 https://oss.dsp2b.com/<bucket>/<key>，其中 <bucket> 段由本路由
 * 文件名承载，剩余部分即对象 key。文件从 NFS 卷按同布局直接读取，URL 形状保持
 * 不变，数据库中已保存的 key 无需迁移。
 *
 * 本模块刻意不导出默认组件，Remix 会把它当作 resource route，
 * loader 返回的 Response 原样输出，不会被包进 HTML 文档。
 */
export const loader: LoaderFunction = async ({ params, request }) => {
  const raw = params["*"] || "";
  let key = raw;
  try {
    key = decodeURIComponent(raw);
  } catch (e) {
    // params 已经是解码后的内容时再解码会抛错，忽略并使用原值
  }
  if (!key || key.indexOf("..") !== -1) {
    throw new Response("Not Found", { status: 404 });
  }

  let info;
  try {
    info = await statObject(key);
  } catch (e) {
    throw new Response("Not Found", { status: 404 });
  }
  if (!info) {
    throw new Response("Not Found", { status: 404 });
  }

  const etag = `"${info.size.toString(16)}-${info.mtime.getTime().toString(16)}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { etag } });
  }

  const headers: { [k: string]: string } = {
    "content-type": contentTypeOf(key),
    "content-length": String(info.size),
    "last-modified": info.mtime.toUTCString(),
    etag,
    // key 为 uuid，内容不可变，可长期缓存
    "cache-control": "public, max-age=31536000, immutable",
  };

  return new Response(createObjectStream(key) as any, {
    status: 200,
    headers,
  });
};
