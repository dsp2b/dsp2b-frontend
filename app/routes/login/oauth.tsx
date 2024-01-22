import { LoaderFunction, json, redirect } from "@remix-run/node";
import { ErrUser } from "~/code/user";
import prisma from "~/db.server";
import { authenticator, discordStrategy } from "~/services/auth.server";
import { errBadRequest } from "~/utils/errcode";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const user = await authenticator.isAuthenticated(request);
  switch (url.searchParams.get("type")) {
    case "discord":
      if (user) {
        // 判断是否绑定了discord
        const discord = await prisma.oauth.findUnique({
          where: {
            user_id_type: {
              user_id: user.id,
              type: "discord",
            },
          },
        });
        if (discord) {
          return errBadRequest(request, ErrUser.BindDiscord);
        }
        return redirect(
          (
            (discordStrategy as any).getAuthorizationURL(request, "") as URL
          ).toString()
        );
      }
      return authenticator.authenticate("discord", request);
    case "qq":
      if (user) {
        // 判断是否绑定了qq
        const discord = await prisma.oauth.findUnique({
          where: {
            user_id_type: {
              user_id: user.id,
              type: "qq",
            },
          },
        });
        if (discord) {
          return errBadRequest(request, ErrUser.BindDiscord);
        }
        return redirect(
          (
            (discordStrategy as any).getAuthorizationURL(request, "") as URL
          ).toString()
        );
      }
      return authenticator.authenticate("qq", request);
  }
  return json({ code: 400, msg: "type is required" }, { status: 400 });
};
