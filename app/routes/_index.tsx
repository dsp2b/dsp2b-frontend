import type { LoaderFunction } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";
import { blueprintList } from "~/services/blueprint.server";
import BlueprintList, { BlueprintItem } from "~/components/BlueprintList";

export const loader: LoaderFunction = async ({ request }) => {
  return json(await blueprintList(request));
};

export default function Index() {
  const loader = useLoaderData() as unknown as {
    list: BlueprintItem[];
    total: number;
  };

  return <BlueprintList loader={loader} />;
}
