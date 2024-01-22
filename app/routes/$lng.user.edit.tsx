import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { ActionFunction, LoaderFunction, json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { RiDiscordLine } from "@remixicon/react";
import {
  Avatar,
  Button,
  Card,
  Divider,
  Form,
  Input,
  Space,
  Typography,
  Upload,
  message,
} from "antd";
import { RcFile } from "antd/es/upload";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ErrUser } from "~/code/user";
import prisma from "~/db.server";
import { authenticator } from "~/services/auth.server";
import { UserSvc } from "~/services/user.server.ts";
import { useRequest } from "~/utils/api";
import { errBadRequest } from "~/utils/errcode";
import { success } from "~/utils/httputils";
import { getLocale } from "~/utils/i18n";
import { UploadResponse, upload } from "~/utils/utils.client";
import { jsonData, ossFileUrl } from "~/utils/utils.server";

type LoaderData = {
  id: string;
  username: string;
  avatar: string;
  description: string;
  oauth: {
    discord?: { bind: boolean };
  };
};

export const action: ActionFunction = async ({ request }) => {
  const uLocale = "/" + getLocale(request);
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: uLocale + "/login",
  });
  const m = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
  });
  if (!m) {
    return errBadRequest(request, ErrUser.UserNotExist);
  }
  const data = await jsonData<{
    action?: "avatar";
    url?: string;
    description: string;
    password?: string;
    new_password?: string;
    repassword?: string;
  }>(request);
  if (data.action === "avatar" && data.url) {
    // 判断url前缀
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: data.url },
    });
    return success({
      url: ossFileUrl(data.url),
    });
  }
  if (data.new_password) {
    // 修改密码, 确认密码
    if (data.new_password !== data.repassword) {
      return errBadRequest(request, ErrUser.PasswordNotMatch);
    }
    if (!UserSvc.isStrongPassword(data.new_password)) {
      return errBadRequest(request, ErrUser.PasswordTooSimple);
    }
    if (m?.password) {
      if (!data.password) {
        return errBadRequest(request, ErrUser.PasswordIsWrong);
      }
      if (!UserSvc.checkPassword(m, data.password)) {
        return errBadRequest(request, ErrUser.PasswordIsWrong);
      }
    }
    m.password = await UserSvc.hashPassword(data.new_password);
  }
  m.description = data.description;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      description: data.description,
      password: m.password,
    },
  });
  return success();
};

export const loader: LoaderFunction = async ({ request }) => {
  const uLocale = "/" + getLocale(request);
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: uLocale + "/login",
  });
  const m = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
  });
  if (!m) {
    return json({}, { status: 404 });
  }
  const oauth: any = {};
  // 判断是否绑定了discord
  const discord = await prisma.oauth.findUnique({
    where: {
      user_id_type: {
        user_id: user.id,
        type: "discord",
      },
    },
  });
  if (discord) {
    oauth["discord"] = {
      type: "discord",
      bind: true,
    };
  }
  return json({
    id: m.id,
    username: m.username,
    avatar: ossFileUrl(m.avatar),
    description: m.description,
    oauth,
  });
};

export default function Edit() {
  const loader = useLoaderData<LoaderData>();
  const [avatar, setAvatar] = useState<string>(loader.avatar);
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const fetcher = useRequest<any>("user.edit");
  const avatarFetcher = useRequest<UploadResponse>("upload");
  return (
    <Card>
      <Form
        form={form}
        onFinish={(val) => {
          fetcher
            .submit({
              body: val,
            })
            .success(() => {
              message.success(t("update_success"));
            });
          return false;
        }}
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 14 }}
        initialValues={loader}
      >
        <Form.Item label="avatar" style={{ textAlign: "center" }}>
          <Upload
            name="avatar"
            listType="picture-circle"
            className="avatar-uploader"
            showUploadList={false}
            action="https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188"
            onChange={(img) => {
              if (img.file.response) {
                // 更新头像
                fetcher
                  .submit({
                    body: {
                      action: "avatar",
                      url: img.file.response.url,
                    },
                  })
                  .success((data: { url: string }) => {
                    setAvatar(data.url);
                    message.success(t("update_success"));
                  });
              }
            }}
            customRequest={(req) => {
              avatarFetcher
                .submit({
                  method: "POST",
                  body: {
                    filename: (req.file as RcFile).name,
                    type: "avatar",
                  },
                })
                .success((data) => {
                  upload(data, req.file, t, req);
                });
            }}
          >
            {avatar ? (
              <Avatar
                shape="circle"
                src={avatar}
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            ) : (
              <button style={{ border: 0, background: "none" }} type="button">
                {avatarFetcher.loading ? <LoadingOutlined /> : <PlusOutlined />}
                <div style={{ marginTop: 8 }}>Upload</div>
              </button>
            )}
          </Upload>
        </Form.Item>
        <Form.Item label={t("username")} name="username">
          <Input disabled />
        </Form.Item>
        <Form.Item label={t("user_description")} name="description">
          <Input.TextArea maxLength={200} showCount />
        </Form.Item>
        <Form.Item label={t("password")} name="password">
          <Input.Password />
        </Form.Item>
        <Form.Item label={t("new_password")} name="new_password">
          <Input.Password />
        </Form.Item>
        <Form.Item label={t("repassword")} name="repassword">
          <Input.Password />
        </Form.Item>
        <Form.Item label={t("oauth_login")}>
          <div className="flex flex-row justify-center gap-3 w-full">
            <Button
              href="/login/oauth?type=discord"
              disabled={loader.oauth.discord && loader.oauth.discord.bind}
            >
              <Space>
                <RiDiscordLine
                  style={{
                    color: "#5a64ea",
                  }}
                />
                <Typography.Text>
                  {loader.oauth.discord && loader.oauth.discord.bind
                    ? t("binded")
                    : t("bind")}
                </Typography.Text>
              </Space>
            </Button>
          </div>
        </Form.Item>
        <Form.Item
          label=""
          labelCol={{ span: 0 }}
          wrapperCol={{ span: 4 }}
          style={{ float: "right" }}
        >
          <Button type="primary" htmlType="submit" loading={fetcher.loading}>
            {t("update")}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
