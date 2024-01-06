import { Card, Form, Toast } from "@douyinfe/semi-ui";
import { ActionFunction, LoaderFunction, json } from "@remix-run/node";
import { Form as RemixForm, useFetcher } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { APIDataResponse } from "~/services/api";
import { Blueprint } from "~/services/blueprint";
import { CodeError, errBadRequest, errInternalServer } from "~/utils/errcode";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      const url = new URL(request.url);
      const formData = await request.formData();
      if (url.searchParams.get("action") == "parse") {
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
      }
    }
    return errBadRequest(request, -1);
  } catch (e) {
    return errInternalServer(request, -2);
  }
};

export default function Publish() {
  const fetcher = useFetcher<CodeError>({ key: "publish" });
  const parse = useFetcher<APIDataResponse<Blueprint>>({ key: "parse" });
  const form = useRef<HTMLFormElement>(null);
  const { t } = useTranslation();
  useEffect(() => {
    if (parse.state == "idle" && parse.data) {
      if (parse.data.code) {
        Toast.warning(parse.data.msg);
      } else {
        const title = form.current!.title as unknown as HTMLInputElement;
        if (!title.value) {
          title.value = parse.data.data.blueprint.ShortDesc;
        }
        const description = form.current!
          .description as unknown as HTMLInputElement;
        if (!description.value) {
          description.value = parse.data.data.blueprint.Desc;
        }
      }
    }
  }, [parse]);
  return (
    <Card
      title="发布"
      headerStyle={{
        padding: "6px 12px",
      }}
    >
      <Form>
        <RemixForm navigate={false} fetcherKey="publish" ref={form}>
          <Form.TextArea
            field="blueprint"
            name="blueprint"
            label="蓝图数据"
            onBlur={() => {
              // 解析蓝图数据
              const blueprint = form.current!.blueprint;
              if (blueprint.value) {
                parse.submit(
                  {
                    blueprint: blueprint.value,
                  },
                  { action: "?action=parse", method: "POST" }
                );
              }
            }}
          />
          <Form.Input field="title" name="title" label="标题" />
          <Form.Input field="description" name="description" label="描述" />
        </RemixForm>
      </Form>
    </Card>
  );
}
