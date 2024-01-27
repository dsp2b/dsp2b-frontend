import { LazyLoadImage } from "react-lazy-load-image-component";
import {
  Avatar,
  Button,
  Card,
  ConfigProvider,
  Divider,
  Form,
  Input,
  List,
  Radio,
  Select,
  Tag,
  Typography,
  message,
  theme,
} from "antd";
import RecipePanel from "../RecipePanel";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { blueprint, user } from "@prisma/client";
import { Link, useNavigate } from "@remix-run/react";
import DSPCover from "../DSPCover";
import { CopyOutlined, LikeOutlined } from "@ant-design/icons";
import { Building, Collection, Product } from "~/services/blueprint.server";
import { ResponsePrimse, replaceSearchParam, request } from "~/utils/api";
import { useLocale } from "remix-i18next";
import copy from "copy-to-clipboard";

export type tag = {
  item_id: number;
  name?: string;
  icon_path?: string;
};
export type BlueprintItem = blueprint & {
  user: user;
  tags: tag[];
  like_count: number;
  collection_collect: number;
} & {
  pic: string;
  src_pic_list?: string[];
  buildings?: Building[];
  products?: Product[];
  collections?: Collection[];
};

const BlueprintList: React.FC<{
  loader: {
    list: BlueprintItem[];
    total: number;
    sort?: string;
    keyword?: string;
    currentPage?: number;
    tags?: tag[];
  };
  sortButton?: React.ReactElement[];
}> = ({ loader, sortButton }) => {
  const [visibleTagPanel, setVisibleTagPanel] = useState(false);
  const [selectTags, setTags] = useState<tag[]>(loader.tags ? loader.tags : []);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const locale = useLocale();
  const uLocale = "/" + locale;

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
              {sortButton && sortButton}
              <Radio.Button value="latest">{t("latest")}</Radio.Button>
              <Radio.Button value="like">{t("most_like")}</Radio.Button>
              <Radio.Button value="collection">
                {t("most_collect")}
              </Radio.Button>
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
              <RecipePanel
                visible={visibleTagPanel}
                onClickOutSide={() => {
                  setVisibleTagPanel(false);
                }}
                onSelect={(val) => {
                  setTags((prevTags) => {
                    for (const tag of prevTags) {
                      if (tag.item_id == val.item_id) {
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
                    placeholder={t("search_by_tags")}
                    value={selectTags.map((tag) => tag.name)}
                    dropdownStyle={{ display: "none" }}
                    dropdownRender={() => <></>}
                    tagRender={(props) => {
                      const item = selectTags.find(
                        (tag) => tag.name == props.value
                      );
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
                          onClose={(v) => {
                            setTags((prevTags) => {
                              return prevTags.filter(
                                (tag) => tag.name != props.value
                              );
                            });
                          }}
                        >
                          {props.value}
                        </Tag>
                      );
                    }}
                  />
                </div>
              </RecipePanel>
              <Button
                type="primary"
                onClick={() => {
                  navigate({
                    search: replaceSearchParam(location.search, {
                      keyword: form.getFieldValue("keyword") || "",
                      tags: selectTags.map((v) => v.item_id),
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
      <Card>
        <ConfigProvider
          theme={{
            token: {
              screenXXL: 1700,
            },
          }}
        >
          <List
            grid={{
              gutter: 16,
              column: 4,
              xs: 1,
              sm: 1,
              md: 2,
              lg: 2,
              xl: 4,
              xxl: 5,
            }}
            dataSource={loader.list}
            pagination={{
              total: loader.total,
              pageSize: 30,
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
              <List.Item>
                <Card
                  style={{ width: "280px", overflow: "hidden" }}
                  cover={
                    <Link to={uLocale + "/blueprint/" + item.id}>
                      {!item.pic && item.tags && item.tags.length ? (
                        <DSPCover
                          items={item.tags}
                          style={{
                            width: "280px",
                            height: 200,
                          }}
                        />
                      ) : (
                        <LazyLoadImage
                          style={{
                            height: "200px",
                            borderRadius: 0,
                            objectFit: "contain",
                          }}
                          height={"200px"}
                          width={"100%"}
                          src={
                            item.pic
                              ? item.pic
                              : "https://media.st.dl.eccdnx.com/steam/apps/1366540/header_schinese.jpg?t=1702624498"
                          }
                        />
                      )}
                    </Link>
                  }
                  bodyStyle={{
                    padding: "12px",
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Link to={uLocale + "/blueprint/" + item.id}>
                        {item.title}
                      </Link>
                    }
                    description={
                      <Typography.Text type="secondary" ellipsis>
                        {item.description}
                      </Typography.Text>
                    }
                  />
                  <div className="flex flex-row justify-between mt-2">
                    <div>
                      <Link to={uLocale + "/user/" + item.user.id}>
                        <Typography.Text type="secondary">
                          {item.user.username}
                        </Typography.Text>
                      </Link>
                    </div>
                    <div>
                      <Typography.Text type="secondary">
                        <CopyOutlined
                          className="cursor-pointer"
                          onClick={async () => {
                            message.info(t("loading..."));
                            const resp = await request("$lng.blueprint.$id", {
                              params: {
                                lng: locale,
                                id: item.id,
                              },
                            });
                            if (resp.status != 200) {
                              message.error(t("error"));
                              return;
                            }
                            const data = (await resp.json()) as {
                              blueprint: blueprint;
                            };
                            copy(data.blueprint.blueprint);
                            message.success(t("copy_success"));
                          }}
                        />
                      </Typography.Text>
                      <Divider type="vertical" />
                      <Typography.Text type="secondary">
                        <LikeOutlined /> {item.like_count}
                      </Typography.Text>
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </ConfigProvider>
      </Card>
    </div>
  );
};

export default BlueprintList;
