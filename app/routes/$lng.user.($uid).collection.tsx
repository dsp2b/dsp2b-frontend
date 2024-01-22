import { LoaderFunction, json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Button, Card } from "antd";
import { useTranslation } from "react-i18next";
import { useLocale } from "remix-i18next";
import CollectionFolder, {
  CollectionFolderItem,
} from "~/components/CollectionFolder";
import CollectionList from "~/components/CollectionList";
import { authenticator } from "~/services/auth.server";
import { collectionList } from "~/services/collection.server";
import { UserAuth } from "~/services/user.server.ts";

type LoaderData = {
  user_id: string;
  user: UserAuth;
  self: boolean;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  let uid = params["uid"];
  const user = await authenticator.isAuthenticated(request);
  if (!uid) {
    uid = user?.id;
  }
  if (!uid) {
    return redirect("/login");
  }
  const self = uid == user?.id;

  const data = await collectionList(request, {
    user_id: uid,
  });

  return json({
    user_id: uid,
    user,
    self,
    ...data,
  });
};

export default function Collections() {
  const loader = useLoaderData<LoaderData>();
  const { user_id, user } = loader;
  const { t } = useTranslation();
  const uLocale = "/" + useLocale();

  return (
    <div className="flex flex-col gap-3">
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
            <Link to={uLocale + "/create/collection"}>
              <Button>{t("create_collection")}</Button>
            </Link>
          </div>
        </Card>
      )}
      <CollectionList loader={loader as any} />
    </div>
  );
}
