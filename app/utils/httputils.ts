import { json } from "@remix-run/node";
import { CodeError } from "./errcode";
import i18next from "~/i18next.server";

export async function handleResp(req: Request, data: any) {
  if (data instanceof CodeError) {
    const t = await i18next.getFixedT(req, "err_code");
    return json({
      code: data.code,
      msg: t(data.code.toString()),
    });
  }
  return data;
}

export async function success() {
  return json({
    code: 0,
    msg: "success",
  });
}
