// 客户端翻译文件地址。/locales 的响应带 max-age 缓存且文件名不含哈希，
// 用构建版本号做查询参数，部署新翻译后浏览器会重新拉取。
export const localeLoadPath = (version?: string) =>
  "/locales/{{lng}}/{{ns}}.json" +
  (version ? "?v=" + encodeURIComponent(version) : "");
