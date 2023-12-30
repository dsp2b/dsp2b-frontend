import { LoaderFunction, json } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url);
  switch (url.searchParams.get("type")) {
    case "discord":
      return authenticator.authenticate("discord", request);
  }
  return json({ code: 400, msg: "type is required" }, { status: 400 });
};
