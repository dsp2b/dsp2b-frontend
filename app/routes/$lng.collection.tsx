import { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";
import CollectionList from "~/components/CollectionList";
import i18next from "~/i18next.server";
import { collectionList } from "~/services/collection.server";

export const loader: LoaderFunction = async ({ request }) => {
  const t = await i18next.getFixedT(request);
  const data = await collectionList(request);
  return json({
    ...data,
    pageTitle:
      data.currentPage > 1 ? t("page_n", { page: data.currentPage }) : "",
    i18n: {
      collection: t("collection"),
    },
  });
};

export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {
  return [
    {
      title:
        "DSP2B - " +
        data.i18n.collection +
        (data.pageTitle ? " - " + data.pageTitle : ""),
    },
  ];
};

export default function Collection() {
  const loader = useLoaderData<any>();
  return (
    <div className="flex flex-row justify-between gap-3">
      <CollectionList loader={loader} />
    </div>
  );
}
