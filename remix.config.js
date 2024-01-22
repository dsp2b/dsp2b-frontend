/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  ignoredRouteFiles: ["**/.*"],
  serverModuleFormat: "cjs",
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // publicPath: "/build/",
  // serverBuildPath: "build/index.js",
  // publicPath: "/build/",
  routes: (defineRoutes) => {
    // If you need to do async work, do it before calling `defineRoutes`, we use
    // the call stack of `route` inside to set nesting.

    return defineRoutes((route) => {
      route("$lng/login", "routes/$lng.login/login.tsx");
      route("$lng/login/register", "routes/$lng.login/register.tsx");
      route("login/logout", "routes/$lng.login/logout.tsx");
      route("login/oauth", "routes/$lng.login/oauth.tsx");
      route("login/discord/callback", "routes/$lng.login/discord.callback.tsx");
    });
  },
};
