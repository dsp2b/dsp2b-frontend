import { FileOutlined, LikeOutlined } from "@ant-design/icons";
import { collection, user } from "@prisma/client";
import { LoaderFunction } from "@remix-run/node";
import { Link, json, useLoaderData, useNavigate } from "@remix-run/react";
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  List,
  Radio,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import prisma from "~/db.server";
import { authenticator } from "~/services/auth.server";
import { replaceSearchParam } from "~/utils/api";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1") || 1;
  const user_id = url.searchParams.get("user");
  const sort = url.searchParams.get("sort") || "latest";
  const keyword = url.searchParams.get("keyword") || "";
  const blueprint = url.searchParams.get("blueprint") || "";
  const user = await authenticator.isAuthenticated(request);
  const where: any = { public: 1 };
  if (user_id) {
    if (user_id == user?.id) {
      delete where.public;
    }
    where.user_id = user_id;
  }
  if (keyword) {
    where.title = {
      contains: keyword,
    };
  }
  if (blueprint) {
    where.blueprint_collection = {
      some: {
        blueprint_id: blueprint,
      },
    };
  }
  const orderBy: any = {};
  switch (sort) {
    case "like":
      orderBy.collection_like = {
        _count: "desc",
      };
      break;
    default:
      orderBy.createtime = "desc";
      break;
  }

  const list = await prisma.collection.findMany({
    where,
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
    orderBy,
  });

  const total = await prisma.collection.count({
    where,
  });

  await Promise.all(
    list.map(async (val: any) => {
      const count = await prisma.blueprint_collection.count({
        where: {
          collection_id: val.id,
        },
      });
      val.blueprint_count = count;
      const like = await prisma.collection_like.count({
        where: {
          collection_id: val.id,
        },
      });
      val.like_count = like;
    })
  );

  return json({
    list: list,
    total: total,
    currentPage: page,
    sort,
    keyword,
  });
};

type ListItem = collection & {
  blueprint_count: number;
  like_count: number;
  user: user;
};

type LoaderData = {
  list: ListItem[];
  total: number;
  keyword: string;
  currentPage: number;
  sort: string;
};

export default function Collection() {
  const loader = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form] = Form.useForm();

  return (
    <div className="flex flex-row justify-between gap-3">
      <div className="flex flex-col gap-3 flex-auto">
        <Card bodyStyle={{ padding: "10px" }}>
          <Form
            form={form}
            layout="horizontal"
            labelCol={{ span: 2 }}
            wrapperCol={{ span: 20 }}
            initialValues={{ sort: loader.sort }}
          >
            <Form.Item label={t("sort_by")} name="sort" className="!mb-2">
              <Radio.Group
                buttonStyle="solid"
                onChange={(val) => {
                  navigate({
                    search: replaceSearchParam(location.search, {
                      sort: val.target.value,
                    }),
                  });
                }}
              >
                <Radio.Button value="latest">{t("latest")}</Radio.Button>
                <Radio.Button value="like">{t("most_like")}</Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item label={t("search")} className="!mb-2">
              <div className="flex flex-row gap-3">
                <Input
                  placeholder={t("search_by_keyword")}
                  className="!w-1/3"
                />
                <Button
                  type="primary"
                  onClick={() => {
                    navigate({
                      search: replaceSearchParam(location.search, {
                        keyword: form.getFieldValue("keyword") || "",
                      }),
                    });
                  }}
                >
                  {t("search")}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>
        <Card
          bodyStyle={{
            padding: "10px",
          }}
        >
          <List
            dataSource={loader.list}
            pagination={{
              total: loader.total,
              pageSize: 20,
              current: loader.currentPage,
              onChange(page, pageSize) {
                navigate({
                  search: replaceSearchParam(location.search, {
                    page,
                  }),
                });
              },
            }}
            renderItem={(item) => (
              <List.Item
                className="flex flex-col w-full"
                style={{
                  alignItems: "start",
                }}
              >
                <List.Item.Meta
                  style={{
                    width: "100%",
                  }}
                  title={
                    <Link to={"/collection/" + item.id}>{item.title}</Link>
                  }
                  description={item.description || "-"}
                />
                <div className="flex flex-row items-center">
                  <Link to={"/user/" + item.user_id}>
                    <Typography.Text type="secondary">
                      {item.user.username}
                    </Typography.Text>
                  </Link>
                  <Divider type="vertical" />
                  <Typography.Text type="secondary">
                    {dayjs(item.createtime).format("YYYY-MM-DD HH:mm:ss")}
                  </Typography.Text>
                  <Divider type="vertical" />
                  <Typography.Text type="secondary">
                    <LikeOutlined /> {item.like_count}
                  </Typography.Text>
                </div>
              </List.Item>
            )}
          />
        </Card>
      </div>
    </div>
  );
}
