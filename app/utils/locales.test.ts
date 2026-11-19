import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { localeLoadPath } from "./locales.ts";

test("localeLoadPath 带构建版本号，部署后浏览器不会继续用旧翻译缓存", () => {
  assert.equal(
    localeLoadPath("d39df3c2"),
    "/locales/{{lng}}/{{ns}}.json?v=d39df3c2"
  );
  assert.equal(localeLoadPath(undefined), "/locales/{{lng}}/{{ns}}.json");
  assert.equal(localeLoadPath("a b"), "/locales/{{lng}}/{{ns}}.json?v=a%20b");
});

test("Remix 路由不得占用 /api 前缀（生产 ingress 把 /api 整个转给 dsp2b-go）", () => {
  const routes = readdirSync("app/routes") // 在仓库根目录运行 node --test;
  assert.deepEqual(
    routes.filter((f) => f === "api" || f.startsWith("api.")),
    []
  );
  assert.ok(routes.includes("open-api.blueprint.$id.ts"));
});
