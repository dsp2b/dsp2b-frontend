import { LoaderFunction, json, redirect } from "@remix-run/node";
import { ErrUser } from "~/code/user";
import prisma from "~/db.server";
import { authenticator, discordStrategy } from "~/services/auth.server";
import { errBadRequest } from "~/utils/errcode";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  switch (url.searchParams.get("type")) {
    case "discord":
      const user = await authenticator.isAuthenticated(request);
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
  }
  return json({ code: 400, msg: "type is required" }, { status: 400 });
};
