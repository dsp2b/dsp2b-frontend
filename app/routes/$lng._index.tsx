import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";
import { blueprintList } from "~/services/blueprint.server";
import BlueprintList, { BlueprintItem } from "~/components/BlueprintList";
import i18next from "~/i18next.server";
import { Radio } from "antd";

export const loader: LoaderFunction = async ({ request }) => {
  const t = await i18next.getFixedT(request);
  const data = await blueprintList(request);
  return json({
    ...data,
    pageTitle:
      data.currentPage > 1 ? t("page_n", { page: data.currentPage }) : "",
  });
};

export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {
  return [
    {
      title:
        "DSP2B - " +
        (matches[0].data as any).i18n.home_subtitle +
        (data.pageTitle ? " - " + data.pageTitle : ""),
    },
  ];
};

export default function Index() {
  const loader = useLoaderData() as unknown as {
    list: BlueprintItem[];
    total: number;
  };

  return <BlueprintList loader={loader} />;
}
