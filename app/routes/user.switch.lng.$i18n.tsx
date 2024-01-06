import { LoaderFunction, json } from "@remix-run/node";
import { langCookie } from "~/i18next.server";

// 切换语言
export const loader: LoaderFunction = async ({ params }) => {
  const lng = params.i18n;
  return json(
    {},
    {
      headers: {
        "Set-Cookie": await langCookie.serialize(lng),
      },
    }
  );
};
