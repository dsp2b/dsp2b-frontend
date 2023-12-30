import {
  IconBell,
  IconFeishuLogo,
  IconHelpCircle,
  IconLanguage,
  IconSun,
} from "@douyinfe/semi-icons";
import { Avatar, Layout, Nav, Space } from "@douyinfe/semi-ui";
import React, { ReactNode } from "react";
import { useTranslation } from "react-i18next";

const MainLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { Header, Footer, Content } = Layout;
  const { t } = useTranslation();

  return (
    <Layout className="components-layout-demo">
      <Header>
        <Nav
          mode="horizontal"
          header={{
            logo: <h1>DSP</h1>,
            text: "论坛/蓝图",
          }}
          footer={
            <Space>
              <IconSun size="large" />
              <IconLanguage size="large" />
              <Avatar
                size="small"
                src="https://sf6-cdn-tos.douyinstatic.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/avatarDemo.jpeg"
                color="blue"
              >
                示例
              </Avatar>
            </Space>
          }
        >
          <Nav.Item itemKey="Home" text="首页" link="/" />
        </Nav>
      </Header>
      <Content>{children}</Content>
      <Footer>
        <p>{t("all_rights_reserved")}</p>
      </Footer>
    </Layout>
  );
};

export default MainLayout;
