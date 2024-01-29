import { useTranslation } from "react-i18next";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { APIDataResponse } from "~/services/api";
import {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
  json,
  redirect,
} from "@remix-run/node";
import { errBadRequest, errNotFound } from "~/utils/errcode";
import { ErrCollection, ErrUser } from "~/code/user";
import { authenticator } from "~/services/auth.server";
import prisma from "~/db.server";
import { success } from "~/utils/httputils";
import { formData, jsonData } from "~/utils/utils.server";
import { LimitSvc } from "~/services/limit.server";
import { collection } from "@prisma/client";
import { UserAuth } from "~/services/user.server.ts";
import { DefaultOptionType } from "antd/es/select";
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Modal,
  TreeSelect,
  Typography,
  message,
} from "antd";
import { useLocale } from "remix-i18next";
import { getLocale } from "~/utils/i18n";
import { useRequest } from "~/utils/api";
import i18next from "~/i18next.server";

export const action: ActionFunction = async ({ request, params }) => {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return redirect("/login");
  }
  const id = params["id"];
  let oldCollection: collection | null = null;
  if (id) {
    oldCollection = await prisma.collection.findUnique({
      where: {
        id: id,
      },
    });
    if (!oldCollection || user.id != oldCollection.user_id) {
      return errNotFound(request, ErrCollection.NotFound);
    }
    if (request.method === "DELETE") {
      await prisma.$transaction(async (tx) => {
        await tx.blueprint_collection.deleteMany({
          where: {
            collection_id: id,
          },
        });
        await tx.collection_like.deleteMany({
          where: {
            collection_id: id,
          },
        });
        await tx.collection.updateMany({
          where: {
            parent_id: id,
          },
          data: {
            parent_id: null,
          },
        });
        await tx.collection.delete({
          where: {
            id: id,
          },
        });
      });
      return success();
    }
  }
  const [result, err] = await LimitSvc.limit(
    request,
    user.id,
    "create_collection",
    "",
    LimitSvc.second(60),
    5,
    async () => {
      const {
        title,
        parent,
        description,
        public: publicCollection,
      } = await jsonData<any>(request);
      if (title && (title.length > 20 || title.length < 2)) {
        return errBadRequest(request, ErrCollection.TitleInvalid);
      }
      if (description && description.length > 1024 * 1024 * 100) {
        return errBadRequest(request, ErrCollection.DescriptionInvalid);
      }
      // 检查是否同名
      const where: any = {
        user_id_title: {
          user_id: user.id,
          title: title,
        },
      };
      if (oldCollection) {
        where.NOT = { id: oldCollection.id };
        if (parent == oldCollection.id) {
          return errBadRequest(request, ErrCollection.ParentInvalid);
        }
      }
      const collection = await prisma.collection.findUnique({
        where,
      });
      if (collection) {
        return errBadRequest(request, ErrCollection.TitleDuplicate);
      }
      if (parent) {
        // 检查父级是否存在
        const collection = await prisma.collection.findUnique({
          where: {
            id: parent,
          },
        });
        if (!collection) {
          return errBadRequest(request, ErrCollection.ParentInvalid);
        }
      }
      let id: collection;
      if (oldCollection) {
        id = await prisma.collection.update({
          data: {
            title: title,
            description: description,
            parent_id: parent ? parent : null,
            user: {
              connect: {
                id: user.id,
              },
            },
            public: parseInt(publicCollection),
            updatetime: new Date(),
          },
          where: {
            id: oldCollection.id,
          },
        });
      } else {
        id = await prisma.collection.create({
          data: {
            title: title,
            description: description,
            parent_id: parent ? parent : undefined,
            user: {
              connect: {
                id: user.id,
              },
            },
            public: parseInt(publicCollection),
          },
        });
      }
      return success(id.id);
    }
  );
  if (err) {
    return errBadRequest(request, ErrUser.UploadTooMany);
  }
  return result;
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: data.i18n.title + " - DSP2B",
    },
  ];
};

export async function collectionTree(user: UserAuth) {
  const all = await prisma.collection.findMany({
    where: {
      user_id: user.id,
    },
  });
  return buildCollectionTree(all);
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const uLocale = "/" + getLocale(request);
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: uLocale + "/login",
  });
  const id = params.id;
  let collection: collection | null = null;
  if (id) {
    collection = await prisma.collection.findUnique({
      where: {
        id: id,
      },
    });
  }
  const t = await i18next.getFixedT(request);
  return json({
    tree: await collectionTree(user),
    collection,
    i18n: {
      title: collection
        ? t("update_collection") + " - " + collection.title
        : t("create_collection"),
    },
  });
};

export type CollectionTree = collection & {
  children?: CollectionTree[];
};

export const buildCollectionTree = (all: collection[]) => {
  const tree: CollectionTree[] = [];
  const map = new Map<string, CollectionTree[]>();
  all.forEach((val) => {
    if (val.parent_id) {
      const nodes = map.get(val.parent_id);
      if (!nodes) {
        map.set(val.parent_id, [val]);
      } else {
        nodes.push(val);
      }
    } else {
      tree.push(val);
    }
  });

  const dfs = (node: CollectionTree) => {
    if (!node.children) {
      node.children = [];
    }
    node.children = map.get(node.id);
    node.children?.forEach((val) => {
      dfs(val);
    });
  };
  tree.forEach((val) => {
    dfs(val);
  });

  return tree;
};

export function buildSelectTree(tree: CollectionTree[]) {
  const treeData: DefaultOptionType[] = [];
  const dfs = (node: CollectionTree, parent?: DefaultOptionType) => {
    const data: DefaultOptionType = {
      key: node.id,
      label: node.title,
      value: node.id,
      children: [],
    };
    if (parent) {
      parent.children!.push(data);
    } else {
      treeData.push(data);
    }
    if (node.children) {
      node.children.forEach((val) => {
        dfs(val, data);
      });
    }
  };
  tree.forEach((val) => {
    dfs(val as unknown as CollectionTree);
  });
  return treeData;
}

export default function CreateCollection() {
  const { tree, collection } = useLoaderData<{
    tree: CollectionTree[];
    collection?: collection;
  }>();
  const fetcher = useFetcher<APIDataResponse<string>>({ key: "create" });
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [publicCollection, setPublicCollection] = useState<1 | 2>(1);
  const uLocale = "/" + useLocale();
  const request = useRequest("create.collection.$(id)");

  useEffect(() => {
    if (fetcher.state == "idle" && fetcher.data) {
      if (fetcher.data.code) {
        message.warning(fetcher.data.msg);
      } else {
        message.success(
          t(
            collection
              ? "collection_update_success"
              : "collection_create_success"
          )
        );
        location.href = uLocale + "/collection/" + fetcher.data.data;
      }
    }
  }, [fetcher]);

  return (
    <Card title={t("create_collection")}>
      <Form
        layout="vertical"
        form={form}
        initialValues={{
          title: collection?.title,
          description: collection?.description,
          parent: collection?.parent_id,
          public: publicCollection,
        }}
        onFinish={() => {
          const data = form.getFieldsValue();
          if (collection?.id) {
            data.id = collection.id;
          }
          data.public = publicCollection;
          fetcher.submit(data, {
            method: "POST",
            encType: "application/json",
          });
          return false;
        }}
      >
        <Form.Item
          name="title"
          label={t("title")}
          rules={[{ required: true }, { type: "string", min: 2, max: 20 }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="parent" label={t("parent_collection")}>
          <TreeSelect
            allowClear
            treeData={buildSelectTree(tree as unknown as CollectionTree[])}
            treeDefaultExpandAll
          />
        </Form.Item>
        <Form.Item
          name="description"
          label={t("description")}
          rules={[{ type: "string", max: 102400 }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item name="public" label={t("public_collection")}>
          <Checkbox
            checked={publicCollection === 1}
            onChange={(v) => {
              switch (publicCollection) {
                case 1:
                  setPublicCollection(2);
                  break;
                case 2:
                  setPublicCollection(1);
                  break;
                  break;
              }
            }}
          >
            <Typography.Text>
              {publicCollection === 1
                ? t("public")
                : publicCollection === 2
                ? t("private")
                : "---"}
            </Typography.Text>
          </Checkbox>
        </Form.Item>
        <div className="flex flex-row-reverse gap-2">
          <Button
            loading={fetcher.state != "idle"}
            htmlType="submit"
            type="primary"
          >
            {collection ? t("update") : t("submit")}
          </Button>
          {collection && (
            <Button
              type="default"
              danger
              loading={request.loading}
              onClick={() => {
                Modal.confirm({
                  title: t("delete_collection"),
                  content: t("delete_collection_confirm"),
                  okText: t("confirm"),
                  cancelText: t("cancel"),
                  onOk: () => {
                    request
                      .submit({
                        method: "DELETE",
                        params: {
                          id: collection.id,
                        },
                      })
                      .success(() => {
                        message.success(t("delete_collection_success"));
                        location.href = uLocale + "/collection";
                      });
                  },
                });
              }}
            >
              {t("delete")}
            </Button>
          )}
        </div>
      </Form>
    </Card>
  );
}
