import type { LoaderFunction } from "@remix-run/node";
import { Link, json, useLoaderData } from "@remix-run/react";
import {
  Avatar,
  Button,
  Card,
  Divider,
  Input,
  List,
  Select,
  Space,
  Tag,
  Typography,
  message,
  theme,
} from "antd";
import {
  CopyOutlined,
  HeartOutlined,
  LikeOutlined,
  MessageOutlined,
  ShareAltOutlined,
  StarOutlined,
} from "@ant-design/icons";
import prisma from "~/db.server";
import { blueprint, user } from "@prisma/client";
import { itemProtoSetMap } from "~/services/blueprint.server";
import { ossFileUrl } from "~/utils/utils.server";
import DSPCover from "~/components/DSPCover";
import RecipePanel from "~/components/RecipePanel";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1") || 1;
  const list = await prisma.blueprint.findMany({
    skip: (page - 1) * 20,
    take: 20,
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
    orderBy: {
      createtime: "desc",
    },
  });
  const total = await prisma.blueprint.count();

  list.forEach((val: any) => {
    val.tags =
      val.tags_id?.map((val: number) => {
        return {
          id: val,
          name: itemProtoSetMap.get(val)?.Name,
          icon_path: itemProtoSetMap.get(val)?.IconPath,
        };
      }) || [];
    if (val.pic_list && val.pic_list.length > 0) {
      val.pic = ossFileUrl(val.pic_list[0]);
    }
  });

  return json({ list, total });
};

type tag = { id: number; name?: string; icon_path?: string };
type blueprint_user = blueprint & { user: user } & {
  tags: tag[];
} & { pic: string };

export default function Index() {
  const loader = useLoaderData<{
    list: blueprint_user[];
    total: number;
  }>();
  const { token } = theme.useToken();
  const [visibleTagPanel, setVisibleTagPanel] = useState(false);
  const [tags, setTags] = useState<tag[]>([]);
  const { t } = useTranslation();

  return (
    <div className="flex flex-row justify-between gap-3">
      <div className="flex flex-col gap-3 flex-auto">
        <Card bodyStyle={{ padding: "10px" }}>
          <Space direction="vertical" className="w-full">
            <div className="flex flex-row gap-3">
              <Input.Search placeholder="通过关键字搜索" className="!w-1/3" />
              <RecipePanel
                visible={visibleTagPanel}
                onClickOutSide={() => {
                  setVisibleTagPanel(false);
                }}
                onSelect={(val) => {
                  setTags((prevTags) => {
                    for (const tag of prevTags) {
                      if (tag.id == val.id) {
                        message.warning(t("tag_exist"));
                        return prevTags;
                      }
                    }
                    return [...prevTags, val];
                  });
                  setVisibleTagPanel(false);
                }}
              >
                <div
                  className="w-1/3"
                  onClick={() => {
                    setVisibleTagPanel(true);
                  }}
                >
                  <Select
                    className="w-full py-1"
                    mode="multiple"
                    allowClear
                    placeholder="通过标签筛选"
                    value={tags.map((tag) => tag.name)}
                    dropdownStyle={{ display: "none" }}
                    dropdownRender={() => <></>}
                    tagRender={(props) => {
                      const item = tags.find((tag) => tag.name == props.value);
                      return (
                        <Tag
                          icon={
                            <Avatar
                              shape="square"
                              size="small"
                              src={
                                "/images/icons/item_recipe/" +
                                item!.icon_path +
                                ".png"
                              }
                            />
                          }
                          className="mr-2"
                          closable
                        >
                          {props.value}
                        </Tag>
                      );
                    }}
                  />
                </div>
              </RecipePanel>
              <Button>搜索</Button>
            </div>
            <Button.Group>
              <Button>最新</Button>
              <Button>最受欢迎</Button>
              <Button>最多收藏</Button>
            </Button.Group>
          </Space>
        </Card>
        <List
          grid={{ gutter: 16, column: 5 }}
          dataSource={loader.list}
          renderItem={(item) => (
            <List.Item>
              <Card
                style={{ width: 200 }}
                cover={
                  <>
                    {!item.pic && item.tags && item.tags.length ? (
                      <DSPCover
                        items={item.tags}
                        style={{
                          width: 200,
                          height: 200,
                        }}
                      />
                    ) : (
                      <img
                        style={{ height: 200 }}
                        src={
                          item.pic
                            ? item.pic
                            : "https://media.st.dl.eccdnx.com/steam/apps/1366540/header_schinese.jpg?t=1702624498"
                        }
                      />
                    )}
                  </>
                }
                bodyStyle={{
                  padding: "12px",
                }}
              >
                <List.Item.Meta
                  title={item.title}
                  description={
                    <Typography.Text type="secondary" ellipsis>
                      {item.description}
                    </Typography.Text>
                  }
                />
                <div className="flex flex-row justify-between mt-2">
                  <div>
                    <Link to={"/users/" + item.user_id}>
                      <Typography.Text type="secondary">
                        {item.user.username}
                      </Typography.Text>
                    </Link>
                  </div>
                  <div>
                    <Typography.Text type="secondary">
                      <CopyOutlined />
                    </Typography.Text>
                    <Divider type="vertical" />
                    <Typography.Text type="secondary">
                      <LikeOutlined /> 1
                    </Typography.Text>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </div>
    </div>
  );
}
