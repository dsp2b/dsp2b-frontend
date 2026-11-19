import type { LoaderFunctionArgs } from "@remix-run/node";
import prisma from "~/db.server";
import { allowedOrigin, isValidBlueprintId } from "~/utils/cors";

const corsHeaders = (request: Request) => {
  const headers: Record<string, string> = { Vary: "Origin" };
  const origin = allowedOrigin(request.headers.get("Origin"));
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
};

const jsonResponse = (
  request: Request,
  body: unknown,
  status: number,
  extra: Record<string, string> = {}
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request),
      ...extra,
    },
  });

// GET /open-api/blueprint/:id  只读返回蓝图代码，供蓝图预览编辑器使用
// 注意不能放在 /api 下：生产 ingress 把 www.dsp2b.com/api 整个前缀转给了 dsp2b-go
// OPTIONS 预检在此 loader 中处理（resource route 无 action 时 OPTIONS 走 loader）
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders(request),
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  const id = params["id"];
  if (!isValidBlueprintId(id)) {
    return jsonResponse(request, { error: "not_found" }, 404);
  }
  try {
    const blueprint = await prisma.blueprint.findUnique({
      where: { id },
      select: { id: true, title: true, blueprint: true },
    });
    if (!blueprint) {
      return jsonResponse(request, { error: "not_found" }, 404);
    }
    return jsonResponse(
      request,
      {
        id: blueprint.id,
        title: blueprint.title,
        blueprint: blueprint.blueprint,
      },
      200,
      { "Cache-Control": "public, max-age=300" }
    );
  } catch (e) {
    console.error("open-api.blueprint.$id", e);
    return jsonResponse(request, { error: "server_error" }, 500);
  }
};
