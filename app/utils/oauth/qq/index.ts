import { StrategyVerifyCallback } from "remix-auth";
import {
  OAuth2Strategy,
  OAuth2Profile,
  OAuth2StrategyVerifyParams,
} from "remix-auth-oauth2";

export interface QQProfile extends OAuth2Profile {
  id: string;
}

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

  async userProfile(accessToken: string) {
    // 先获取openid
    let response = await fetch(
      "https://graph.qq.com/oauth2.0/me?access_token=" +
        accessToken +
        "&fmt=json"
    );
    const { openid } = await response.json();
    response = await fetch(
      "https://graph.qq.com/user/get_user_info?access_token=" +
        accessToken +
        "&openid=" +
        openid +
        "&oauth_consumer_key=" +
        this.clientID
    );
    const { nickname, figureurl_qq_2 } = await response.json();
    const profile = {
      provider: exports.DiscordStrategyDefaultName,
      id: openid,
      displayName: nickname,
      photos: figureurl_qq_2,
    };
    return profile;
  }

  async getAccessToken(response: Response) {
    const data = await response.text();
    const [access_token, expires_in, refresh_token] = data.split("&");
    return {
      accessToken: access_token.split("=")[1],
      refreshToken: refresh_token.split("=")[1],
      extraParams: {},
    };
  }
}
