import { type LinksFunction, type LoaderFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
  useLoaderData,
} from "@remix-run/react";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import MainLayout from "./components/layout/main";
import { StyleProvider } from "@ant-design/cssinjs";
import appCss from "./styles/app.css";
import i18next from "./i18next.server";
import { useTranslation } from "react-i18next";
import { useChangeLanguage } from "remix-i18next";
import { UserContext } from "./context-manager";
import { useState } from "react";
import { parseCookie } from "./utils/cookie";
import { authenticator } from "./services/auth.server";
import { ConfigProvider, theme } from "antd";
import NavigationProcess from "./components/NavigationProcess/NavigationProcess";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appCss },
  { rel: "stylesheet", href: "/styles/antd.min.css" },
];

export const loader: LoaderFunction = async ({ request }) => {
  const locale = await i18next.getLocale(request);
  const cookieHeader = request.headers.get("Cookie");
  let darkMode = "";
  let styleMode = "";
  if (cookieHeader) {
    const cookie = parseCookie(cookieHeader);
    darkMode = cookie.darkMode ? cookie.darkMode : "";
    styleMode = cookie.styleMode ? cookie.styleMode : "";
  }
  const user = await authenticator.isAuthenticated(request);
  const t = await i18next.getFixedT(locale || "en");

  return json({
    locale,
    darkMode: darkMode || "light",
    styleMode: styleMode || "auto",
    user: user,
    home_subtitle: t("home_subtitle"),
    home_page_description: t("home_page_description"),
  });
};

export const meta: MetaFunction = ({ data }: { data: any }) => {
  return [
    { title: "DSP2B - " + data.home_subtitle },
    {
      name: "description",
      content: data.home_page_description,
    },
    {
      name: "keywords",
      content: "戴森球计划,蓝图,社区",
    },
  ];
};

export default function App() {
  // Get the locale from the loader
  const { locale, darkMode, styleMode, user } = useLoaderData<typeof loader>();

  const { i18n } = useTranslation();

  const [userContext, setUserContext] = useState({
    locale,
    darkMode,
    styleMode,
    user,
  });

  useChangeLanguage(userContext.locale);

  return (
    <html lang={locale} dir={i18n.dir()}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className={userContext.darkMode == "dark" ? "dark" : ""}>
        <ConfigProvider
          locale={userContext.locale == "zh-CN" ? zhCN : enUS}
          theme={{
            algorithm:
              userContext.darkMode == "dark"
                ? theme.darkAlgorithm
                : theme.defaultAlgorithm,
          }}
        >
          <StyleProvider
            hashPriority="high"
            container={global.document && document && document.body}
          >
            <UserContext.Provider
              value={{
                darkMode: userContext.darkMode,
                styleMode: userContext.styleMode,
                locale: userContext.locale,
                user: userContext.user,
              }}
            >
              <NavigationProcess />
              <MainLayout
                locale={userContext.locale}
                onChange={async (param) => {
                  if (param.locale != userContext.locale) {
                    fetch("/user/switch/lng/" + param.locale);
                  }
                  setUserContext({
                    locale: param.locale,
                    darkMode: param.darkMode,
                    styleMode: param.styleMode,
                    user: user,
                  });
                  document.cookie = "darkMode=" + param.darkMode + ";path=/";
                  document.cookie = "styleMode=" + param.styleMode + ";path=/";
                }}
                onLogout={() => {
                  setUserContext({
                    locale: userContext.locale,
                    darkMode: userContext.darkMode,
                    styleMode: userContext.styleMode,
                    user: undefined,
                  });
                }}
              >
                <Outlet />
              </MainLayout>
            </UserContext.Provider>
          </StyleProvider>
        </ConfigProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
