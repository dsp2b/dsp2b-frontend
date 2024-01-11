import { LoaderFunction, json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Button, Card } from "antd";
import { useTranslation } from "react-i18next";
import CollectionFolder, {
  CollectionFolderItem,
} from "~/components/CollectionFolder";
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
  const list: Array<CollectionFolderItem> = [];
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
            <Link to="/create/collection">
              <Button>{t("create_collection")}</Button>
            </Link>
          </div>
        </Card>
      )}
      <CollectionFolder title={t("sub_collection")} list={list} />
    </div>
  );
}
