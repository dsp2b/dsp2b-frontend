import { LoaderFunction, redirect } from "@remix-run/node";
import { authenticator, qqStrategy } from "~/services/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  // 判断是否登录
  const loginUser = await authenticator.isAuthenticated(request);
  if (loginUser) {
    // 判断是否有code,有则开始绑定
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const oauth2Strategy = qqStrategy as any;
    if (code) {
      // Get the access token
      let callbackURL = oauth2Strategy.getCallbackURL(request);
      let params = new URLSearchParams(oauth2Strategy.tokenParams());
      params.set("grant_type", "authorization_code");
      params.set("redirect_uri", callbackURL.toString());
      let { accessToken, refreshToken, extraParams } =
        await oauth2Strategy.fetchAccessToken(code, params);
      // Get the profile
      let profile = await oauth2Strategy.userProfile(accessToken, extraParams);
      // Verify the user and return it, or redirect
      const user = await oauth2Strategy.verify({
        accessToken,
        refreshToken,
        extraParams,
        profile,
        request,
      });
      if (user) {
        return redirect("/");
      }
      return redirect("/login");
    }
  }
  return authenticator.authenticate("qq", request, {
    successRedirect: "/",
    failureRedirect: "/login",
  });
};
