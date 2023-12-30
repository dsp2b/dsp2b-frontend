import { Button, Input, Toast } from "@douyinfe/semi-ui";
import { ActionFunction, json } from "@remix-run/node";
import { Form, useFetcher } from "@remix-run/react";
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
  console.log(UserSvc.isStrongPassword(password), password);
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
  return success();
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
        Toast.error({
          content: fetcher.data?.msg,
          duration: 3,
        });
      } else {
        Toast.success({
          content: t("register_success"),
          duration: 3,
          onClose() {
            window.location.href = "/login";
          },
        });
      }
    }
  }, [fetcher]);
  useEffect(() => {
    if (requestEmailVcode.state == "idle" && requestEmailVcode.data) {
      if (requestEmailVcode.data.code) {
        setGetVcodeTimer(0);
        Toast.error({
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
    <Form
      method="post"
      navigate={false}
      fetcherKey="register"
      onSubmit={() => {
        console.log(fetcher);
        return false;
      }}
    >
      <Input name="username" required />
      <Input
        name="email"
        value={email}
        onChange={(v) => setEmail(v)}
        required
      />
      <Input
        name="email_vcode"
        required
        addonAfter={
          <Button
            type="primary"
            disabled={getVcodeTimer > 0}
            loading={requestEmailVcode.state == "loading"}
            onClick={() => {
              if (!email) {
                Toast.error({
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
        }
      />
      <Input mode="password" name="password" required />
      <Input mode="password" name="password2" required />
      <Button htmlType="submit">{t("register")}</Button>
    </Form>
  );
}
