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
      route("/login", "routes/login/login.tsx");
      route("/login/oauth", "routes/login/oauth.tsx");
      route("/login/logout", "routes/login/logout.tsx");
      route("/login/register", "routes/login/register.tsx");
      route("/login/discord/callback", "routes/login/discord.callback.tsx");
    });
  },
};
