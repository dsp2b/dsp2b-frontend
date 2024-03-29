import { errBadRequest } from "~/utils/errcode";
import { APIDataResponse } from "./api";
import { authenticator } from "./auth.server";
import itemProtoSet from "./itemProtoSet.json";
import techProtoSet from "./techProtoSet.json";
import signalProtoSet from "./signalProtoSet.json";
import recipeProtoSet from "./recipeProtoSet.json";
import { ErrUser } from "~/code/user";
import prisma from "~/db.server";
import {
  Prisma,
  PrismaClient,
  PrismaPromise,
  blueprint,
  blueprint_product,
} from "@prisma/client";
import {
  notifyCollectionUpdate,
  ossFileUrl,
  thumbnailUrl,
} from "~/utils/utils.server";
import { success } from "~/utils/httputils";
import { tag } from "~/components/BlueprintList";

export type IconInfo = {
  ItemID: number;
  Name: string;
  IconPath: string;
};

export interface Icons {
  Layout: number;
  Icon0?: IconInfo;
  Icon1?: IconInfo;
  Icon2?: IconInfo;
  Icon3?: IconInfo;
  Icon4?: IconInfo;
  Icon5?: IconInfo;
}

export type BlueprintHeader = {
  Layout: number;
  Icon0: number;
  Icon1: number;
  Icon2: number;
  Icon3: number;
  Icon4: number;
  Icon5: number;
  ShortDesc: string;
  Desc: string;
  GameVersion: string;
};

export type ParseBlueprintResponse = APIDataResponse<{
  blueprint: BlueprintHeader;
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

export type GetRecipePanel = {
  thing_panel: RecipePanelItem[][];
  building_panel: RecipePanelItem[][];
};

export type GetRecipePanelResponse = APIDataResponse<GetRecipePanel>;

export interface RecipePanelItem {
  item_id: number;
  name: string;
  icon_path: string;
  upgrades?: number[];
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

export const iconMap = new Map<number, IconInfo>();

itemProtoSet.DataArray.forEach((val) => {
  if (val.Proto.IconPath == "") {
    return;
  }
  iconMap.set(val.ID, {
    ItemID: val.ID,
    Name: val.Name,
    IconPath: val.Proto.IconPath,
  });
});

signalProtoSet.DataArray.forEach((val) => {
  if (val.Proto.IconPath == "") {
    return;
  }
  iconMap.set(val.ID, {
    ItemID: val.ID,
    Name: val.Name,
    IconPath: val.Proto.IconPath,
  });
});

techProtoSet.DataArray.forEach((val) => {
  if (val.Proto.IconPath == "") {
    return;
  }
  iconMap.set(val.ID + 40000, {
    ItemID: val.ID,
    Name: val.Name,
    IconPath: val.Proto.IconPath,
  });
});

recipeProtoSet.DataArray.forEach((val) => {
  if (val.Proto.IconPath == "") {
    return;
  }
  iconMap.set(val.ID + 20000, {
    ItemID: val.ID,
    Name: val.Name,
    IconPath: val.Proto.IconPath,
  });
  iconMap.set(val.ID, {
    ItemID: val.ID,
    Name: val.Name,
    IconPath: val.Proto.IconPath,
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
      name: iconMap.get(val)!.Name,
      icon_path: iconMap.get(val)!.IconPath,
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
      blueprint_id: blueprint.id,
    },
  });
  list.forEach((val) => {
    productsList.push({
      item_id: val.item_id,
      name: iconMap.get(val.item_id)!.Name,
      icon_path: iconMap.get(val.item_id)!.IconPath,
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
    defaultSort?: string;
  }
) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1") || 1;
  const sort = url.searchParams.get("sort") || options?.defaultSort || "latest";
  const keyword = url.searchParams.get("keyword") || "";
  const view = url.searchParams.get("view") || "cover";
  const noShowRoot = url.searchParams.get("root") === "false";
  const tags = (url.searchParams.get("tags") || "")
    .split(",")
    .filter((v) => v)
    .map((v) => parseInt(v));
  const where: any = {};
  if (options?.collection) {
    if (noShowRoot) {
      where.blueprint_collection = {
        some: {
          collection_id: options?.collection,
        },
      };
    } else {
      where.blueprint_collection = {
        some: {
          OR: [
            {
              collection_id: options?.collection,
            },
            {
              root_collection_id: options?.collection,
            },
          ],
        },
      };
    }
  }
  if (options?.user_id) {
    where.user_id = options.user_id;
  }
  if (keyword) {
    where.title = {
      contains: keyword,
    };
  }
  let list: blueprint[];
  const select: any = {
    id: true,
    title: true,
    description: true,
    pic_list: true,
    tags_id: true,
    copy_count: true,
    icons: true,
    user: {
      select: {
        id: true,
        username: true,
      },
    },
  };
  if (tags.length) {
    where.tags_id = {
      hasSome: tags,
    };
    select.blueprint_product = {
      where: {
        item_id: {
          in: tags,
        },
      },
      take: 4,
      orderBy: {
        count: "desc",
      },
    };
  }
  const take = 40;
  const skip = (page - 1) * take;
  switch (sort) {
    case "product_sort":
      const productList = await prisma.blueprint_product.findMany({
        where: {
          item_id: tags[0],
          blueprint: where,
        },
        include: {
          blueprint: {
            select,
          },
        },
        skip,
        take,
        orderBy: {
          count: "desc",
        },
      });
      // 转换格式
      // @ts-ignore
      list = productList.map((item) => {
        return item.blueprint;
      });
      break;
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
    case "copy":
      //@ts-ignore
      list = await prisma.blueprint.findMany({
        where,
        skip,
        take,
        select,
        orderBy: {
          copy_count: "desc",
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
    case "title":
      //@ts-ignore
      list = await prisma.blueprint.findMany({
        where,
        skip,
        take,
        select,
        orderBy: {
          title: "asc",
        },
      });
      break;
    case "latest_update":
      //@ts-ignore
      list = await prisma.blueprint.findMany({
        where,
        skip,
        take,
        select,
        orderBy: {
          updatetime: "desc",
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
          name: iconMap.get(val)?.Name,
          icon_path: iconMap.get(val)?.IconPath,
        };
      }) || [];
    if (val.pic_list && val.pic_list.length > 0) {
      val.pic = thumbnailUrl(val.pic_list[0]);
    }
    // 截取描述
    if (val.description) {
      val.description = val.description.substr(0, 100);
    }
    // 产物信息
    val.products = val.blueprint_product?.map((val: any) => {
      val.icon_path = iconMap.get(val.item_id)?.IconPath;
      return val;
    });
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
    view: view,
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

export async function deleteBlueprint(
  tx: Prisma.TransactionClient,
  blueprint: blueprint
) {
  // 删除蓝图相关资源
  await tx.blueprint_collection.deleteMany({
    where: {
      blueprint_id: blueprint.id,
    },
  });
  await tx.blueprint_product.deleteMany({
    where: {
      blueprint_id: blueprint.id,
    },
  });
  await tx.blueprint_comment.deleteMany({
    where: {
      blueprint_id: blueprint.id,
    },
  });
  await tx.blueprint_like.deleteMany({
    where: {
      blueprint_id: blueprint.id,
    },
  });
  await tx.blueprint.delete({
    where: {
      id: blueprint.id,
    },
  });
}
