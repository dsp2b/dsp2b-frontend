import { IconPlus } from "@douyinfe/semi-icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Form,
  InputNumber,
  Popover,
  Toast,
} from "@douyinfe/semi-ui";
import { ActionFunction, LoaderFunction, json } from "@remix-run/node";
import { Form as RemixForm, useFetcher } from "@remix-run/react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import RecipePanel from "~/components/RecipePanel";
import {
  Buildings,
  GetRecipePanelResponse,
  ParseBlueprintResponse,
  Products,
  RecipePanelItem,
} from "~/services/blueprint";
import { CodeError, errBadRequest, errInternalServer } from "~/utils/errcode";

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
      }
    }
  }, [parse]);
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
                  { action: "/publish?action=parse", method: "POST" }
                );
              }
            }}
          />
          <Form.Input field="title" name="title" label={t("title")} />
          <Form.Input
            field="description"
            name="description"
            label={t("description")}
          />
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
                          "/images/icons/item_recipe/" + val.icon_path + ".png"
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
