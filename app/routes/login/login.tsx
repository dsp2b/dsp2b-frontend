import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form as RemixForm, Link, json, useFetcher } from "@remix-run/react";
import { RiDiscordLine } from "@remixicon/react";
import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Space,
  Form,
  Typography,
  message,
  Checkbox,
  Divider,
} from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ErrUser } from "~/code/user";
import prisma from "~/db.server";
import { authenticator } from "~/services/auth.server";
import { sessionStorage } from "~/services/session.server";
import { UserSvc } from "~/services/user.server.ts";
import { CodeError, errBadRequest } from "~/utils/errcode";
// First we create our UI with the form doing a POST and the inputs with the
// names we are going to use in the strategy
export default function Login() {
  const fetcher = useFetcher<CodeError>({ key: "login" });
  const { t } = useTranslation();
  useEffect(() => {
    if (fetcher.state == "idle" && fetcher.data) {
      if (fetcher.data.code) {
        message.error({
          content: fetcher.data?.msg,
          duration: 3,
        });
      } else if (fetcher.data.username) {
        message.success({
          content: t("login_success"),
          duration: 3,
          onClose() {
            window.location.href = "/";
          },
        });
      }
    }
  }, [fetcher]);
  return (
    <div className="flex flex-col items-center w-full gap-2">
      <div>
        <Typography.Title level={3} className="!m-0">
          {t("dsp2b_title")}
        </Typography.Title>
        <Typography.Text>{t("dsp2b_subtitle")}</Typography.Text>
      </div>
      <Card
        style={{
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <Typography.Title level={3} className="block text-center">
          {t("login")}
        </Typography.Title>
        <Form
          layout="vertical"
          initialValues={{ remember: true }}
          onFinish={(values) => {
            fetcher.submit(values, {
              method: "POST",
            });
            return false;
          }}
        >
          <Form.Item
            name="username"
            label={t("username")}
            rules={[{ required: true }, { type: "string", min: 2, max: 20 }]}
          >
            <Input name="username" required />
          </Form.Item>
          <Form.Item
            name="password"
            label={t("password")}
            rules={[{ required: true }, { type: "string", min: 6, max: 16 }]}
          >
            <Input.Password name="password" required />
          </Form.Item>
          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>{t("rember_me")}</Checkbox>
            </Form.Item>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full">
              {t("login")}
            </Button>
            <Button type="link" href="/login/register" className="float-right">
              {t("quick_register")}
            </Button>
          </Form.Item>
          <Divider>{t("oauth_login")}</Divider>
          <div className="flex flex-row justify-center gap-3 w-full">
            <Button
              type="link"
              href="/login/oauth?type=discord"
              icon={
                <RiDiscordLine
                  style={{
                    color: "#5a64ea",
                  }}
                />
              }
            ></Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

// Second, we need to export an action function, here we will use the
// `authenticator.authenticate method`
export async function action({ request }: ActionFunctionArgs) {
  // we call the method with the name of the strategy we want to use and the
  // request object, optionally we pass an object with the URLs we want the user
  // to be redirected to after a success or a failure
  const clonedRequest = request.clone();
  const form = await clonedRequest.formData();

  let username = form.get("username");
  let password = form.get("password");
  if (!username) {
    return errBadRequest(request, ErrUser.UsernameIsRequire);
  }
  if (!password) {
    return errBadRequest(request, ErrUser.PasswordIsWrong);
  }
  const user = await prisma.user.findFirst({
    where: { username: username.toString() },
  });
  if (!user) {
    return errBadRequest(request, ErrUser.UserNotExist);
  }
  if (!UserSvc.checkPassword(user, password.toString())) {
    return errBadRequest(request, ErrUser.PasswordIsWrong);
  }
  const ok = await authenticator.authenticate("user-pass", request, {
    throwOnError: false,
  });
  if (ok.id) {
    let session = await sessionStorage.getSession(
      request.headers.get("Cookie")
    );
    // if we do have a successRedirect, we redirect to it and set the user
    // in the session sessionKey
    session.set(authenticator.sessionKey, {
      id: user.id,
      username: user.username,
    });
    session.set(authenticator.sessionStrategyKey, "user-pass");
    return json(user, {
      headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
    });
  }
}
