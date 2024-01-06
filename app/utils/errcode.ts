import { json } from "@remix-run/node";
import i18next from "~/i18next.server";

export class CodeError extends Error {
  [key: string]: any;

  public code;
  public status;
  public msg: string = "";
  constructor(status: number, code: number) {
    super(code.toString());
    this.status = status;
    this.code = code;
  }
}

export async function errBadRequest(req: Request, code: number) {
  const t = await i18next.getFixedT(req, "err_code");
  return json(
    {
      code,
      msg: t(code.toString()),
    },
    {
      status: 400,
    }
  );
}

export async function errInternalServer(req: Request, code: number) {
  const t = await i18next.getFixedT(req, "err_code");
  return json(
    {
      code,
      msg: t(code.toString()),
    },
    {
      status: 500,
    }
  );
}

export function codeError(status: number, code: number) {
  throw new CodeError(status, code);
}
