import { LoaderFunction } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";
import CollectionList from "~/components/CollectionList";
import { collectionList } from "~/services/collection.server";

export const loader: LoaderFunction = async ({ request }) => {
  const data = await collectionList(request);
  return json(data);
};

export default function Collection() {
  const loader = useLoaderData<any>();
  return (
    <div className="flex flex-row justify-between gap-3">
      <CollectionList loader={loader} />
    </div>
  );
}
