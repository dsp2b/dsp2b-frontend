import {
  EditOutlined,
  LikeFilled,
  LikeOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import {
  blueprint,
  blueprint_like,
  blueprint_product,
  collection,
  user,
} from "@prisma/client";
import { ActionFunction, LoaderFunction, json } from "@remix-run/node";
import {
  Link,
  useLoaderData,
  useLocation,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Carousel,
  Descriptions,
  Divider,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  message,
  theme,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { useTranslation } from "react-i18next";
import { ErrBuleprint, ErrUser } from "~/code/user";
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
import { jsonData, ossFileUrl } from "~/utils/utils.server";

export const action: ActionFunction = async ({ request, params }) => {
  const id = params["id"];
  const data = await jsonData<{ action: string; like: boolean }>(request);
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
        },
      },
    },
  })) as BlueprintItem;
  if (!blueprint) {
    return errNotFound(request, ErrBuleprint.NotFound);
  }
  const products = await prisma.blueprint_product.findMany({
    where: {
      blueptint_id: blueprint.id,
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

  return json({
    user,
    blueprint,
    products,
    collections,
    like_count,
    is_like: is_like ? true : false,
    self: user && user.id == blueprint.user_id,
    href: process.env.APP_DOMAIN + "/blueprint/" + blueprint.id,
  });
};

type productItem = blueprint_product & { name: string; icon_path: string };

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
  }>();
  const { token } = theme.useToken();
  const { t } = useTranslation();
  const [likeCount, setLikeCount] = useState(loader.like_count);
  const [isLike, setIsLike] = useState(loader.is_like);
  const likeReq = useRequest("blueprint.$id");
  const navigate = useNavigate();
  const collections = [...loader.collections].splice(0, 2);
  const buildings = JSON.parse(loader.blueprint.buildings) as Building[];

  return (
    <div className="flex flex-row justify-between gap-3">
      <Card
        style={{ width: "75%" }}
        cover={
          loader.blueprint.pic_list && loader.blueprint.pic_list.length > 0 ? (
            <Carousel>
              {loader.blueprint.pic_list.map((pic) => (
                <div>
                  <img
                    style={{
                      width: "100%",
                      maxHeight: "400px",
                    }}
                    src={pic}
                  />
                </div>
              ))}
            </Carousel>
          ) : (
            <div className="!flex justify-center" style={{ width: "100%" }}>
              <DSPCover
                items={loader.blueprint.tags}
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
              }}
            >
              <Button type="primary">{t("copy_blueprint_code")}</Button>
            </CopyToClipboard>
          </div>
          <Divider />
          <div>
            <Typography.Text>{loader.blueprint.description}</Typography.Text>
          </div>
          <Divider />
          <div className="flex flex-col gap-2">
            <Input.TextArea value={loader.blueprint.blueprint} />
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
          <Descriptions
            className="blueprint-description"
            items={[
              {
                label: t("author"),
                children: (
                  <Link to={"/user/" + loader.blueprint.user_id}>
                    {loader.blueprint.user.username}
                  </Link>
                ),
              },
              {
                label: t("create_time"),
                children: dayjs(loader.blueprint.createtime).format(
                  "YYYY-MM-DD"
                ),
              },
              {
                label: t("game_version"),
                children: loader.blueprint.game_version,
              },
              {
                label: t("copy_count"),
                children: "0",
              },
              {
                label: t("collection"),
                children: (
                  <div>
                    <Space>
                      {loader.collections && loader.collections.length > 0 ? (
                        collections.map((val) => (
                          <Link to={"/collection/" + val.id}>{val.title}</Link>
                        ))
                      ) : (
                        <Typography.Text type="secondary">
                          {t("empty_data")}
                        </Typography.Text>
                      )}
                      {loader.collections.length > 2 && (
                        <Link
                          to={"/collection?blueprint=" + loader.blueprint.id}
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
                        分享
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
                    {loader.self && (
                      <Button
                        icon={<EditOutlined />}
                        type="text"
                        size="small"
                        onClick={() => {
                          navigate("/create/blueprint/" + loader.blueprint.id);
                        }}
                      >
                        {t("edit")}
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            size="small"
            column={1}
          />
        </Card>
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
