import {
  EditOutlined,
  LikeFilled,
  LikeOutlined,
  LoadingOutlined,
  ShareAltOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import debounce from "lodash/debounce";
import {
  blueprint_collection,
  blueprint_like,
  blueprint_product,
  collection,
  user,
} from "@prisma/client";
import {
  ActionFunction,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
  json,
} from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Carousel,
  Checkbox,
  Descriptions,
  Divider,
  Dropdown,
  Input,
  Space,
  Tag,
  Typography,
  message,
  Image,
} from "antd";
import { ItemType } from "antd/es/menu/hooks/useItems";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { useTranslation } from "react-i18next";
import { ErrBuleprint, ErrCollection, ErrUser } from "~/code/user";
import { BlueprintItem } from "~/components/BlueprintList";
import DSPCover from "~/components/DSPCover";
import prisma from "~/db.server";
import { authenticator } from "~/services/auth.server";
import {
  Building,
  itemProtoSetMap,
  postLike,
} from "~/services/blueprint.server";
import { useRequest } from "~/utils/api";
import { errBadRequest, errNotFound } from "~/utils/errcode";
import {
  jsonData,
  notifyCollectionUpdate,
  ossFileUrl,
} from "~/utils/utils.server";
import { useLocale } from "remix-i18next";
import { success } from "~/utils/httputils";
import { getLocale } from "~/utils/i18n";
import { formatDate } from "~/utils/utils";
import MarkdownView, { markdownViewLinks } from "~/components/MarkdownView";

export const links: LinksFunction = () => {
  return markdownViewLinks();
};

export const action: ActionFunction = async ({ request, params }) => {
  const id = params["id"];
  const data = await jsonData<{
    action: string;
    like: boolean;
    checked: "add" | "remove";
    collection_id: string;
  }>(request);
  const blueprint = await prisma.blueprint.findUnique({
    where: {
      id: id,
    },
  });
  if (!blueprint) {
    return errNotFound(request, ErrBuleprint.NotFound);
  }
  switch (data.action) {
    case "like":
      return postLike(request, blueprint, data.like);
    case "collect":
      const user = await authenticator.isAuthenticated(request);
      if (!user) {
        return errBadRequest(request, ErrUser.UserNotLogin);
      }
      // 加入收藏
      // 判断收藏集合法
      const collection = await prisma.collection.findUnique({
        where: {
          id: data.collection_id,
        },
      });
      if (!collection || collection.user_id != user.id) {
        return errBadRequest(request, ErrCollection.NotFound);
      }
      // 判断收藏数大于100
      const count = await prisma.blueprint_collection.count({
        where: {
          collection_id: data.collection_id,
        },
      });
      if (count > 100) {
        return errBadRequest(request, ErrBuleprint.CollectionCountLimit);
      }
      switch (data.checked) {
        case "add":
          await prisma.blueprint_collection.create({
            data: {
              blueprint_id: blueprint.id,
              collection_id: data.collection_id,
            },
          });
          break;
        case "remove":
          await prisma.blueprint_collection.deleteMany({
            where: {
              blueprint_id: blueprint.id,
              collection_id: data.collection_id,
            },
          });
          break;
      }
      // 通知更新
      notifyCollectionUpdate(data.collection_id, blueprint.id);
      return success();
    case "copy":
      await prisma.blueprint.update({
        where: {
          id: blueprint.id,
        },
        data: {
          copy_count: {
            increment: 1,
          },
        },
      });
      return success();
  }
  return errBadRequest(request, -1);
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await authenticator.isAuthenticated(request);
  const id = params["id"];
  const blueprint = (await prisma.blueprint.findUnique({
    where: {
      id: id,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
          description: true,
        },
      },
    },
  })) as BlueprintItem;
  if (!blueprint) {
    return errNotFound(request, ErrBuleprint.NotFound);
  }
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  if (action === "collect" && user) {
    // 查询是否已经收藏与收藏列表
    const keyword = url.searchParams.get("keyword") || "";
    const collection = await prisma.collection.findMany({
      where: {
        user_id: blueprint.user_id,
        public: 1,
        title: {
          contains: keyword,
        },
      },
      include: {
        blueprint_collection: {
          where: {
            blueprint_id: blueprint.id,
          },
          orderBy: {
            createtime: "asc",
          },
        },
      },
      take: 10,
    });
    return json({ collection });
  }
  if (action === "copy") {
    await prisma.blueprint.update({
      where: {
        id: blueprint.id,
      },
      data: {
        copy_count: {
          increment: 1,
        },
      },
    });
  }
  const products = await prisma.blueprint_product.findMany({
    where: {
      blueprint_id: blueprint.id,
    },
  });

  products.forEach((val: any) => {
    val.name = itemProtoSetMap.get(val.item_id)?.Name;
    val.icon_path = itemProtoSetMap.get(val.item_id)?.IconPath;
  });

  blueprint.tags =
    blueprint.tags_id?.map((val: number) => {
      return {
        item_id: val,
        name: itemProtoSetMap.get(val)?.Name,
        icon_path: itemProtoSetMap.get(val)?.IconPath,
      };
    }) || [];
  if (blueprint.pic_list) {
    blueprint.pic_list = blueprint.pic_list.map((val) => ossFileUrl(val));
  }

  const collections = await prisma.collection.findMany({
    where: {
      blueprint_collection: {
        some: {
          blueprint_id: blueprint.id,
        },
      },
    },
    take: 4,
  });

  const like_count = await prisma.blueprint_like.count({
    where: {
      blueprint_id: blueprint.id,
    },
  });
  let is_like: blueprint_like | null = null;
  if (user) {
    is_like = await prisma.blueprint_like.findUnique({
      where: {
        user_id_blueprint_id: {
          blueprint_id: blueprint.id,
          user_id: user.id,
        },
      },
    });
  }

  let is_collect = false;
  if (user) {
    const result = await prisma.blueprint_collection.findFirst({
      where: {
        collection: {
          user_id: user.id,
        },
        blueprint_id: blueprint.id,
      },
    });
    if (result) {
      is_collect = true;
    }
  }
  const uLocale = "/" + getLocale(request);
  blueprint.user.avatar = ossFileUrl(blueprint.user.avatar);
  return json({
    user,
    blueprint,
    products,
    collections,
    like_count,
    is_like: is_like ? true : false,
    self: user && user.id == blueprint.user_id,
    href: process.env.APP_DOMAIN + uLocale + "/blueprint/" + blueprint.id,
    is_collect,
  });
};

export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {
  return [
    {
      title: data.blueprint.title + " - DSP2B",
    },
  ];
};

type productItem = blueprint_product & { name: string; icon_path: string };

type collectItem = collection & {
  blueprint_collection: blueprint_collection[];
};

export default function Blueprint() {
  const loader = useLoaderData<{
    user: user;
    blueprint: BlueprintItem;
    collections: collection[];
    products: productItem[];
    like_count: number;
    is_like: boolean;
    self: boolean;
    href: string;
    is_collect: boolean;
  }>();
  const { t } = useTranslation();
  const [likeCount, setLikeCount] = useState(loader.like_count);
  const [isLike, setIsLike] = useState(loader.is_like);
  const likeReq = useRequest("blueprint.$id");
  const collections = [...loader.collections].splice(0, 2);
  const buildings = JSON.parse(loader.blueprint.buildings) as Building[];
  const reqSelfCollection = useRequest<collectItem[]>("blueprint.$id");
  const uLocale = "/" + useLocale();

  const debounceTimeout = 800;
  const debounceFetcher = useMemo(() => {
    const loadOptions = (value: string) => {
      reqSelfCollection
        .submit({
          params: {
            id: loader.blueprint.id,
          },
          search: "action=collect&keyword=" + value,
          method: "GET",
        })
        .then(async (resp) => {
          if (resp.status !== 200) {
            message.error(t("data_load_failed"));
            return;
          }
          const data = (await resp.json()) as { collection: collectItem[] };
          reqSelfCollection.setData(data.collection);
        });
    };

    return debounce(loadOptions, debounceTimeout);
  }, [debounceTimeout]);

  return (
    <div className="flex flex-row justify-between gap-3">
      <Card
        style={{ width: "75%" }}
        cover={
          loader.blueprint.pic_list && loader.blueprint.pic_list.length > 0 ? (
            <Image.PreviewGroup items={loader.blueprint.pic_list}>
              <Carousel style={{ width: "100%", height: "300px" }} autoplay>
                {loader.blueprint.pic_list.map((pic) => (
                  <div>
                    <div
                      className="flex justify-center"
                      style={{ width: "100%", height: "300px" }}
                    >
                      <Image
                        rootClassName="!flex"
                        style={{
                          maxHeight: "300px",
                          borderRadius: 0,
                          objectFit: "contain",
                        }}
                        src={pic}
                      />
                    </div>
                  </div>
                ))}
              </Carousel>
            </Image.PreviewGroup>
          ) : (
            <div className="!flex justify-center" style={{ width: "100%" }}>
              <DSPCover
                tags={loader.blueprint.tags}
                icons={loader.blueprint.icons}
                style={{
                  width: "100%",
                  maxWidth: "400px",
                }}
              />
            </div>
          )
        }
        bodyStyle={{
          padding: "10px",
        }}
      >
        <div>
          <div className="flex flex-row justify-between">
            <Typography.Title level={4}>
              {loader.blueprint.title}
            </Typography.Title>
            <CopyToClipboard
              text={loader.blueprint.blueprint}
              onCopy={() => {
                message.success(t("copy_success"));
                likeReq.submit({
                  params: { id: loader.blueprint.id },
                  body: { action: "copy" },
                });
              }}
            >
              <Button type="primary">{t("copy_blueprint_code")}</Button>
            </CopyToClipboard>
          </div>
          <Divider />
          <div>
            <MarkdownView
              id="description"
              content={loader.blueprint.description || "-"}
            />
          </div>
          <Divider />
          <div className="flex flex-col gap-2">
            <Input.TextArea value={loader.blueprint.blueprint} rows={4} />
            <div className="flex flex-row w-full overflow-x-auto">
              {loader.blueprint &&
                loader.blueprint.tags.map((val) => (
                  <Tag
                    icon={
                      <Avatar
                        shape="square"
                        size="small"
                        src={
                          "/images/icons/item_recipe/" + val.icon_path + ".png"
                        }
                      />
                    }
                    className="mr-2"
                  >
                    {val.name}
                  </Tag>
                ))}
            </div>
          </div>
          <Divider />
          {/* <div className="flex flex-col gap-3">
            <div className="flex flex-row gap-2 items-center">
              <Typography.Title level={5} className="!m-0">
                评论
              </Typography.Title>
              <Typography.Text type="secondary">22</Typography.Text>
              <div className="flex flex-row gap-2 items-center ml-4">
                <Typography.Text>最热</Typography.Text>
                <Divider
                  type="vertical"
                  style={{
                    borderColor: token.colorBorder,
                  }}
                />
                <Typography.Text type="secondary">最新</Typography.Text>
              </div>
            </div>
            <div className="flex flex-row gap-2 items-end p-3">
              <Input.TextArea
                placeholder="来发一条评论吧"
                rows={2}
                style={{
                  resize: "none",
                }}
              ></Input.TextArea>
              <Button type="primary">发布</Button>
            </div>
            <div className="flex flex-col gap-2 p-3">
              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2">
                  <Typography.Text>王一之</Typography.Text>
                  <Tag color="volcano">置顶</Tag>
                </div>
                <Typography.Text>ggnb</Typography.Text>
                <div className="flex flex-row gap-2">
                  <Typography.Text type="secondary">
                    2024-01-02 12:23:34
                  </Typography.Text>
                  <LikeOutlined />
                  <Typography.Text type="secondary">回复</Typography.Text>
                </div>
              </div>
              <Divider style={{ margin: "0px 4px" }} />
              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2">
                  <Typography.Text>王一之</Typography.Text>
                </div>
                <Typography.Text>ggnb</Typography.Text>
                <div className="flex flex-row gap-2">
                  <Typography.Text type="secondary">
                    2024-01-02 12:23:34
                  </Typography.Text>
                  <LikeOutlined />
                  <Typography.Text type="secondary">回复</Typography.Text>
                </div>
                <div className="flex flex-col gap-2 pl-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-row gap-2">
                      <Typography.Text>王一之 : gg也nb</Typography.Text>
                    </div>
                    <div className="flex flex-row gap-2">
                      <Typography.Text type="secondary">
                        2024-01-02 12:23:34
                      </Typography.Text>
                      <LikeOutlined />
                      <Typography.Text type="secondary">回复</Typography.Text>
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-row flex-wrap gap-2">
                      <Typography.Text>
                        maxzhang 回复
                        <Link to={"/user/1"}> @王一之 </Link>:
                        哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈
                      </Typography.Text>
                    </div>
                    <div className="flex flex-row gap-2">
                      <Typography.Text type="secondary">
                        2024-01-02 12:23:34
                      </Typography.Text>
                      <LikeOutlined />
                      <Typography.Text type="secondary">回复</Typography.Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </Card>
      <div className="flex flex-col gap-3" style={{ maxWidth: "25%" }}>
        <Card bodyStyle={{ padding: "10px" }}>
          <div className="flex flex-col gap-1 text-center items-center">
            <Link to={uLocale + "/user/" + loader.blueprint.user.id}>
              <Avatar size="large" src={loader.blueprint.user.avatar}>
                {loader.blueprint.user.username.substring(0, 2)}
              </Avatar>
            </Link>
            <Typography.Text>
              <Link to={uLocale + "/user/" + loader.blueprint.user.id}>
                {loader.blueprint.user.username}
              </Link>
            </Typography.Text>
            <Typography.Text type="secondary">
              {loader.blueprint.user.description}
            </Typography.Text>
          </div>
        </Card>
        <Badge.Ribbon
          text={t("original")}
          style={{
            display: loader.blueprint.original == 1 ? undefined : "none",
          }}
        >
          <Card bodyStyle={{ padding: "10px" }}>
            <Descriptions
              className="blueprint-description"
              items={[
                {
                  label: t("create_time"),
                  children: dayjs(loader.blueprint.createtime).format(
                    "YYYY-MM-DD"
                  ),
                },
                {
                  label: t("latest_update"),
                  children: formatDate(new Date(loader.blueprint.updatetime)),
                },
                {
                  label: t("game_version"),
                  children: loader.blueprint.game_version,
                },
                {
                  label: t("copy_count"),
                  children: loader.blueprint.copy_count,
                },
                {
                  label: t("collection"),
                  children: (
                    <div>
                      <Space>
                        {loader.collections && loader.collections.length > 0 ? (
                          collections.map((val) => (
                            <Link to={uLocale + "/collection/" + val.id}>
                              {val.title}
                            </Link>
                          ))
                        ) : (
                          <Typography.Text type="secondary">
                            {t("empty_data")}
                          </Typography.Text>
                        )}
                        {loader.collections.length > 2 && (
                          <Link
                            to={
                              uLocale +
                              "/collection?blueprint=" +
                              loader.blueprint.id
                            }
                          >
                            {t("more...")}
                          </Link>
                        )}
                      </Space>
                    </div>
                  ),
                },
                {
                  children: (
                    <div className="flex flex-row justify-end items-center w-full">
                      <CopyToClipboard
                        text={loader.blueprint.title + "\n" + loader.href}
                        onCopy={() => {
                          message.success(t("copy_success"));
                        }}
                      >
                        <Button
                          icon={<ShareAltOutlined />}
                          type="text"
                          size="small"
                        >
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
                              params: { id: loader.blueprint.id },
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
                      {loader.user && (
                        <Dropdown
                          onOpenChange={(open) => {
                            if (!reqSelfCollection.data) {
                              debounceFetcher("");
                            }
                          }}
                          menu={{
                            items: [
                              {
                                type: "group",
                                label: (
                                  <Input
                                    onChange={(val) =>
                                      debounceFetcher(val.target.value)
                                    }
                                  />
                                ),
                              },
                              ...((reqSelfCollection.loading
                                ? [
                                    {
                                      type: "group",
                                      label: (
                                        <div className="w-full text-center">
                                          <LoadingOutlined />
                                        </div>
                                      ),
                                    },
                                  ]
                                : []) as ItemType[]),
                              ...((reqSelfCollection.data || []).map((item) => {
                                return {
                                  type: "group",
                                  label: (
                                    <Checkbox
                                      checked={
                                        item.blueprint_collection &&
                                        item.blueprint_collection.length > 0
                                      }
                                      onChange={(val) => {
                                        reqSelfCollection
                                          .submit({
                                            params: {
                                              id: loader.blueprint.id,
                                            },
                                            search: "action=collect",
                                            method: "POST",
                                            body: {
                                              collection_id: item.id,
                                              blueprint_id: loader.blueprint.id,
                                              action: "collect",
                                              checked: val.target.checked
                                                ? "add"
                                                : "remove",
                                            },
                                          })
                                          .then((resp) => {
                                            if (resp.status == 200) {
                                              message.success(t("success"));
                                              reqSelfCollection.setData(
                                                (val) => {
                                                  if (!val) {
                                                    return null;
                                                  }
                                                  return val.map((val) => {
                                                    if (val.id == item.id) {
                                                      val.blueprint_collection =
                                                        [{} as any];
                                                    }
                                                    return val;
                                                  });
                                                }
                                              );
                                            } else {
                                              message.error(t("failed"));
                                            }
                                          });
                                      }}
                                    >
                                      {item.title}
                                    </Checkbox>
                                  ),
                                };
                              }) as ItemType[]),
                            ],
                          }}
                        >
                          <Button
                            size="small"
                            type="text"
                            icon={
                              loader.is_collect ? (
                                <StarFilled className="!text-yellow-500" />
                              ) : (
                                <StarOutlined />
                              )
                            }
                          ></Button>
                        </Dropdown>
                      )}
                      {loader.self && (
                        <Link
                          to={
                            uLocale + "/create/blueprint/" + loader.blueprint.id
                          }
                        >
                          <Button
                            icon={<EditOutlined />}
                            type="text"
                            size="small"
                          >
                            {t("edit")}
                          </Button>
                        </Link>
                      )}
                    </div>
                  ),
                },
              ]}
              size="small"
              column={1}
            />
          </Card>
        </Badge.Ribbon>
        <Card
          bodyStyle={{ padding: "16px 10px" }}
          title={t("buildings")}
          headStyle={{ padding: "8px", minHeight: "auto" }}
        >
          <div className="flex flex-row flex-wrap gap-3">
            {buildings.map((val) => (
              <Badge count={val.count} overflowCount={999} color="cyan">
                <Avatar
                  shape="square"
                  src={"/images/icons/item_recipe/" + val.icon_path + ".png"}
                  style={{
                    height: 40,
                    width: 40,
                  }}
                  alt={val.name}
                >
                  {val.name}
                </Avatar>
              </Badge>
            ))}
          </div>
        </Card>
        <Card
          bodyStyle={{ padding: "16px 10px" }}
          title={t("products")}
          headStyle={{ padding: "8px", minHeight: "auto" }}
        >
          <div className="flex flex-row flex-wrap gap-3">
            {loader.products.map((val) => (
              <div className="flex flex-col items-center gap-2">
                <Badge
                  count={
                    val.count > 0
                      ? t("produce")
                      : val.count == 0
                      ? t("product_equal")
                      : t("consume")
                  }
                  color={val.count >= 0 ? "green" : "orange"}
                  className="border-0"
                >
                  <Avatar
                    shape="square"
                    src={"/images/icons/item_recipe/" + val.icon_path + ".png"}
                    style={{
                      height: 40,
                      width: 40,
                    }}
                    alt={val.name}
                  >
                    {val.name}
                  </Avatar>
                </Badge>
                <Typography.Text>{val.count}/min</Typography.Text>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
