// app/services/auth.server.ts
import { Authenticator, AuthorizationError } from "remix-auth";
import { sessionStorage } from "./session.server";
import { FormStrategy } from "remix-auth-form";
import prisma from "~/db.server";
import { UserAuth } from "./user.server.ts";
import { DiscordStrategy } from "remix-auth-discord";
import { ossFileUrl } from "~/utils/utils.server";
import { QQStrategy } from "~/utils/oauth/qq";
import { oauth_type } from "@prisma/client";

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export let authenticator = new Authenticator<UserAuth>(sessionStorage);

// Tell the Authenticator to use the form strategy
authenticator.use(
  new FormStrategy(async ({ form }) => {
    let username = form.get("username");
    if (!username) {
      throw new AuthorizationError("User is not found");
    }
    const user = await prisma.user.findUnique({
      where: { username: username.toString() },
      select: { id: true, username: true, avatar: true },
    });
    if (!user) {
      throw new AuthorizationError("User is not found");
    }
    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
    } as UserAuth;
  }),
  // each strategy has a name and can be changed to use another one
  // same strategy multiple times, especially useful for the OAuth2 strategy.
  "user-pass"
);

export async function oauthVerify(
  request: Request,
  openid: string,
  type: oauth_type,
  options: {
    displayName?: string;
    email?: string;
    photo?: string;
  }
): Promise<UserAuth> {
  const loginUser = await authenticator.isAuthenticated(request);
  if (loginUser) {
    // 登录用户绑定
    const oauth = await prisma.oauth.findFirst({
      where: { openid: openid, type: type },
    });
    if (oauth) {
      throw new AuthorizationError("User is already bound");
    }
    const oauthUser = await prisma.oauth.findFirst({
      where: { user_id: loginUser.id, type: type },
    });
    if (oauthUser) {
      throw new AuthorizationError("User is already bound");
    }
    await prisma.oauth.create({
      data: {
        openid: openid,
        type: type,
        user_id: loginUser.id,
      },
    });
    return loginUser;
  }
  // 查询用户是否注册
  const oauth = await prisma.oauth.findFirst({
    where: { openid: openid, type: type },
  });
  if (oauth) {
    const user = await prisma.user.findUnique({
      where: { id: oauth.user_id },
      select: { id: true, username: true, avatar: true },
    });
    if (!user) {
      throw new AuthorizationError("User is not found");
    }
    return {
      id: user.id,
      username: user.username,
      avatar: ossFileUrl(user.avatar),
    };
  }
  // 创建用户
  let username =
    options.displayName || "球友" + Math.floor(Math.random() * 899999) + 100000;
  const exist = await prisma.user.findFirst({ where: { username } });
  if (exist) {
    // 加上随机数
    username += Math.floor(Math.random() * 899) + 100;
  }
  if (options.email) {
    let email = options.email;
    // 根据email搜索并绑定
    const userByEmail = await prisma.user.findFirst({ where: { email } });
    if (userByEmail) {
      await prisma.oauth.create({
        data: {
          openid: openid,
          type: type,
          user_id: userByEmail.id,
        },
      });
      return {
        id: userByEmail.id,
        username: userByEmail.username,
        avatar: ossFileUrl(userByEmail.avatar),
      };
    }
  }
  // 创建新号
  const user = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username,
        email: options.email,
        password: "",
      },
    });
    await tx.oauth.create({
      data: {
        openid: openid,
        type: type,
        user_id: user.id,
      },
    });
    return user;
  });
  return {
    id: user.id,
    username: user.username,
    avatar: ossFileUrl(user.avatar),
  };
}

export const discordStrategy = new DiscordStrategy(
  {
    clientID: process.env.DISCORD_OAUTH2_CLIENT_ID!,
    clientSecret: process.env.DISCORD_OAUTH2_CLIENT_SECRET!,
    callbackURL: process.env.APP_DOMAIN + "/login/discord/callback",
    // Provide all the scopes you want as an array
    scope: ["identify", "email", "guilds"],
  },
  async ({
    accessToken,
    refreshToken,
    extraParams,
    profile,
    request,
  }): Promise<UserAuth> => {
    return oauthVerify(request, profile.id, oauth_type.discord, {
      displayName: profile.displayName,
      email: profile.emails?.[0].value,
      photo: profile.photos?.[0].value,
    });
  }
);

authenticator.use(discordStrategy, "discord");

export const qqStrategy = new QQStrategy(
  {
    clientID: process.env.QQ_OAUTH2_CLIENT_ID!,
    clientSecret: process.env.QQ_OAUTH2_CLIENT_SECRET!,
    callbackURL: process.env.APP_DOMAIN + "/login/qq/callback",
  },
  async ({
    accessToken,
    refreshToken,
    extraParams,
    profile,
    request,
  }): Promise<UserAuth> => {
    return oauthVerify(request, profile.id, oauth_type.qq, {
      displayName: profile.displayName,
      photo: profile.photos?.[0].value,
    });
  }
);
authenticator.use(qqStrategy, "qq");
