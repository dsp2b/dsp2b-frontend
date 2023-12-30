// app/routes/login.tsx
import {
  Button,
  Input,
  Notification,
  Toast,
  Typography,
} from "@douyinfe/semi-ui";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useFetcher } from "@remix-run/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ErrUser } from "~/code/user";
import prisma from "~/db.server";
import { authenticator } from "~/services/auth.server";
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
      <Input name="username" required />
      <Input mode="password" name="password" required />
      <Button htmlType="submit">Login</Button>
      <Typography.Text link={{ href: "/login/oauth?type=discord" }}>
        discord
      </Typography.Text>
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
  return await authenticator.authenticate("user-pass", request, {
    throwOnError: false,
  });
}

// Finally, we can export a loader function where we check if the user is
// authenticated with `authenticator.isAuthenticated` and redirect to the
// dashboard if it is or return null if it's not
export async function loader({ request }: LoaderFunctionArgs) {
  // If the user is already authenticated redirect to /dashboard directly
  return await authenticator.isAuthenticated(request, {
    successRedirect: "/",
  });
}
