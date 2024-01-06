/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // publicPath: "/build/",
  // serverBuildPath: "build/index.js",
  future: {},
  serverDependenciesToBundle: [
    /^@douyinfe\/semi-ui/,
    /^@douyinfe\/semi-icons/,
    /^@douyinfe\/semi-illustrations/,
    /^@douyinfe\/semi-foundation/,
    /^lodash/,
    /^date-fns/,
    /^remix-i18next/,
    /^@remixicon\/react/,
    /^date-fns-tz/,
    /^scroll-into-view-if-needed/,
    /^@babel/,
  ],
  routes: (defineRoutes) => {
    // If you need to do async work, do it before calling `defineRoutes`, we use
    // the call stack of `route` inside to set nesting.

    return defineRoutes((route) => {
      route("/login", "routes/login/login.tsx");
      route("/login/logout", "routes/login/logout.tsx");
      route("/login/register", "routes/login/register.tsx");
      route("/login/discord/callback", "routes/login/discord.callback.tsx");
    });
  },
};
