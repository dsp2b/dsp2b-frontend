import {
  IconDesktop,
  IconExit,
  IconFolderStroked,
  IconLanguage,
  IconMoon,
  IconSun,
} from "@douyinfe/semi-icons";
import {
  Avatar,
  Button,
  Divider,
  Dropdown,
  Layout,
  Nav,
  Space,
  Toast,
  Typography,
} from "@douyinfe/semi-ui";
import { Link, useNavigate } from "@remix-run/react";
import React, { ReactNode, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserContext } from "~/context-manager";
import { lngMap } from "~/utils/i18n";

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

  useEffect(() => {
    if (user.styleMode == "auto") {
      let media = window.matchMedia("(prefers-color-scheme: dark)");
      let isMatch = (match: boolean) => {
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
      const callback = (e: { matches: any }) => {
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

  let localeList = [];
  for (const [, lng] of Object.entries(lngMap)) {
    for (const [key, value] of Object.entries(lng)) {
      if (!value.hide) {
        // 修改路径为对应的语言
        localeList.push(
          <Dropdown.Item
            key={key}
            active={locale == key}
            onClick={() => {
              onChange({
                darkMode: user.darkMode || "",
                styleMode: user.styleMode || "auto",
                locale: key,
              });
            }}
          >
            {value.name + "(" + key + ")"}
          </Dropdown.Item>
        );
      }
    }
  }

  return (
    <Layout className="components-layout-demo">
      <Header>
        <Nav
          mode="horizontal"
          header={{
            logo: (
              <Typography.Title heading={2}>
                {t("dsp2b_title")}
              </Typography.Title>
            ),
            text: (
              <Typography.Title heading={6}>
                {t("dsp2b_subtitle")}
              </Typography.Title>
            ),
          }}
          footer={
            <Space>
              <Link to={"/create/blueprint"}>
                <Button theme="solid" type="primary">
                  {t("publish")}
                </Button>
              </Link>
              <Dropdown
                render={
                  <Dropdown.Menu>
                    <Dropdown.Item
                      key="auto"
                      active={user.styleMode == "auto"}
                      onClick={() => {
                        onChange({
                          darkMode: user.darkMode || "",
                          styleMode: "auto",
                          locale: locale,
                        });
                      }}
                    >
                      <IconDesktop />
                      {t("dark_mode_auto")}
                    </Dropdown.Item>
                    <Dropdown.Item
                      key="light"
                      active={user.styleMode == "light"}
                      onClick={() => {
                        onChange({
                          darkMode: user.darkMode || "",
                          styleMode: "light",
                          locale: locale,
                        });
                      }}
                    >
                      <IconSun />
                      {t("dark_mode_light")}
                    </Dropdown.Item>
                    <Dropdown.Item
                      key="dark"
                      active={user.styleMode == "dark"}
                      onClick={() => {
                        onChange({
                          darkMode: user.darkMode || "",
                          styleMode: "dark",
                          locale: locale,
                        });
                      }}
                    >
                      <IconMoon />
                      {t("dark_mode_dark")}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                }
              >
                <Button
                  theme="borderless"
                  icon={
                    user.darkMode == "dark" ? (
                      <IconMoon className="text-xl text-gray-500" />
                    ) : (
                      <IconSun className="text-xl text-gray-500" />
                    )
                  }
                ></Button>
              </Dropdown>
              <Dropdown
                render={
                  <Dropdown.Menu>
                    {localeList.map((item) => item)}
                  </Dropdown.Menu>
                }
              >
                <Button
                  theme="borderless"
                  icon={<IconLanguage className="text-xl text-gray-500" />}
                ></Button>
              </Dropdown>
              {user.user ? (
                <Dropdown
                  position="bottomRight"
                  render={
                    <Dropdown.Menu>
                      <Dropdown.Item>
                        <Space>
                          <Avatar size="small" color="blue">
                            {user.user.username}
                          </Avatar>
                          <Space vertical>
                            <Typography.Text>
                              {user.user.username}
                            </Typography.Text>
                          </Space>
                        </Space>
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => {
                          navigate("/users/collections");
                        }}
                      >
                        <IconFolderStroked />
                        {t("blueprint_collections")}
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => {
                          fetch("/login/logout").then((resp) => {
                            if (resp.status !== 200) {
                              Toast.warning(t("logout_failed"));
                            } else {
                              Toast.success(t("logout_success"));
                              onLogout();
                            }
                          });
                        }}
                      >
                        <IconExit />
                        {t("logout")}
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  }
                >
                  <Avatar size="small" color="blue">
                    {user.user.username}
                  </Avatar>
                </Dropdown>
              ) : (
                <Link to="/login">
                  <Button
                    theme="solid"
                    type="primary"
                    style={{ marginRight: 8 }}
                  >
                    {t("login")}
                  </Button>
                </Link>
              )}
            </Space>
          }
        >
          <Nav.Item itemKey="Home" text={t("home")} link="/" />
        </Nav>
      </Header>
      <Content className="w-4/5 m-auto p-4">{children}</Content>
      <Footer>
        <Divider />
        <div className="flex flex-col items-center">
          <div className="flex flex-row gap-2">
            <Typography.Text link={{ href: "/" }}>{t("home")}</Typography.Text>
            <Typography.Text
              link={{
                href: "https://store.steampowered.com/app/1366540/_/?l=schinese",
              }}
            >
              {t("dyson_sphere_project")}
            </Typography.Text>
          </div>
          <Typography.Text>{t("all_rights_reserved")}</Typography.Text>
        </div>
      </Footer>
    </Layout>
  );
};

export default MainLayout;
