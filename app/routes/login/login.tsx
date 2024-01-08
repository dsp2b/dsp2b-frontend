// app/routes/login.tsx
import {
  Button,
  Input,
  Notification,
  Space,
  Toast,
  Typography,
} from "@douyinfe/semi-ui";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, json, useFetcher } from "@remix-run/react";
import { RiDiscordLine } from "@remixicon/react";
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
        Toast.error({
          content: fetcher.data?.msg,
          duration: 3,
        });
      } else if (fetcher.data.username) {
        Toast.success({
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
    <Form method="post" navigate={false} fetcherKey="login">
      <Space vertical>
        <Input name="username" required />
        <Input mode="password" name="password" required />
        <Button htmlType="submit">Login</Button>
        <Link to={"/login/oauth?type=discord"}>
          <Button icon={<RiDiscordLine />}>discord</Button>
        </Link>
      </Space>
    </Form>
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
