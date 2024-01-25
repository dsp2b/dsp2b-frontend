import { errBadRequest } from "~/utils/errcode";
import { APIDataResponse } from "./api";
import { authenticator } from "./auth.server";
import itemProtoSet from "./ItemProtoSet.json";
import { ErrUser } from "~/code/user";
import prisma from "~/db.server";
import { blueprint, collection } from "@prisma/client";
import { jsonData, ossFileUrl } from "~/utils/utils.server";
import { success } from "~/utils/httputils";
import { BlueprintItem, tag } from "~/components/BlueprintList";

export type ParseBlueprintResponse = APIDataResponse<{
  blueprint: {
    ShortDesc: string;
    Desc: string;
    GameVersion: string;
  };
  buildings: Building[];
  products: Product[];
}>;

export interface Building {
  item_id: number;
  name: string;
  icon_path: string;
  count: number;
}

export interface Collection {
  id: string;
  name: string;
}

export interface Product {
  item_id: number;
  name: string;
  icon_path: string;
  count: number;
}

export type GetRecipePanelResponse = APIDataResponse<{
  thing_panel: RecipePanelItem[][];
  building_panel: RecipePanelItem[][];
}>;

export interface RecipePanelItem {
  item_id: number;
  name: string;
  icon_path: string;
}

export async function parseBlueprint(blueprint: string) {
  return fetch(process.env.RPC_URL! + "/blueprint/parse", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      blueprint: blueprint,
    }),
  });
}

export const itemProtoSetMap = new Map<
  number,
  { Name: string; IconPath: string }
>();

itemProtoSet.DataArray.forEach((val) => {
  let iconPath = val.Proto.IconPath.split("/");
  let iconPath2 = iconPath[iconPath.length - 1];
  itemProtoSetMap.set(val.ID, {
    Name: val.Name,
    IconPath: iconPath2,
  });
});

export async function postLike(
  request: Request,
  blueprint: blueprint,
  like: boolean
) {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return errBadRequest(request, ErrUser.UserNotLogin);
  }
  if (like) {
    let resp = await prisma.blueprint_like.create({
      data: {
        user_id: user.id,
        blueprint_id: blueprint.id,
      },
    });
  } else {
    await prisma.blueprint_like.delete({
      where: {
        user_id_blueprint_id: {
          user_id: user.id,
          blueprint_id: blueprint.id,
        },
      },
    });
  }
  return success();
}

export function blueprintTags(tag: number[]): tag[] {
  let tags: tag[] = [];
  tag.forEach((val) => {
    tags.push({
      item_id: val,
      name: itemProtoSetMap.get(val)!.Name,
      icon_path: itemProtoSetMap.get(val)!.IconPath,
    });
  });
  return tags;
}

export function blueprintPicList(pics: string[]): string[] {
  let picList: string[] = [];
  pics.forEach((val) => {
    picList.push(ossFileUrl(val));
  });
  return picList;
}

export async function blueprintProducts(
  blueprint: blueprint
): Promise<Product[]> {
  let productsList: Product[] = [];
  const list = await prisma.blueprint_product.findMany({
    where: {
      blueptint_id: blueprint.id,
    },
  });
  list.forEach((val) => {
    productsList.push({
      item_id: val.item_id,
      name: itemProtoSetMap.get(val.item_id)!.Name,
      icon_path: itemProtoSetMap.get(val.item_id)!.IconPath,
      count: val.count,
    });
  });
  return productsList;
}

export async function blueprintList(
  request: Request,
  options?: {
    user_id?: string;
    collection?: string;
  }
) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1") || 1;
  const sort = url.searchParams.get("sort") || "latest";
  const keyword = url.searchParams.get("keyword") || "";
  const tags = (url.searchParams.get("tags") || "")
    .split(",")
    .filter((v) => v)
    .map((v) => parseInt(v));
  const where: any = {};
  if (options?.collection) {
    where.blueprint_collection = {
      some: {
        collection_id: options?.collection,
      },
    };
  }
  if (options?.user_id) {
    where.user_id = options.user_id;
  }
  if (keyword) {
    where.title = {
      contains: keyword,
    };
  }
  if (tags.length) {
    where.tags_id = {
      hasEvery: tags,
    };
  }
  let list: blueprint[];
  const select = {
    id: true,
    title: true,
    description: true,
    pic_list: true,
    tags_id: true,
    copy_count: true,
    user: {
      select: {
        id: true,
        username: true,
      },
    },
  };
  const take = 30;
  const skip = (page - 1) * take;
  switch (sort) {
    case "like":
      //@ts-ignore
      list = await prisma.blueprint.findMany({
        where,
        skip,
        take,
        select,
        orderBy: {
          blueprint_like: {
            _count: "desc",
          },
        },
      });
      break;
    case "collection":
      //@ts-ignore
      list = await prisma.blueprint.findMany({
        where,
        skip,
        take,
        select,
        orderBy: {
          blueprint_collection: {
            _count: "desc",
          },
        },
      });
      break;
    default:
      //@ts-ignore
      list = await prisma.blueprint.findMany({
        where,
        skip,
        take,
        select,
        orderBy: {
          createtime: "desc",
        },
      });
  }
  const total = await prisma.blueprint.count({ where });

  list.forEach((val: any) => {
    val.tags =
      val.tags_id?.map((val: number) => {
        return {
          id: val,
          name: itemProtoSetMap.get(val)?.Name,
          icon_path: itemProtoSetMap.get(val)?.IconPath,
        };
      }) || [];
    if (val.pic_list && val.pic_list.length > 0) {
      val.pic = ossFileUrl(val.pic_list[0]);
    }
  });

  await Promise.all(
    list.map(async (val: any) => {
      const count = await prisma.blueprint_collection.count({
        where: {
          blueprint_id: val.id,
        },
      });
      val.collection_count = count;
      const like = await prisma.blueprint_like.count({
        where: {
          blueprint_id: val.id,
        },
      });
      val.like_count = like;
    })
  );
  return {
    list,
    total,
    sort,
    keyword,
    currentPage: page,
    tags: blueprintTags(tags),
  };
}

export class BlueprintSvc {
  blueprint: blueprint;
  constructor(blueprint: blueprint) {
    this.blueprint = blueprint;
  }

  async getColletcion(userId?: string): Promise<Collection[]> {
    const collection = await prisma.collection.findMany({
      where: {
        user_id: userId,
        blueprint_collection: {
          some: {
            blueprint_id: this.blueprint.id,
          },
        },
      },
    });

    let collectionList: Collection[] = [];
    collection.forEach((val) => {
      collectionList.push({
        id: val.id,
        name: val.title,
      });
    });
    return collectionList;
  }
}
