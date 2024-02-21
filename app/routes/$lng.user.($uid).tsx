import { EditOutlined } from "@ant-design/icons";
import { user } from "@prisma/client";
import { LoaderFunction, MetaFunction, json } from "@remix-run/node";
import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
} from "@remix-run/react";
import { Avatar, Button, Card, Tabs, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { ErrUser } from "~/code/user";
import prisma from "~/db.server";
import i18next from "~/i18next.server";
import { authenticator } from "~/services/auth.server";
import { UserAuth } from "~/services/user.server.ts";
import { errNotFound } from "~/utils/errcode";
import { ossFileUrl } from "~/utils/utils.server";

export const loader: LoaderFunction = async ({ request, params }) => {
  const t = await i18next.getFixedT(request);
  let id = params.uid;
  const user = await authenticator.isAuthenticated(request);
  const self = user?.id === id;
  if (!id) {
    id = user?.id;
  }
  if (!id) {
    return errNotFound(request, ErrUser.UserNotExist);
  }
  const pageUser = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  if (!pageUser) {
    return json({});
  }
  pageUser.avatar = ossFileUrl(pageUser.avatar);

  return json({
    user,
    pageUser,
    self,
    i18n: {
      collection: t("collection"),
    },
  });
};

export const meta: MetaFunction<typeof loader> = ({ data, location }) => {
  let title = data.pageUser.username;
  if (location.pathname.endsWith("collection")) {
    title += " - " + data.i18n.collection;
  }

  return [{ title: title + " - DSP2B" }];
};

type LoaderData = {
  user: UserAuth;
  pageUser: user;
  self: boolean;
};

export default function User() {
  const loader = useLoaderData<LoaderData>();
  const { t } = useTranslation();
  const location = useLocation();

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
                src={loader.pageUser.avatar || undefined}
              >
                {loader.pageUser.username.substring(0, 2)}
              </Avatar>
              <Typography.Text>{loader.pageUser.username}</Typography.Text>
              <Typography.Text type="secondary">
                {loader.pageUser.description}
              </Typography.Text>
            </div>
            <div className="">
              <Link to={"./edit"}>
                <Button icon={<EditOutlined />} size="small">
                  {t("edit")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
      <Tabs
        activeKey={
          location.pathname.endsWith("collection") ? "collection" : "blueprint"
        }
        items={[
          {
            key: "blueprint",
            label: (
              <Link to="./" style={{ color: "unset" }}>
                {t("blueprint")}
              </Link>
            ),
          },
          {
            key: "collection",
            label: (
              <Link to="./collection" style={{ color: "unset" }}>
                {t("blueprint_collection")}
              </Link>
            ),
          },
        ]}
      ></Tabs>
      <Outlet />
    </div>
  );
}
