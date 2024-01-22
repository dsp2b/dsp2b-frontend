import { StrategyVerifyCallback } from "remix-auth";
import {
  DiscordExtraParams,
  DiscordProfile,
  DiscordScope,
} from "remix-auth-discord";
import {
  OAuth2Strategy,
  OAuth2Profile,
  OAuth2StrategyVerifyParams,
} from "remix-auth-oauth2";

export interface QQProfile extends OAuth2Profile {}

export type QQScope = "";

export interface QQExtraParams
  extends Record<string, Array<QQScope> | string | number> {}

export class QQStrategy<User> extends OAuth2Strategy<
  User,
  QQProfile,
  QQExtraParams
> {
  constructor(
    options: {
      clientID: string;
      clientSecret: string;
      callbackURL: string;
    },
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<QQProfile, QQExtraParams>
    >
  ) {
    super(
      {
        authorizationURL: "https://graph.qq.com/oauth2.0/authorize",
        tokenURL: "https://graph.qq.com/oauth2.0/token",
        clientID: options.clientID,
        clientSecret: options.clientSecret,
        callbackURL: options.callbackURL,
        scope: "get_user_info",
      },
      verify
    );
  }
}
