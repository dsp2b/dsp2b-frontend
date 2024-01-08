import { IconFolder } from "@douyinfe/semi-icons";
import { Button, Card, Dropdown, Typography } from "@douyinfe/semi-ui";
import { LoaderFunction, json, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { authenticator } from "~/services/auth.server";
import { UserAuth } from "~/services/user.server.ts";

type LoaderData = {
  user_id: string;
  user: UserAuth;
  self: boolean;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await authenticator.isAuthenticated(request);
  let user_id = params["id"];
  if (!user_id && !user) {
    return redirect("/login");
  }
  const self = user && (!user_id || user.id == user_id);
  return json({
    user_id: user_id,
    user,
    self,
  });
};

export default function Collections() {
  const { user_id, user } = useLoaderData<LoaderData>();
  const { t } = useTranslation();
  const list = [
    { title: "qweqwssssse" },
    { title: "qweqwssssse" },
    { title: "qweqwssssse" },
    { title: "qweqwssssse" },
    { title: "qweqwssssse" },
    { title: "qweqwssssse" },
    { title: "qweqwssssse" },
    { title: "qweqwssssse" },
    { title: "qweqwssssse" },
    { title: "qweqwssssse" },
    { title: "qweqwssssse" },
  ];
  return (
    <div>
      {user && (!user_id || user.id == user_id) && (
        <Card
          style={{
            marginBottom: "10px",
          }}
          bodyStyle={{
            padding: "10px",
          }}
        >
          <div className="flex flex-row-reverse">
            <Link to="/create/collections">
              <Button>{t("create_collection")}</Button>
            </Link>
          </div>
        </Card>
      )}
      <Card>
        <div className="flex flex-row flex-wrap">
          {list.map((item, index) => (
            <Dropdown
              trigger="contextMenu"
              position="rightBottom"
              render={
                <Dropdown.Menu>
                  <Dropdown.Item>打开</Dropdown.Item>
                  <Dropdown.Item>打开描述页</Dropdown.Item>
                  <Dropdown.Item>分享</Dropdown.Item>
                  <Dropdown.Item>管理</Dropdown.Item>
                </Dropdown.Menu>
              }
            >
              <Button
                theme="borderless"
                style={{
                  width: "100px",
                  height: "100px",
                }}
              >
                <div
                  className="flex flex-col items-center justify-between w-full"
                  style={{
                    height: "80px",
                  }}
                >
                  <IconFolder className="text-5xl" />
                  <Typography.Text
                    style={{
                      width: "90px",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                    }}
                  >
                    {item.title + index}
                  </Typography.Text>
                </div>
              </Button>
            </Dropdown>
          ))}
        </div>
      </Card>
    </div>
  );
}
