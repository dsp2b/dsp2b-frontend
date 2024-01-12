import type { LoaderFunction } from "@remix-run/node";
import { Link, json, useLoaderData } from "@remix-run/react";
import {
  Avatar,
  Button,
  Card,
  Divider,
  List,
  Space,
  Tag,
  Typography,
  theme,
} from "antd";
import {
  CopyOutlined,
  HeartOutlined,
  MessageOutlined,
  ShareAltOutlined,
  StarOutlined,
} from "@ant-design/icons";
import prisma from "~/db.server";
import { blueprint, user } from "@prisma/client";
import { itemProtoSetMap } from "~/services/blueprint.server";
import { ossFileUrl } from "~/utils/utils.server";

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

  return (
    <div className="flex flex-row justify-between gap-3">
      <div className="flex flex-col gap-3 flex-auto">
        <Card>
          <div className="flex flex-col gap-3">
            <div>搜索</div>
          </div>
        </Card>
        <Card>
          <List
            itemLayout="vertical"
            size="large"
            pagination={{
              onChange: (page) => {
                console.log(page);
              },
              total: loader.total,
              pageSize: 20,
            }}
            dataSource={loader.list}
            renderItem={(item) => (
              <List.Item key={item.id} style={{ padding: "16px 0" }}>
                <div className="flex flex-row justify-between">
                  <List.Item.Meta
                    title={item.title}
                    description={item.description}
                  />
                  {item.pic ? (
                    <div
                      style={{
                        borderRadius: "4px",
                        overflow: "hidden",
                        border: "1px solid " + token.colorBorderSecondary,
                        width: "120px",
                        height: "90px",
                      }}
                    >
                      <img src={item.pic}></img>
                    </div>
                  ) : undefined}
                </div>
                <div className="flex flex-row justify-between">
                  <div>
                    <Link to={"/users/" + item.user_id}>
                      <Typography.Text type="secondary">
                        {item.user.username}
                      </Typography.Text>
                    </Link>
                    <Divider type="vertical" />
                    <Typography.Text type="secondary">
                      <StarOutlined /> 1
                    </Typography.Text>
                    <Divider type="vertical" />
                    <Typography.Text type="secondary">
                      <CopyOutlined />
                    </Typography.Text>
                    <Divider type="vertical" />
                    <Typography.Text type="secondary">
                      <ShareAltOutlined />
                    </Typography.Text>
                  </div>
                  <div>
                    {(item.tags.length > 4
                      ? item.tags.slice(0, 4)
                      : item.tags
                    ).map((val) => {
                      return (
                        <Tag
                          bordered={false}
                          icon={
                            <Avatar
                              shape="square"
                              size="small"
                              src={
                                "/images/icons/item_recipe/" +
                                val.icon_path +
                                ".png"
                              }
                            />
                          }
                        >
                          {val.name}
                        </Tag>
                      );
                    })}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>
      </div>
      <div className="flex flex-col gap-3 min-w-64">
        <Card title="热门蓝图集" extra={<Button type="link">更多</Button>}>
          <List
            dataSource={[]}
            renderItem={(item) => {
              return <Button type="link">qqq</Button>;
            }}
          />
        </Card>
      </div>
    </div>
  );
}
