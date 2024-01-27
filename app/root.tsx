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
  useLocation,
  useNavigate,
} from "@remix-run/react";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import MainLayout from "./components/layout/main";
import { StyleProvider } from "@ant-design/cssinjs";
import appCss from "./styles/app.css";
import i18next from "./i18next.server";
import { useTranslation } from "react-i18next";
import { useChangeLanguage, useLocale } from "remix-i18next";
import { UserContext } from "./context-manager";
import { useState } from "react";
import { parseCookie } from "./utils/cookie";
import { authenticator } from "./services/auth.server";
import { ConfigProvider, theme } from "antd";
import NavigationProcess from "./components/NavigationProcess/NavigationProcess";
import prisma from "./db.server";
import { UserAuth } from "./services/user.server.ts";
import { ossFileUrl } from "./utils/utils.server";
import { getLocale } from "./utils/i18n";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appCss },
  { rel: "stylesheet", href: "/styles/antd.min.css" },
];

export const loader: LoaderFunction = async ({ request }) => {
  // 根据路径设置语言
  let locale = getLocale(request);
  if (!locale) {
    locale = await i18next.getLocale(request);
  }
  const cookieHeader = request.headers.get("Cookie");
  let darkMode = "";
  let styleMode = "";
  if (cookieHeader) {
    const cookie = parseCookie(cookieHeader);
    darkMode = cookie.darkMode ? cookie.darkMode : "";
    styleMode = cookie.styleMode ? cookie.styleMode : "";
  }
  let user: UserAuth | null = await authenticator.isAuthenticated(request);
  const t = await i18next.getFixedT(locale || "en");
  if (user) {
    const m = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        username: true,
        avatar: true,
      },
    });
    if (!m) {
      user = null;
    } else {
      user.avatar = ossFileUrl(m.avatar);
    }
  }

  return json({
    locale,
    darkMode: darkMode || "light",
    styleMode: styleMode || "auto",
    user,
    i18n: {
      home_subtitle: t("home_subtitle"),
      home_page_description: t("home_page_description"),
      home_page_keyword: t("home_page_keyword"),
    },
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: "DSP2B - " + data.i18n.home_subtitle }];
};

export let handle = {
  // In the handle export, we can add a i18n key with namespaces our route
  // will need to load. This key can be a single string or an array of strings.
  // TIP: In most cases, you should set this to your defaultNS from your i18n config
  // or if you did not set one, set it to the i18next default namespace "translation"
  i18n: "common",
};

export default function App() {
  const loaderData = useLoaderData<typeof loader>();
  const { locale, darkMode, styleMode, user } = loaderData;
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const [userContext, setUserContext] = useState({
    locale,
    darkMode,
    styleMode,
    user,
  });
  const navigate = useNavigate();

  useChangeLanguage(userContext.locale);

  dayjs.locale(locale.toLocaleLowerCase());
  dayjs.extend(relativeTime);

  return (
    <html lang={locale} dir={i18n.dir()}>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        ></meta>
        <Meta />
        <meta
          name="description"
          content={loaderData.i18n.home_page_description}
        />
        <meta name="keywords" content={loaderData.i18n.home_page_keyword} />
        <Links />
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-ZDGXSPENDT"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          
            gtag('config', 'G-ZDGXSPENDT');`,
          }}
        />
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
                    navigate(
                      {
                        pathname: location.pathname.replace(
                          "/" + userContext.locale,
                          "/" + param.locale
                        ),
                      },
                      { replace: true }
                    );
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
