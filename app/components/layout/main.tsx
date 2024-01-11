import {
  DesktopOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "@remix-run/react";
import { RiComputerLine, RiMoonLine } from "@remixicon/react";
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
          label: (
            <Space
              onClick={() => {
                onChange({
                  darkMode: user.darkMode || "",
                  styleMode: user.styleMode || "auto",
                  locale: key,
                });
              }}
            >
              {value.name + "(" + key + ")"}
            </Space>
          ),
        });
      }
    }
  }

  return (
    <Layout className="components-layout-demo">
      <Header
        className="flex flex-row justify-between"
        style={{
          background: token.colorBgContainer,
        }}
      >
        <div className="flex flex-row gap-2 flex-auto items-center">
          <Typography.Title level={2} className="!m-0">
            {t("dsp2b_title")}
          </Typography.Title>
          <Typography.Title level={5} className="!m-0">
            {t("dsp2b_subtitle")}
          </Typography.Title>
          <Menu
            mode="horizontal"
            className="!ml-4"
            style={{
              width: "120px",
              border: 0,
            }}
            items={[
              {
                key: "home",
                label: t("home"),
              },
            ]}
          />
        </div>
        <Space>
          <Link to={"/create/blueprint"}>
            <Button type="primary">{t("publish")}</Button>
          </Link>
          <Dropdown
            menu={{
              items: [
                {
                  key: "auto",
                  label: (
                    <Space
                      onClick={() => {
                        onChange({
                          darkMode: user.darkMode || "",
                          styleMode: "auto",
                          locale: locale,
                        });
                      }}
                    >
                      <DesktopOutlined />
                      {t("dark_mode_auto")}
                    </Space>
                  ),
                },
                {
                  key: "light",
                  label: (
                    <Space
                      onClick={() => {
                        onChange({
                          darkMode: user.darkMode || "",
                          styleMode: "light",
                          locale: locale,
                        });
                      }}
                    >
                      <SunLineIcon className="text-base cursor-pointer" />
                      {t("dark_mode_light")}
                    </Space>
                  ),
                },
                {
                  key: "dark",
                  label: (
                    <Space
                      onClick={() => {
                        onChange({
                          darkMode: user.darkMode || "",
                          styleMode: "dark",
                          locale: locale,
                        });
                      }}
                    >
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
          <Dropdown menu={{ items: localeList.map((item) => item) }}>
            <Button
              icon={<GlobalOutlined style={{ display: "block" }} />}
            ></Button>
          </Dropdown>
          {user.user ? (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "info",
                    label: (
                      <Space>
                        <Avatar size="small">{user.user.username}</Avatar>
                        <Space direction="vertical">
                          <Typography.Text>
                            {user.user.username}
                          </Typography.Text>
                        </Space>
                      </Space>
                    ),
                  },
                  {
                    key: "collection",
                    label: (
                      <Space
                        onClick={() => {
                          navigate("/users/collections");
                        }}
                      >
                        <FolderOpenOutlined />
                        {t("blueprint_collections")}
                      </Space>
                    ),
                  },
                  {
                    key: "logout",
                    label: (
                      <Space
                        onClick={() => {
                          fetch("/login/logout").then((resp) => {
                            if (resp.status !== 200) {
                              message.warning(t("logout_failed"));
                            } else {
                              message.success(t("logout_success"));
                              onLogout();
                            }
                          });
                        }}
                      >
                        <LogoutOutlined />
                        {t("logout")}
                      </Space>
                    ),
                  },
                ],
              }}
            >
              <Avatar>{user.user.username}</Avatar>
            </Dropdown>
          ) : (
            <Link to="/login">
              <Button style={{ marginRight: 8 }}>{t("login")}</Button>
            </Link>
          )}
        </Space>
      </Header>
      <Content className="w-4/5 m-auto p-4">{children}</Content>
      <Footer>
        <Divider />
        <div className="flex flex-col items-center">
          <div className="flex flex-row gap-2">
            <Button type="link" href="/">
              {t("home")}
            </Button>
            <Button
              type="link"
              href="https://store.steampowered.com/app/1366540/_/?l=schinese"
              target="_blank"
            >
              {t("dyson_sphere_project")}
            </Button>
          </div>
          <Typography.Text>{t("all_rights_reserved")}</Typography.Text>
        </div>
      </Footer>
    </Layout>
  );
};

export default MainLayout;
