import { collection, user } from "@prisma/client";
import { tag } from "../BlueprintList";
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
import { LikeOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "@remix-run/react";
import form from "antd/es/form";
import dayjs from "dayjs";
import { t } from "i18next";
import { replaceSearchParam } from "~/utils/api";
import { useTranslation } from "react-i18next";
import { useLocale } from "remix-i18next";

export type CollectionListItem = collection & {
  blueprint_count: number;
  like_count: number;
  user: user;
};

export type LoaderData = {
  list: CollectionListItem[];
  total: number;
  keyword: string;
  currentPage: number;
  sort: string;
};

const CollectionList: React.FC<{
  loader: {
    list: CollectionListItem[];
    total: number;
    sort?: string;
    keyword?: string;
    currentPage?: number;
    tags?: tag[];
  };
}> = ({ loader }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const uLocale = "/" + useLocale();
  return (
    <div className="flex flex-col gap-3 flex-auto">
      <Card bodyStyle={{ padding: "10px" }}>
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 2 }}
          wrapperCol={{ span: 20 }}
          initialValues={{ sort: loader.sort, keyword: loader.keyword }}
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
          <Form.Item name="keyword" label={t("search")} className="!mb-2">
            <div className="flex flex-row gap-3">
              <Input
                name="keyword"
                defaultValue={loader.keyword}
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
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={
                  <Link to={uLocale + "/collection/" + item.id}>
                    {item.title}
                  </Link>
                }
                description={item.description || "-"}
              />
              <div className="flex flex-row items-center">
                <Link to={uLocale + "/user/" + item.user_id}>
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
  );
};

export default CollectionList;
