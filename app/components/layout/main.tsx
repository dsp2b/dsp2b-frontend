import { IconBell, IconFeishuLogo, IconHelpCircle } from "@douyinfe/semi-icons";
import { Avatar, Layout, Nav } from "@douyinfe/semi-ui";
import React, { ReactNode } from "react";

const MainLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { Header, Footer, Content } = Layout;

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
            <div>
              <IconFeishuLogo size="large" />
              <IconHelpCircle size="large" />
              <IconBell size="large" />
              <Avatar
                size="small"
                src="https://sf6-cdn-tos.douyinstatic.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/avatarDemo.jpeg"
                color="blue"
              >
                示例
              </Avatar>
            </div>
          }
        >
          <Nav.Item itemKey="Home" text="首页" link="/" />
          <Nav.Item itemKey="Project" text="Project" />
          <Nav.Item itemKey="Board" text="Board" />
          <Nav.Item itemKey="Forms" text="Forms" />
        </Nav>
      </Header>
      <Content style={{ height: 300, lineHeight: "300px" }}>{children}</Content>
      <Footer>Footer</Footer>
    </Layout>
  );
};

export default MainLayout;
