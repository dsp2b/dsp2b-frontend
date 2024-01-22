import {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
  json,
} from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PicCard } from "~/components/PicCard";
import RecipePanel from "~/components/RecipePanel";
import {
  Building,
  ParseBlueprintResponse,
  Product,
  RecipePanelItem,
  blueprintPicList,
  blueprintProducts,
  BlueprintSvc,
  blueprintTags,
  parseBlueprint,
} from "~/services/blueprint.server";
import { post } from "~/utils/api";
import {
  CodeError,
  errBadRequest,
  errInternalServer,
  errNotFound,
} from "~/utils/errcode";
import { APIDataResponse } from "~/services/api";
import { authenticator } from "~/services/auth.server";
import {
  CollectionTree,
  buildSelectTree,
  collectionTree,
} from "./$lng.create.collection.$(id)";
import { ErrBuleprint, ErrUser } from "~/code/user";
import prisma from "~/db.server";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
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
import { blueprint } from "@prisma/client";
import { BlueprintItem } from "~/components/BlueprintList";
import { upload } from "~/utils/utils.client";
import i18next from "~/i18next.server";
import { useLocale } from "remix-i18next";

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  const id = params["id"];
  let blueprint: BlueprintItem | null = null;
  if (id) {
    blueprint = (await prisma.blueprint.findUnique({
      where: {
        id: id,
      },
    })) as BlueprintItem;
    if (!blueprint || user.id != blueprint.user_id) {
      return errNotFound(request, ErrBuleprint.NotFound);
    }
    const svc = new BlueprintSvc(blueprint);
    blueprint.tags = blueprintTags(blueprint.tags_id);
    blueprint.src_pic_list = blueprint.pic_list;
    blueprint.pic_list = blueprintPicList(blueprint.pic_list);
    blueprint.buildings = JSON.parse(blueprint.buildings);
    blueprint.products = await blueprintProducts(blueprint);
    blueprint.collections = await svc.getColletcion(user.id);
  }
  const t = await i18next.getFixedT(request);
  return json({
    tree: await collectionTree(user),
    blueprint,
    i18n: {
      title: id ? t("update_blueprint") : t("create_blueprint"),
    },
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: data.i18n.title + " - DSP2B",
    },
  ];
};

export const action: ActionFunction = async ({ request, params }) => {
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
        const user = await authenticator.isAuthenticated(request, {
          failureRedirect: "/login",
        });
        if (!user) {
          return errBadRequest(request, ErrUser.UserNotLogin);
        }
        const id = params["id"];
        let oldBlueprint: blueprint | null = null;
        if (id) {
          oldBlueprint = await prisma.blueprint.findUnique({
            where: {
              id: id,
            },
          });
          if (!oldBlueprint || user.id != oldBlueprint.user_id) {
            return errNotFound(request, ErrBuleprint.NotFound);
          }
        }
        const data = (await request.json()) as {
          title: string;
          description: string;
          blueprint: string;
          pic_list?: string[];
          original?: boolean;
          tags?: Array<{ item_id: number }>;
          products?: Product[];
          collections?: string[];
        };
        // 校验蓝图集
        if (data.collections) {
          const collections = await prisma.collection.findMany({
            where: {
              user_id: user.id,
              id: {
                in: data.collections,
              },
            },
          });
          if (collections.length != data.collections.length) {
            return errBadRequest(request, ErrBuleprint.CollectionInvalid);
          }
        }
        const resp = await parseBlueprint(data.blueprint);
        if (resp.status != 200) {
          return errBadRequest(request, ErrBuleprint.BlueprintInvalid);
        }
        const respData = (await resp.json()) as ParseBlueprintResponse;
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
          .$transaction(
            async (tx) => {
              const tags: Array<number> = [];
              data.tags &&
                data.tags.forEach((val) => {
                  tags.push(val.item_id);
                });
              let blueprint: blueprint;
              if (!oldBlueprint) {
                blueprint = await tx.blueprint.create({
                  data: {
                    title: data.title,
                    description: data.description,
                    blueprint: data.blueprint,
                    tags_id: tags,
                    pic_list: data.pic_list,
                    original: data.original ? 1 : 2,
                    user_id: user.id,
                    game_version: respData.data.blueprint.GameVersion,
                    buildings: JSON.stringify(respData.data.buildings),
                  },
                });
              } else {
                // 清理老数据
                await tx.blueprint_collection.deleteMany({
                  where: {
                    collection: {
                      user_id: user.id,
                    },
                    blueprint_id: oldBlueprint.id,
                  },
                });
                await tx.blueprint_product.deleteMany({
                  where: {
                    blueptint_id: oldBlueprint.id,
                  },
                });
                blueprint = await tx.blueprint.update({
                  where: {
                    id: oldBlueprint.id,
                  },
                  data: {
                    title: data.title,
                    description: data.description,
                    blueprint: data.blueprint,
                    tags_id: tags,
                    pic_list: data.pic_list,
                    original: data.original ? 1 : 2,
                    user_id: user.id,
                    game_version: respData.data.blueprint.GameVersion,
                    buildings: JSON.stringify(respData.data.buildings),
                    updatetime: new Date(),
                  },
                });
              }
              if (data.products) {
                await Promise.all(
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
              }
              // 关联蓝图集
              data.collections &&
                data.collections.length &&
                (await tx.blueprint_collection.createMany({
                  data: data.collections.map((val) => {
                    return {
                      blueprint_id: blueprint.id,
                      collection_id: val,
                    };
                  }),
                }));
              return blueprint;
            },
            { timeout: 60 * 1000 }
          )
          .then((resp) => {
            return { id: resp.id };
          });
      }
    }
    return errBadRequest(request, -1);
  } catch (e) {
    console.error(e);
    return errInternalServer(request, -2);
  }
};

export default function CreateBlueprint() {
  const { tree, blueprint } = useLoaderData<{
    tree: CollectionTree[];
    blueprint?: BlueprintItem;
  }>();
  const fetcher = useFetcher<CodeError>({ key: "create" });
  const parse = useFetcher<ParseBlueprintResponse>({ key: "parse" });
  const [formRef] = Form.useForm();
  const { t } = useTranslation();
  const [buildings, setBuildings] = useState<Building[]>(
    blueprint?.buildings || []
  );
  const [products, setProducts] = useState<Product[]>(
    blueprint?.products || []
  );
  const [visiblePanel, setVisiblePanel] = useState(false);
  const [visibleTagPanel, setVisibleTagPanel] = useState(false);
  //@ts-ignore
  const [tags, setTags] = useState<RecipePanelItem[]>(blueprint?.tags || []);
  const sensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 },
  });
  const uLocale = "/" + useLocale();

  useEffect(() => {
    if (fetcher.state == "idle" && fetcher.data) {
      if (fetcher.data.code) {
        message.warning(fetcher.data.msg);
      } else {
        message.success(
          t(blueprint ? "blueprint_update_success" : "blueprint_create_success")
        );
        window.location.href = uLocale + "/blueprint/" + fetcher.data.id;
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
                item_id: val.item_id,
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

  const [picList, setPicList] = useState<UploadFile[]>(
    blueprint
      ? blueprint.pic_list?.map((val, index) => {
          return {
            response: { url: blueprint.src_pic_list![index] },
            uid: index.toString(),
            name: val,
            url: val,
            status: "done",
          };
        })
      : []
  );

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
      <Form
        layout="vertical"
        form={formRef}
        initialValues={
          blueprint
            ? {
                blueprint: blueprint.blueprint,
                title: blueprint.title,
                description: blueprint.description,
                collections: blueprint.collections?.map((val) => val.id),
                original: blueprint.original == 1,
              }
            : undefined
        }
      >
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
        <Form.Item name="collections" label={t("blueprint_collection")}>
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
                      upload(data.data, req.file, t, req);
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
                  const index = p.findIndex((v) => v.item_id == val.item_id);
                  if (index == -1) {
                    p.push({
                      item_id: val.item_id,
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
        <Form.Item name="original" valuePropName="checked">
          <Checkbox>{t("original_desc")}</Checkbox>
        </Form.Item>
        <div className="flex flex-row-reverse mt-2">
          <Button
            type="primary"
            loading={fetcher.state != "idle"}
            onClick={() => {
              const data = formRef.getFieldsValue();
              if (blueprint?.id) {
                data.id = blueprint.id;
              }
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
            {blueprint ? t("update") : t("submit")}
          </Button>
        </div>
      </Form>
    </Card>
  );
}