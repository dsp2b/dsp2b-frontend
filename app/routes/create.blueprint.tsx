import { IconClose, IconPlus } from "@douyinfe/semi-icons";
import {
  Avatar,
  Badge,
  Card,
  Form,
  InputNumber,
  Popover,
  Tag,
  TagInput,
  Toast,
  Upload,
} from "@douyinfe/semi-ui";
import { FileItem } from "@douyinfe/semi-ui/lib/es/upload";
import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { Form as RemixForm, useFetcher } from "@remix-run/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useTranslation } from "react-i18next";
import { PicCard } from "~/components/PicCard";
import RecipePanel from "~/components/RecipePanel";
import {
  Buildings,
  GetRecipePanelResponse,
  ParseBlueprintResponse,
  Products,
  RecipePanelItem,
} from "~/services/blueprint";
import { post } from "~/utils/api";
import { CodeError, errBadRequest, errInternalServer } from "~/utils/errcode";
import { APIDataResponse } from "~/services/api";
import { authenticator } from "~/services/auth.server";

export const loader: LoaderFunction = ({ request }) => {
  return authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });
};

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      const url = new URL(request.url);
      const formData = await request.formData();
      const action = url.searchParams.get("action");
      if (action == "parse") {
        const resp = await fetch(process.env.RPC_URL! + "/blueprint/parse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            blueprint: formData.get("blueprint"),
          }),
        });
        return resp;
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
    }
    return errBadRequest(request, -1);
  } catch (e) {
    return errInternalServer(request, -2);
  }
};

export default function Publish() {
  const fetcher = useFetcher<CodeError>({ key: "publish" });
  const parse = useFetcher<ParseBlueprintResponse>({ key: "parse" });
  const panel = useFetcher<GetRecipePanelResponse>({ key: "panel" });
  const formRef = useRef<Form>(null);
  const { t } = useTranslation();
  const [buildings, setBuildings] = useState<Buildings[]>([]);
  const [products, setProducts] = useState<Products[]>([]);
  const [visiblePanel, setVisiblePanel] = useState(false);
  const [visibleTagPanel, setVisibleTagPanel] = useState(false);
  const [tags, setTags] = useState<RecipePanelItem[]>([]);

  useEffect(() => {
    if (parse.state == "idle" && parse.data) {
      if (parse.data.code) {
        Toast.warning(parse.data.msg);
      } else {
        const title = formRef.current!.formApi.getValue("title");
        if (!title) {
          formRef.current!.formApi.setValue(
            "title",
            parse.data.data.blueprint.ShortDesc
          );
        }
        const description = formRef.current!.formApi.getValue("description");
        if (!description) {
          formRef.current!.formApi.setValue(
            "description",
            parse.data.data.blueprint.Desc
          );
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

  const [picList, setPicList] = useState<FileItem[]>([]);

  const moveCard = useCallback((dragIndex: number, hoverIndex: number) => {
    setPicList((prevPic: FileItem[]) =>
      prevPic.map((item, index) => {
        if (index === dragIndex) {
          return prevPic[hoverIndex];
        }
        if (index === hoverIndex) {
          return prevPic[dragIndex];
        }
        return item;
      })
    );
  }, []);

  return (
    <Card
      title={t("publish")}
      headerStyle={{
        padding: "6px 12px",
      }}
    >
      <Form ref={formRef}>
        <RemixForm navigate={false} fetcherKey="publish">
          <Form.TextArea
            field="blueprint"
            name="blueprint"
            label={t("blueprint_data")}
            onBlur={() => {
              // 解析蓝图数据
              const blueprint = formRef.current!.formApi.getValue("blueprint");
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
          <Form.Select
            field="collections"
            name="collections"
            label={t("blueprint_collections")}
            className="w-full"
          />
          <Form.Label className="!my-2">{t("blueprint_tags")}</Form.Label>
          <RecipePanel
            visible={visibleTagPanel}
            onClickOutSide={() => {
              setVisibleTagPanel(false);
            }}
            onSelect={(val) => {
              setTags((prevTags) => {
                for (const tag of prevTags) {
                  if (tag.id == val.id) {
                    Toast.warning(t("tag_exist"));
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
              <TagInput
                className="w-full py-1"
                value={tags.map((tag) => tag.name)}
                renderTagItem={(val, index) => {
                  const item = tags.find((tag) => tag.name == val);
                  return (
                    <Tag
                      avatarSrc={
                        "/images/icons/item_recipe/" + item!.icon_path + ".png"
                      }
                      size="large"
                      className="mr-2"
                      closable
                      style={{ padding: "14px 5px" }}
                    >
                      {val}
                    </Tag>
                  );
                }}
              />
            </div>
          </RecipePanel>
          <Form.Section />
          <Form.Input field="title" name="title" label={t("title")} />
          <Form.Input
            field="description"
            name="description"
            label={t("description")}
          />
          <DndProvider backend={HTML5Backend}>
            <Upload
              prompt={<div>{t("please_upload_cover_picture")}</div>}
              limit={10}
              maxSize={4096}
              multiple
              fileList={picList}
              accept="image/*"
              promptPosition={"bottom"}
              listType="picture"
              draggable={true}
              onChange={({ fileList }) => {
                setPicList(fileList);
              }}
              customRequest={(req) => {
                // pre sign
                post("upload", {
                  filename: req.fileName,
                  uid: req.file.uid,
                })
                  .then((resp) => {
                    return resp.json();
                  })
                  .then(
                    (
                      data: APIDataResponse<{
                        postURL: string;
                        formData: { [key: string]: string };
                      }>
                    ) => {
                      if (data.code) {
                        Toast.error(data.msg);
                        req.onError({});
                        return;
                      } else {
                        // 上传文件
                        const formData = new FormData();
                        for (const key in data.data.formData) {
                          formData.append(key, data.data.formData[key]);
                        }
                        formData.append("file", req.fileInstance);
                        const xhr = new XMLHttpRequest();
                        xhr.open("POST", data.data.postURL);
                        xhr.onprogress = (e) => {
                          req.onProgress({
                            total: e.total,
                            loaded: e.loaded,
                          });
                        };
                        xhr.onerror = (e) => {
                          req.onError(xhr);
                        };
                        xhr.onload = (e) => {
                          if (xhr.status >= 400) {
                            Toast.warning(t("file_upload_failed"));
                            req.onError(xhr);
                            return;
                          }
                          Toast.success(t("file_upload_success"));
                          req.onSuccess({
                            url: data.data.formData.key,
                            uid: req.file.uid,
                          });
                        };
                        xhr.send(formData);
                      }
                    }
                  );
              }}
              renderThumbnail={(renderProps) => {
                return (
                  <PicCard
                    key={renderProps.uid}
                    index={renderProps.index || 0}
                    moveCard={moveCard}
                    src={renderProps.url!}
                    id={renderProps.uid}
                  />
                );
              }}
            >
              <IconPlus size="extra-large" />
            </Upload>
          </DndProvider>
          <Form.Label className="!my-2">{t("buildings")}</Form.Label>
          <div className="flex flex-row gap-5 bg-gray-500 dark:bg-gray-700 py-4 px-2 flex-wrap">
            {buildings.map((val) => {
              return (
                <Badge
                  count={val.count}
                  overflowCount={999}
                  position="rightTop"
                  theme="inverted"
                  type="primary"
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
              );
            })}
          </div>
          <Form.Label className="!my-2">{t("products")}</Form.Label>
          <div className="flex flex-row gap-5 bg-gray-500 dark:bg-gray-700 py-4 px-2 flex-wrap items-center">
            {products
              .sort((a, b) => b.count - a.count)
              .map((val, index) => {
                return (
                  <Popover
                    position="topRight"
                    content={
                      <IconClose
                        onClick={() => {
                          setProducts((p) => {
                            p.splice(index, 1);
                            return [...p];
                          });
                        }}
                        className="text-red-500 cursor-pointer"
                      />
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
                        position="rightTop"
                        theme="inverted"
                        type={val.count >= 0 ? "success" : "warning"}
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
                        innerButtons
                        value={val.count}
                        inputStyle={{ textAlign: "center" }}
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
                    Toast.warning(t("product_exist"));
                  }
                  return [...p];
                });
                setVisiblePanel(false);
              }}
            >
              <IconPlus
                size="extra-large"
                style={{
                  cursor: "pointer",
                }}
                onClick={() => {
                  setVisiblePanel(true);
                }}
              />
            </RecipePanel>
          </div>
        </RemixForm>
      </Form>
    </Card>
  );
}
