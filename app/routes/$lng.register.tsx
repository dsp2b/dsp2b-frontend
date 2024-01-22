import { ActionFunction } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { Button, Card, Form, Input, Space, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import validator from "validator";
import { ErrUser } from "~/code/user";
import prisma from "~/db.server";
import { UserSvc } from "~/services/user.server.ts";
import { CodeError, errBadRequest } from "~/utils/errcode";
import { success } from "~/utils/httputils";

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const email = form.get("email")?.toString();
  if (!email) {
    return errBadRequest(request, -1);
  }
  if (!validator.isEmail(email)) {
    return errBadRequest(request, ErrUser.EmailInvalid);
  }
  if (form.get("action")?.toString() === "requestEmailVcode") {
    return await UserSvc.requestRegisterEmail(
      request,
      form.get("email")!.toString()
    );
  }
  // 判断验证码是否正确且没超过半个小时
  const vcode = form.get("email_vcode")?.toString();
  const username = form.get("username")?.toString();
  const password = form.get("password")?.toString();
  const password2 = form.get("password2")?.toString();
  if (!vcode || !username || !password || !password2) {
    return errBadRequest(request, -1);
  }
  if (password !== password2) {
    return errBadRequest(request, ErrUser.PasswordNotMatch);
  }
  if (!UserSvc.isStrongPassword(password)) {
    return errBadRequest(request, ErrUser.PasswordTooSimple);
  }
  if (!UserSvc.isUsernameValid(username)) {
    return errBadRequest(request, ErrUser.UsernameInvalid);
  }
  //判断用户名重复
  const user = await prisma.user.findUnique({
    where: {
      username: username,
    },
  });
  if (user) {
    return errBadRequest(request, ErrUser.UsernameExist);
  }
  await prisma.user.create({
    data: {
      username: username,
      email: email,
      password: UserSvc.hashPassword(password),
    },
  });
  return success({});
};

export default function Register() {
  const fetcher = useFetcher<CodeError>({ key: "register" });
  const requestEmailVcode = useFetcher<CodeError>({
    key: "requestEmailVcode",
  });
  const [getVcodeTimer, setGetVcodeTimer] = useState(0);
  const [email, setEmail] = useState("");
  const { t } = useTranslation();
  useEffect(() => {
    if (fetcher.state == "idle" && fetcher.data) {
      if (fetcher.data.code) {
        message.error({
          content: fetcher.data?.msg,
          duration: 3,
        });
      } else {
        message.success({
          content: t("register_success"),
          duration: 3,
          onClose() {
            window.location.href = "./login";
          },
        });
      }
    }
  }, [fetcher]);
  useEffect(() => {
    if (requestEmailVcode.state == "idle" && requestEmailVcode.data) {
      if (requestEmailVcode.data.code) {
        setGetVcodeTimer(0);
        message.error({
          content: requestEmailVcode.data?.msg,
          duration: 3,
        });
      } else {
        setGetVcodeTimer(60);
        const timer = setInterval(() => {
          setGetVcodeTimer((v) => {
            if (v <= 0) {
              clearInterval(timer);
            }
            return v - 1;
          });
        }, 1000);
      }
    }
  }, [requestEmailVcode]);
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
          {t("register")}
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
            <Input name="username" />
          </Form.Item>
          <Form.Item
            name="email"
            label={t("email")}
            rules={[{ required: true }, { type: "email" }]}
          >
            <Input value={email} onChange={(v) => setEmail(v.target.value)} />
          </Form.Item>
          <Form.Item
            name="email_vcode"
            label={t("email_vcode")}
            rules={[{ required: true }, { type: "string", len: 6 }]}
          >
            <div className="flex flex-row gap-2">
              <Input />
              <Button
                type="primary"
                disabled={getVcodeTimer > 0}
                loading={requestEmailVcode.state == "loading"}
                onClick={() => {
                  if (!email) {
                    message.error({
                      content: t("require_email"),
                      duration: 3,
                    });
                    return;
                  }
                  requestEmailVcode.submit(
                    {
                      email: email,
                      action: "requestEmailVcode",
                    },
                    { method: "POST" }
                  );
                  setGetVcodeTimer(60);
                }}
              >
                {getVcodeTimer > 0 ? `请等待${getVcodeTimer}秒` : "获取验证码"}
              </Button>
            </div>
          </Form.Item>
          <Form.Item
            name="password"
            label={t("password")}
            rules={[{ required: true }, { type: "string", min: 6, max: 16 }]}
          >
            <Input.Password name="password" required />
          </Form.Item>
          <Form.Item
            name="password2"
            label={t("repassword")}
            rules={[{ required: true }, { type: "string", min: 6, max: 16 }]}
          >
            <Input.Password name="password2" required />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full">
              {t("register")}
            </Button>
            <Button type="link" href="./login" className="float-right">
              {t("have_account_go_login")}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
