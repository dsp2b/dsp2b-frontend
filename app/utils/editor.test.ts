import test from "node:test";
import assert from "node:assert/strict";
import { EDITOR_URL, buildEditorUrl } from "./editor.ts";
import { allowedOrigin, isValidBlueprintId } from "./cors.ts";

test("buildEditorUrl", () => {
  assert.equal(EDITOR_URL, "https://dsp2b.github.io/dsp_blueprint_editor/");
  assert.equal(buildEditorUrl("abc123"), EDITOR_URL + "?id=abc123");
  assert.equal(buildEditorUrl("a b&c"), EDITOR_URL + "?id=a%20b%26c");
});

test("allowedOrigin", () => {
  for (const o of [
    "https://dsp2b.github.io",
    "http://localhost:5173",
    "http://127.0.0.1:8080",
  ]) {
    assert.equal(allowedOrigin(o), o);
  }
  for (const o of [
    null,
    "",
    "https://evil.com",
    "http://dsp2b.github.io",
    "https://dsp2b.github.io.evil.com",
    "https://dsp2b.github.io:444",
    "http://localhost",
    "http://localhost:80/x",
    "http://localhost:abc",
    "https://localhost:3000",
    "http://localhost.evil.com:3000",
    "http://127.0.0.1.evil.com:80",
  ]) {
    assert.equal(allowedOrigin(o), null, String(o));
  }
});

test("isValidBlueprintId", () => {
  assert.equal(isValidBlueprintId("65a1b2c3d4e5f60718293a4b"), true);
  assert.equal(isValidBlueprintId("xyz"), false);
  assert.equal(isValidBlueprintId("65a1b2c3d4e5f60718293a4"), false);
  assert.equal(isValidBlueprintId(undefined), false);
});
