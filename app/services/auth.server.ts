// app/services/auth.server.ts
import { Authenticator, AuthorizationError } from "remix-auth";
import { sessionStorage } from "./session.server";
import { FormStrategy } from "remix-auth-form";
import prisma from "~/db.server";
import { UserAuth, UserSvc } from "./user.server.ts";
import type { DiscordProfile, PartialDiscordGuild } from "remix-auth-discord";
import { DiscordStrategy } from "remix-auth-discord";
import { user } from "@prisma/client";

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
      select: { id: true, username: true },
    });
    if (!user) {
      throw new AuthorizationError("User is not found");
    }
    return {
      id: user.id,
      username: user.username,
    } as UserAuth;
  }),
  // each strategy has a name and can be changed to use another one
  // same strategy multiple times, especially useful for the OAuth2 strategy.
  "user-pass"
);

const discordStrategy = new DiscordStrategy(
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
  }): Promise<UserAuth> => {
    // 查询用户是否注册
    const oauth = await prisma.oauth.findFirst({
      where: { openid: profile.id, type: "discord" },
    });
    if (oauth) {
      const user = await prisma.user.findUnique({
        where: { id: oauth.user_id },
        select: { id: true, username: true },
      });
      if (!user) {
        throw new AuthorizationError("User is not found");
      }
      return {
        id: user.id,
        username: user.username,
      };
    }
    // 创建用户
    let username = profile.displayName;
    const exist = await prisma.user.findFirst({ where: { username } });
    if (exist) {
      // 加上随机数
      username += Math.floor(Math.random() * 899) + 100;
    }
    if (!profile.emails) {
      throw new AuthorizationError("Email is not found");
    }
    let email = profile.emails[0].value;
    // 根据email搜索并绑定
    const userByEmail = await prisma.user.findFirst({ where: { email } });
    if (userByEmail) {
      await prisma.oauth.create({
        data: {
          openid: profile.id,
          type: "discord",
          user_id: userByEmail.id,
        },
      });
      return {
        id: userByEmail.id,
        username: userByEmail.username,
      };
    }
    // 创建新号
    const user = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          email,
          password: "",
        },
      });
      await tx.oauth.create({
        data: {
          openid: profile.id,
          type: "discord",
          user_id: user.id,
        },
      });
      return user;
    });
    return {
      id: user.id,
      username: user.username,
    };
  }
);

authenticator.use(discordStrategy, "discord");