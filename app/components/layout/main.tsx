import {
  DesktopOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Link, useMatches, useNavigate } from "@remix-run/react";
import {
  Avatar,
  Button,
  Divider,
  Dropdown,
  Layout,
  Menu,
  Space,
  Typography,
  message,
  theme,
} from "antd";
import { ItemType } from "antd/es/menu/hooks/useItems";
import React, { ReactNode, useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { UserContext } from "~/context-manager";
import { lngMap } from "~/utils/i18n";
import { MoonLineIcon, SunLineIcon } from "~/utils/icon";

const MainLayout: React.FC<{
  onChange: ({
    darkMode,
    styleMode,
    locale,
  }: {
    darkMode: string;
    styleMode: string;
    locale: string;
  }) => void;
  onLogout: () => void;
  locale: string;
  children: ReactNode;
}> = ({ locale, children, onChange, onLogout }) => {
  const { Header, Footer, Content } = Layout;
  const { t } = useTranslation();
  const user = useContext(UserContext);
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const uLocale = "/" + locale;
  const matches = useMatches();
  let selectKey: string[] = [];
  matches.find((val) => {
    switch (val.id) {
      case "routes/$lng._index":
        selectKey = ["home"];
        break;
      case "routes/$lng.collection":
        selectKey = ["collection"];
        break;
      case "routes/$lng.tools":
        selectKey = ["tools"];
        break;
    }
  });

  useEffect(() => {
    if (user.styleMode == "auto") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const isMatch = (match: boolean) => {
        if (match) {
          onChange({
            darkMode: "dark",
            styleMode: "auto",
            locale: locale,
          });
        } else {
          onChange({
            darkMode: "light",
            styleMode: "auto",
            locale: locale,
          });
        }
      };
      const callback = (e: { matches: boolean }) => {
        isMatch(e.matches);
      };
      media.addEventListener("change", callback);
      isMatch(media.matches);
    } else {
      onChange({
        darkMode: user.styleMode || "light",
        styleMode: user.styleMode || "auto",
        locale: locale,
      });
    }
  }, [user.styleMode]);

  const localeList: Array<ItemType> = [];
  for (const [, lng] of Object.entries(lngMap)) {
    for (const [key, value] of Object.entries(lng)) {
      if (!value.hide) {
        // 修改路径为对应的语言
        localeList.push({
          key: key,
          label: <Space>{value.name + "(" + key + ")"}</Space>,
        });
      }
    }
  }

  return (
    <Layout>
      <Header
        className="flex flex-row justify-between"
        style={{
          background: token.colorBgContainer,
          borderBottom: "1px solid " + token.colorBorder,
          boxShadow: "0px 0px 8px " + token.colorBorder,
        }}
      >
        <div className="flex flex-row gap-2 flex-auto items-center">
          <Link to={uLocale} className="flex flex-row gap-2 items-center">
            <Typography.Title level={2} className="!m-0">
              {t("dsp2b_title")}
            </Typography.Title>
            <Typography.Title level={5} className="!m-0">
              {t("dsp2b_subtitle")}
            </Typography.Title>
          </Link>
          <Menu
            mode="horizontal"
            className="!ml-4"
            selectedKeys={selectKey}
            style={{
              width: "300px",
              border: 0,
            }}
            items={[
              {
                key: "home",
                label: <Link to={uLocale}>{t("home")}</Link>,
              },
              {
                key: "collection",
                label: (
                  <Link to={uLocale + "/collection"}>
                    {t("blueprint_collection")}
                  </Link>
                ),
              },
              {
                key: "tools",
                label: <Link to={uLocale + "/tools"}>{t("tools")}</Link>,
              },
            ]}
          />
        </div>
        <Space>
          <Link to={uLocale + "/create/blueprint"}>
            <Button type="primary">{t("publish")}</Button>
          </Link>
          <Dropdown
            menu={{
              onClick: ({ key }) => {
                onChange({
                  darkMode: user.darkMode || "",
                  styleMode: key,
                  locale: locale,
                });
              },
              items: [
                {
                  key: "auto",
                  label: (
                    <Space>
                      <DesktopOutlined />
                      {t("dark_mode_auto")}
                    </Space>
                  ),
                },
                {
                  key: "light",
                  label: (
                    <Space>
                      <SunLineIcon className="text-base cursor-pointer" />
                      {t("dark_mode_light")}
                    </Space>
                  ),
                },
                {
                  key: "dark",
                  label: (
                    <Space>
                      <MoonLineIcon className="text-base cursor-pointer" />
                      {t("dark_mode_dark")}
                    </Space>
                  ),
                },
              ],
            }}
          >
            <Button
              icon={
                user.darkMode == "dark" ? (
                  <MoonLineIcon className="text-base cursor-pointer" />
                ) : (
                  <SunLineIcon className="text-base cursor-pointer" />
                )
              }
            ></Button>
          </Dropdown>
          <Dropdown
            menu={{
              onClick: ({ key }) => {
                onChange({
                  darkMode: user.darkMode || "",
                  styleMode: user.styleMode || "auto",
                  locale: key,
                });
              },
              items: localeList.map((item) => item),
            }}
          >
            <Button icon={<GlobalOutlined />}></Button>
          </Dropdown>
          {user.user ? (
            <Dropdown
              menu={{
                onClick: (info) => {
                  switch (info.key) {
                    case "logout":
                      fetch("/login/logout").then((resp) => {
                        if (resp.status !== 200) {
                          message.warning(t("logout_failed"));
                        } else {
                          message.success(t("logout_success"));
                          onLogout();
                        }
                      });
                  }
                },
                items: [
                  {
                    key: "info",
                    label: (
                      <Link to={uLocale + "/user"}>
                        <Space>
                          <Avatar
                            size="small"
                            src={user.user.avatar || undefined}
                          >
                            {user.user.username.substring(0, 2)}
                          </Avatar>
                          <Space direction="vertical">
                            <Typography.Text>
                              {user.user.username}
                            </Typography.Text>
                          </Space>
                        </Space>
                      </Link>
                    ),
                  },
                  {
                    key: "collection",
                    label: (
                      <Link to={uLocale + "/user/collection"}>
                        <Space>
                          <FolderOpenOutlined />
                          {t("blueprint_collection")}
                        </Space>
                      </Link>
                    ),
                  },
                  {
                    key: "logout",
                    label: (
                      <Space>
                        <LogoutOutlined />
                        {t("logout")}
                      </Space>
                    ),
                  },
                ],
              }}
            >
              <Avatar src={user.user.avatar || undefined}>
                {user.user.username.substring(0, 2)}
              </Avatar>
            </Dropdown>
          ) : (
            <Link to={uLocale + "/login"}>
              <Button style={{ marginRight: 8 }}>{t("login")}</Button>
            </Link>
          )}
        </Space>
      </Header>
      <Content className="w-4/5 m-auto p-4">{children}</Content>
      <Footer
        style={{
          background: token.colorBgContainer,
        }}
      >
        <div className="flex flex-row">
          <div className="flex flex-col items-center flex-auto">
            <div className="flex flex-row items-center">
              <Button type="link" size="small" href="/">
                {t("home")}
              </Button>
              <Divider type="vertical" />
              <Button type="link" size="small" href={uLocale + "/tools"}>
                {t("tools")}
              </Button>
              <Divider type="vertical" />
              <Button
                type="link"
                size="small"
                href="https://github.com/dsp2b/dsp2b-frontend"
                target="_blank"
              >
                GitHub
              </Button>
              <Divider type="vertical" />
              <Button
                type="link"
                size="small"
                href="https://store.steampowered.com/app/1366540/_/?l=schinese"
                target="_blank"
              >
                {t("dyson_sphere_project")}
              </Button>
            </div>
            <Typography.Text>{t("all_rights_reserved")}</Typography.Text>
          </div>
          <div className="flex flex-col"></div>
        </div>
      </Footer>
    </Layout>
  );
};

export default MainLayout;
