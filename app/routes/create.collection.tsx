import { useTranslation } from "react-i18next";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { APIDataResponse } from "~/services/api";
import {
  ActionFunction,
  LoaderFunction,
  json,
  redirect,
} from "@remix-run/node";
import { errBadRequest } from "~/utils/errcode";
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
  TreeSelect,
  Typography,
  message,
} from "antd";

export const action: ActionFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return redirect("/login");
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
      } = await jsonData(request);
      if (title && (title.length > 20 || title.length < 2)) {
        return errBadRequest(request, ErrCollection.TitleInvalid);
      }
      if (description && description.length > 1024 * 1024 * 100) {
        return errBadRequest(request, ErrCollection.DescriptionInvalid);
      }
      // 检查是否同名
      const collection = await prisma.collection.findUnique({
        where: {
          user_id_title: {
            user_id: user.id,
            title: title,
          },
        },
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
      const id = await prisma.collection.create({
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
      return success(id.id);
    }
  );
  if (err) {
    return errBadRequest(request, ErrUser.UploadTooMany);
  }
  return result;
};

export async function collectionTree(user: UserAuth) {
  const all = await prisma.collection.findMany({
    where: {
      user_id: user.id,
    },
  });
  return buildCollectionTree(all);
}

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });

  return json({ tree: await collectionTree(user) });
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
  const { tree } = useLoaderData<{
    tree: CollectionTree[];
  }>();
  const fetcher = useFetcher<APIDataResponse<string>>({ key: "create" });
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [publicCollection, setPublicCollection] = useState<1 | 2 | 3>(1);
  const nav = useNavigate();

  useEffect(() => {
    if (fetcher.state == "idle" && fetcher.data) {
      if (fetcher.data.code) {
        message.warning(fetcher.data.msg);
      } else {
        message.success(t("collection_create_success"));
        nav("/colletcion/" + fetcher.data.data);
      }
    }
  }, [fetcher]);

  return (
    <Card title={t("create_collection")}>
      <Form
        layout="vertical"
        form={form}
        initialValues={{
          public: publicCollection,
        }}
        onFinish={() => {
          const data = form.getFieldsValue();
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
            treeData={buildSelectTree(tree as unknown as CollectionTree[])}
            treeDefaultExpandAll
          />
        </Form.Item>
        <Form.Item
          name="description"
          label={t("description")}
          rules={[{ type: "string", max: 102400 }]}
        >
          <Input.TextArea />
        </Form.Item>
        <Form.Item name="public" label={t("public_collection")}>
          <Checkbox
            checked={publicCollection === 1}
            indeterminate={publicCollection === 3}
            onChange={(v) => {
              console.log("1231", publicCollection);
              switch (publicCollection) {
                case 1:
                  setPublicCollection(3);
                  break;
                case 2:
                  setPublicCollection(1);
                  break;
                case 3:
                  setPublicCollection(2);
                  break;
              }
            }}
          >
            <Typography.Text>
              {publicCollection === 1
                ? t("public")
                : publicCollection === 2
                ? t("private")
                : publicCollection === 3
                ? t("inherit_collection")
                : "---"}
            </Typography.Text>
          </Checkbox>
        </Form.Item>
        <div className="flex flex-row-reverse">
          <Button
            loading={fetcher.state != "idle"}
            htmlType="submit"
            type="primary"
          >
            {t("submit")}
          </Button>
        </div>
      </Form>
    </Card>
  );
}
