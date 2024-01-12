import { ActionFunction, LoaderFunction, json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PicCard } from "~/components/PicCard";
import RecipePanel from "~/components/RecipePanel";
import {
  Buildings,
  ParseBlueprintResponse,
  Products,
  RecipePanelItem,
  parseBlueprint,
} from "~/services/blueprint.server";
import { post } from "~/utils/api";
import { CodeError, errBadRequest, errInternalServer } from "~/utils/errcode";
import { APIDataResponse } from "~/services/api";
import { authenticator } from "~/services/auth.server";
import {
  CollectionTree,
  buildSelectTree,
  collectionTree,
} from "./create.collection";
import { ErrBuleprint } from "~/code/user";
import prisma from "~/db.server";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Popover,
  Select,
  Space,
  Tag,
  TreeSelect,
  Typography,
  Upload,
  UploadFile,
  message,
} from "antd";
import {
  CloseCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
} from "@dnd-kit/core";
import { RcFile } from "antd/es/upload";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  return json({ tree: await collectionTree(user) });
};

export const action: ActionFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  try {
    if (request.method === "POST") {
      const url = new URL(request.url);
      const action = url.searchParams.get("action");
      if (action) {
        const formData = await request.formData();
        if (action == "parse") {
          return await parseBlueprint(formData.get("blueprint") as string);
        } else if (action == "recipe_panel") {
          const resp = await fetch(
            process.env.RPC_URL! + "/blueprint/recipe_panel",
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          return resp;
        }
      } else {
        const data = (await request.json()) as {
          title: string;
          description: string;
          blueprint: string;
          pic_list?: string[];
          tags?: Array<{ id: number }>;
          products?: Products[];
          collections: string[];
        };
        const resp = await parseBlueprint(data.blueprint);
        if (resp.status != 200) {
          return errBadRequest(request, ErrBuleprint.BlueprintInvalid);
        }
        if (data.title.length > 20 || data.title.length < 2) {
          return errBadRequest(request, ErrBuleprint.TitleInvalid);
        }
        if (data.description.length > 1024 * 1024 * 100) {
          return errBadRequest(request, ErrBuleprint.DescriptionInvalid);
        }
        if (data.pic_list && data.pic_list.length > 10) {
          return errBadRequest(request, ErrBuleprint.PicListInvalid);
        }
        return prisma
          .$transaction(async (tx) => {
            const tags: Array<number> = [];
            data.tags &&
              data.tags.forEach((val) => {
                tags.push(val.id);
              });
            let blueprint = await tx.blueprint.create({
              data: {
                title: data.title,
                description: data.description,
                blueprint: data.blueprint,
                tags_id: tags,
                pic_list: data.pic_list,
                user_id: user.id,
              },
            });
            // 插入产物
            data.products?.forEach((val) => {});
            if (data.products) {
              const productIds = await Promise.all(
                data.products.map((val) => {
                  return tx.blueprint_product
                    .create({
                      data: {
                        blueptint_id: blueprint.id,
                        item_id: val.item_id,
                        count: val.count,
                      },
                    })
                    .then((p) => p.id);
                })
              );
              await tx.blueprint.update({
                where: {
                  id: blueprint.id,
                },
                data: {
                  product_id: productIds,
                },
              });
            }
            // 关联蓝图集
            data.collections &&
              (await tx.blueprint_collection.createMany({
                data: data.collections.map((val) => {
                  return {
                    blueprint_id: blueprint.id,
                    collection_id: val,
                  };
                }),
              }));
            return blueprint;
          })
          .then((resp) => {
            return { id: resp.id };
          });
      }
    }
    return errBadRequest(request, -1);
  } catch (e) {
    return errInternalServer(request, -2);
  }
};

export default function CreateBlueprint() {
  const { tree } = useLoaderData<{
    tree: CollectionTree[];
  }>();
  const fetcher = useFetcher<CodeError>({ key: "create" });
  const parse = useFetcher<ParseBlueprintResponse>({ key: "parse" });
  const [formRef] = Form.useForm();
  const { t } = useTranslation();
  const [buildings, setBuildings] = useState<Buildings[]>([]);
  const [products, setProducts] = useState<Products[]>([]);
  const [visiblePanel, setVisiblePanel] = useState(false);
  const [visibleTagPanel, setVisibleTagPanel] = useState(false);
  const [tags, setTags] = useState<RecipePanelItem[]>([]);
  const sensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 },
  });

  useEffect(() => {
    if (fetcher.state == "idle" && fetcher.data) {
      if (fetcher.data.code) {
        message.warning(fetcher.data.msg);
      } else {
        message.success(t("blueprint_create_success"));
        window.location.href = "/blueprint/" + fetcher.data.id;
      }
    }
  }, [fetcher]);

  useEffect(() => {
    if (parse.state == "idle" && parse.data) {
      if (parse.data.code) {
        message.warning(parse.data.msg);
      } else {
        const title = formRef.getFieldValue("title");
        if (!title) {
          formRef.setFieldValue("title", parse.data.data.blueprint.ShortDesc);
        }
        const description = formRef.getFieldValue("description");
        if (!description) {
          formRef.setFieldValue("description", parse.data.data.blueprint.Desc);
        }
        setBuildings(parse.data.data.buildings);
        if (!products.length) {
          setProducts(parse.data.data.products);
        }
        if (!tags.length) {
          const tags: RecipePanelItem[] = [];
          parse.data.data.products.forEach((val) => {
            if (val.count > 0) {
              tags.push({
                id: val.item_id,
                name: val.name,
                icon_path: val.icon_path,
              });
            }
          });
          setTags(tags);
        }
      }
    }
  }, [parse]);

  const [picList, setPicList] = useState<UploadFile[]>([]);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setPicList((prev) => {
        const activeIndex = prev.findIndex((i) => i.uid === active.id);
        const overIndex = prev.findIndex((i) => i.uid === over?.id);
        return arrayMove(prev, activeIndex, overIndex);
      });
    }
  };

  return (
    <Card title={t("create_blueprint")} size="small">
      <Form layout="vertical" form={formRef}>
        <Form.Item name="blueprint" label={t("blueprint_data")}>
          <Input.TextArea
            onBlur={() => {
              // 解析蓝图数据
              const blueprint = formRef.getFieldValue("blueprint");
              if (blueprint) {
                parse.submit(
                  {
                    blueprint: blueprint,
                  },
                  { action: "?action=parse", method: "POST" }
                );
              }
            }}
          />
        </Form.Item>
        <Form.Item name="collections" label={t("blueprint_collections")}>
          <TreeSelect
            className="w-full"
            treeData={buildSelectTree(tree as unknown as CollectionTree[])}
            multiple
          />
        </Form.Item>
        <Form.Item label={t("blueprint_tags")}>
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
              onClick={() => {
                setVisibleTagPanel(true);
              }}
            >
              <Select
                className="w-full py-1"
                mode="multiple"
                allowClear
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
        </Form.Item>
        <Divider />
        <Form.Item name="title" label={t("title")}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label={t("description")}>
          <Input.TextArea />
        </Form.Item>
        <Form.Item
          label={t("please_upload_cover_picture")}
          valuePropName="fileList"
        >
          <DndContext sensors={[sensor]} onDragEnd={onDragEnd}>
            <SortableContext
              items={picList.map((i) => i.uid)}
              strategy={verticalListSortingStrategy}
            >
              <Upload
                maxCount={10}
                multiple
                fileList={picList}
                accept="image/*"
                listType="picture-card"
                onChange={({ fileList }) => {
                  setPicList(fileList);
                }}
                customRequest={(req) => {
                  if (!req) {
                    return;
                  }
                  // pre sign
                  post("upload", {
                    filename: (req.file as RcFile).name,
                  }).then(async (resp) => {
                    if (resp.status !== 200) {
                      message.error(t("system_error"));
                      req.onError &&
                        req.onError({
                          status: 500,
                          name: "错误",
                          message: t("system_error"),
                        });
                      return;
                    }
                    const data = (await resp.json()) as APIDataResponse<{
                      postURL: string;
                      formData: { [key: string]: string };
                    }>;
                    if (data.code) {
                      message.error(data.msg);
                      req.onError &&
                        req.onError({
                          status: 500,
                          name: "错误",
                          message: data.msg,
                        });
                      return;
                    } else {
                      // 上传文件
                      const formData = new FormData();
                      for (const key in data.data.formData) {
                        formData.append(key, data.data.formData[key]);
                      }
                      formData.append("file", req.file);
                      const xhr = new XMLHttpRequest();
                      xhr.open("POST", data.data.postURL);
                      xhr.onprogress = (e) => {
                        req.onProgress &&
                          req.onProgress({
                            percent: Math.round((e.loaded / e.total) * 100),
                          });
                      };
                      xhr.onerror = (e) => {
                        req.onError &&
                          req.onError({
                            status: xhr.status,
                            name: "上传错误",
                            message: data.msg,
                          });
                      };
                      xhr.onload = (e) => {
                        if (xhr.status >= 400) {
                          message.warning(t("file_upload_failed"));
                          req.onError &&
                            req.onError({
                              status: xhr.status,
                              name: "上传错误",
                              message: data.msg,
                            });
                          return;
                        }
                        message.success(t("file_upload_success"));
                        req.onSuccess &&
                          req.onSuccess({
                            url: data.data.formData.key,
                          });
                      };
                      xhr.send(formData);
                    }
                  });
                }}
                itemRender={(originNode, file) => {
                  return <PicCard originNode={originNode} file={file} />;
                }}
              >
                <PlusOutlined className="text-xl" />
              </Upload>
            </SortableContext>
          </DndContext>
        </Form.Item>
        <Form.Item label={t("buildings")}>
          <div className="flex flex-row gap-5 bg-gray-500 dark:bg-gray-700 py-4 px-2 flex-wrap">
            {buildings.map((val) => {
              return (
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
              );
            })}
          </div>
        </Form.Item>
        <Form.Item label={t("products")}>
          <div className="flex flex-row gap-5 bg-gray-500 dark:bg-gray-700 py-4 px-2 flex-wrap items-center">
            {products
              .sort((a, b) => b.count - a.count)
              .map((val, index) => {
                return (
                  <Popover
                    placement="rightTop"
                    content={
                      <Button
                        type="text"
                        icon={
                          <DeleteOutlined
                            color="red"
                            onClick={() => {
                              setProducts((p) => {
                                p.splice(index, 1);
                                return [...p];
                              });
                            }}
                            className="cursor-pointer"
                          />
                        }
                      >
                        {t("delete")}
                      </Button>
                    }
                  >
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
                          src={
                            "/images/icons/item_recipe/" +
                            val.icon_path +
                            ".png"
                          }
                          style={{
                            height: 40,
                            width: 40,
                          }}
                          alt={val.name}
                        >
                          {val.name}
                        </Avatar>
                      </Badge>
                      <InputNumber
                        className="w-20"
                        value={val.count}
                        onChange={(value) => {
                          setProducts((p) => {
                            p[index].count = value as number;
                            return [...p];
                          });
                        }}
                      />
                    </div>
                  </Popover>
                );
              })}
            <RecipePanel
              visible={visiblePanel}
              onClickOutSide={() => {
                setVisiblePanel(false);
              }}
              onSelect={(val) => {
                setProducts((p) => {
                  const index = p.findIndex((v) => v.item_id == val.id);
                  if (index == -1) {
                    p.push({
                      item_id: val.id,
                      name: val.name,
                      icon_path: val.icon_path,
                      count: 0,
                    });
                  } else {
                    message.warning(t("product_exist"));
                  }
                  return [...p];
                });
                setVisiblePanel(false);
              }}
            >
              <PlusOutlined
                className="text-xl"
                style={{
                  cursor: "pointer",
                }}
                onClick={() => {
                  setVisiblePanel(true);
                }}
              />
            </RecipePanel>
          </div>
        </Form.Item>
        <div className="flex flex-row-reverse mt-2">
          <Button
            loading={fetcher.state != "idle"}
            onClick={() => {
              const data = formRef.getFieldsValue();
              data.products = products;
              data.pic_list = [];
              picList.forEach((val) => {
                if (val.response) {
                  data.pic_list.push(val.response.url);
                }
              });
              data.tags = tags;
              fetcher.submit(data, {
                method: "POST",
                encType: "application/json",
              });
            }}
          >
            {t("submit")}
          </Button>
        </div>
      </Form>
    </Card>
  );
}
