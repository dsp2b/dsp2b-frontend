import { LoaderFunction, json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Button, Card } from "antd";
import { useTranslation } from "react-i18next";
import BlueprintList, { BlueprintItem } from "~/components/BlueprintList";
import CollectionFolder, {
  CollectionFolderItem,
} from "~/components/CollectionFolder";
import { authenticator } from "~/services/auth.server";
import { blueprintList } from "~/services/blueprint.server";
import { UserAuth } from "~/services/user.server.ts";

type LoaderData = {
  user_id: string;
  user: UserAuth;
  self: boolean;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  let uid = params.uid;
  const user = await authenticator.isAuthenticated(request);
  if (!uid) {
    uid = user?.id;
  }
  if (!uid) {
    return redirect("/login");
  }
  const blueprintData = await blueprintList(request, { user_id: uid });

  return json({ ...blueprintData });
};

export default function Collections() {
  const loader = useLoaderData<any>();
  const { user_id, user } = useLoaderData<LoaderData>();
  const { t } = useTranslation();
  const list: Array<CollectionFolderItem> = [];
  return (
    <div>
      <BlueprintList loader={loader} />
    </div>
  );
}
