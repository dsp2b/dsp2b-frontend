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
    /^date-fns\/locale/,
  ],
};
