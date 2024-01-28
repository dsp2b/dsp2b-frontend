import {
  DownloadOutlined,
  EditOutlined,
  LikeFilled,
  LikeOutlined,
  ShareAltOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { collection, collection_like } from "@prisma/client";
import {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
  json,
} from "@remix-run/node";
import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import { Button, Card, Radio, Typography, message } from "antd";
import { useTranslation } from "react-i18next";
import { ErrCollection } from "~/code/user";
import BlueprintList, { BlueprintItem } from "~/components/BlueprintList";
import { CopyToClipboard } from "react-copy-to-clipboard";
import CollectionFolder from "~/components/CollectionFolder";
import prisma from "~/db.server";
import { authenticator } from "~/services/auth.server";
import { errBadRequest, errNotFound } from "~/utils/errcode";
import { blueprintList } from "~/services/blueprint.server";
import { jsonData } from "~/utils/utils.server";
import { collectionLike } from "~/services/collection.server";
import { routeToUrl, useRequest } from "~/utils/api";
import { useState } from "react";
import i18next from "~/i18next.server";
import { useLocale } from "remix-i18next";
import { getLocale } from "~/utils/i18n";

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await authenticator.isAuthenticated(request);
  const id = params["id"];
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const collection = await prisma.collection.findUnique({
    where: {
      id: id,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });
  if (!collection) {
    return errNotFound(request, ErrCollection.NotFound);
  }
  const self = user && user.id == collection.user_id;
  if (!self && collection.public !== 1) {
    return errBadRequest(request, ErrCollection.NotFound);
  }
  if (action == "download") {
    return fetch(
      process.env.RPC_URL + "/collection/" + collection.id + "/download"
    );
  }
  const subCollection = await prisma.collection.findMany({
    where: {
      parent_id: collection.id,
      public: self ? undefined : 1,
    },
  });

  const resp = await blueprintList(request, {
    collection: collection.id,
    defaultSort: "title",
  });

  const like_count = await prisma.collection_like.count({
    where: {
      collection_id: collection.id,
    },
  });
  let is_like: collection_like | null = null;
  if (user) {
    is_like = await prisma.collection_like.findUnique({
      where: {
        user_id_collection_id: {
          collection_id: collection.id,
          user_id: user.id,
        },
      },
    });
  }
  const uLocale = "/" + getLocale(request);
  const t = await i18next.getFixedT(request);

  return json({
    collection,
    self,
    sub_collection: subCollection,
    like_count,
    is_like: is_like ? true : false,
    i18n: {
      collection: t("collection"),
    },
    href: process.env.APP_DOMAIN + uLocale + "/collection/" + collection.id,
    ...resp,
  });
};

export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {
  return [
    {
      title: data.collection.title + " - " + data.i18n.collection + " - DSP2B",
    },
  ];
};

export const action: ActionFunction = async ({ request, params }) => {
  const user = await authenticator.isAuthenticated(request);
  const id = params["id"];
  const data = await jsonData<{ action: string; like: boolean }>(request);
  const collection = await prisma.collection.findUnique({
    where: {
      id: id,
    },
  });
  if (!collection) {
    return errNotFound(request, ErrCollection.NotFound);
  }
  const self = user && user.id == collection.user_id;
  if (!self && collection.public !== 1) {
    return errBadRequest(request, ErrCollection.NotFound);
  }
  switch (data.action) {
    case "like":
      return collectionLike(request, collection, data.like);
  }
  return errBadRequest(request, -1);
};

export default function Collection() {
  const loader = useLoaderData<{
    collection: collection;
    self: boolean;
    sub_collection: Array<collection>;
    list: BlueprintItem[];
    total: number;
    like_count: number;
    is_like: boolean;
    href: string;
  }>();
  const { t } = useTranslation();
  const [likeCount, setLikeCount] = useState(loader.like_count);
  const [isLike, setIsLike] = useState(loader.is_like);
  const likeReq = useRequest("collection_.$id");
  const navigate = useNavigate();
  const locale = useLocale();
  const uLocale = "/" + locale;

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <div>
          {loader.collection.parent_id && (
            <Button type="text" size="small" icon={<UpOutlined />}>
              <Link to={uLocale + "/collection/" + loader.collection.parent_id}>
                {t("back_to_previous")}
              </Link>
            </Button>
          )}
          <div className="flex flex-row justify-between">
            <Typography.Title level={2} style={{ marginBottom: 4 }}>
              {loader.collection.title}
            </Typography.Title>
            <div className="flex flex-col gap-2 items-center">
              <div>
                <CopyToClipboard
                  text={loader.collection.title + "\n" + loader.href}
                  onCopy={() => {
                    message.success(t("copy_success"));
                  }}
                >
                  <Button icon={<ShareAltOutlined />} type="text" size="small">
                    {t("share")}
                  </Button>
                </CopyToClipboard>
                <Button
                  type="text"
                  icon={isLike ? <LikeFilled /> : <LikeOutlined />}
                  size="small"
                  loading={likeReq.loading}
                  onClick={() => {
                    likeReq
                      .submit({
                        params: { id: loader.collection.id },
                        body: { like: !isLike, action: "like" },
                      })
                      .then(async (resp) => {
                        if (resp.status == 200) {
                          setIsLike(!isLike);
                          if (isLike) {
                            setLikeCount(likeCount - 1);
                          } else {
                            setLikeCount(likeCount + 1);
                          }
                        } else {
                          const data = await resp.json();
                          message.error(data.msg);
                        }
                      });
                  }}
                >
                  {likeCount.toString()}
                </Button>
                {loader.self && (
                  <Button
                    icon={<EditOutlined />}
                    type="text"
                    size="small"
                    onClick={() => {
                      navigate(
                        uLocale + "/create/collection/" + loader.collection.id
                      );
                    }}
                  >
                    {t("edit")}
                  </Button>
                )}
              </div>
              <Button
                icon={<DownloadOutlined />}
                type="primary"
                href={routeToUrl("$lng.collection_.$id?action=download", {
                  params: { lng: locale, id: loader.collection.id },
                })}
              >
                {t("download_collection_zip")}
              </Button>
            </div>
          </div>
          <Typography.Text>{loader.collection.description}</Typography.Text>
        </div>
        {loader.sub_collection && loader.sub_collection.length > 0 && (
          <CollectionFolder
            title={t("sub_collection")}
            list={loader.sub_collection}
            bordered={false}
            bodyStyle={{ padding: 0, border: 0 }}
            style={{ padding: 0, border: 0, boxShadow: "unset" }}
            headStyle={{ border: 0, padding: 0 }}
          />
        )}
      </Card>
      <BlueprintList
        loader={loader as any}
        sortButton={[
          <Radio.Button value="title">{t("title")}</Radio.Button>,
          <Radio.Button value="latest_update">
            {t("latest_update")}
          </Radio.Button>,
        ]}
      />
    </div>
  );
}
