import { EditOutlined } from "@ant-design/icons";
import { Outlet } from "@remix-run/react";
import { Avatar, Button, Card, Tabs, Typography } from "antd";
import { useTranslation } from "react-i18next";

export default function User() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3">
      <Card
        bodyStyle={{
          padding: "8px",
        }}
      >
        <div>
          <div className="flex flex-row justify-between">
            <div></div>
            <div className="flex flex-col gap-1 items-center">
              <Avatar
                style={{
                  width: 64,
                  height: 64,
                }}
              >
                {"王"}
              </Avatar>
              <Typography.Text>王一之</Typography.Text>
              <Typography.Text type="secondary">王一之</Typography.Text>
            </div>
            <div className="">
              <Button icon={<EditOutlined />} size="small">
                {t("edit")}
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <Tabs
        items={[
          {
            key: "blueprint",
            label: t("blueprint"),
          },
          {
            key: "collection",
            label: t("blueprint_collection"),
          },
        ]}
      ></Tabs>
      <Outlet />
    </div>
  );
}
