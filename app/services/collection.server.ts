import { collection } from "@prisma/client";
import { authenticator } from "./auth.server";
import { errBadRequest } from "~/utils/errcode";
import { ErrUser } from "~/code/user";
import prisma from "~/db.server";
import { success } from "~/utils/httputils";

export async function collectionLike(
  request: Request,
  collection: collection,
  like: boolean
) {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return errBadRequest(request, ErrUser.UserNotLogin);
  }
  if (like) {
    let resp = await prisma.collection_like.create({
      data: {
        user_id: user.id,
        collection_id: collection.id,
      },
    });
  } else {
    await prisma.collection_like.delete({
      where: {
        user_id_collection_id: {
          user_id: user.id,
          collection_id: collection.id,
        },
      },
    });
  }
  return success();
}

export async function collectionList(
  request: Request,
  options?: {
    user_id: string;
  }
) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1") || 1;
  const user_id = options?.user_id || url.searchParams.get("user");
  const sort = url.searchParams.get("sort") || "like";
  const keyword = url.searchParams.get("keyword") || "";
  const blueprint = url.searchParams.get("blueprint") || "";
  const view = url.searchParams.get("view") || "all";
  const user = await authenticator.isAuthenticated(request);
  const where: any = { public: 1 };
  if (user_id) {
    if (user_id == user?.id) {
      delete where.public;
    }
    where.user_id = user_id;
  }
  if (keyword) {
    where.title = {
      contains: keyword,
    };
  }
  if (blueprint) {
    where.blueprint_collection = {
      some: {
        blueprint_id: blueprint,
      },
    };
  }
  if (view === "root") {
    where.OR = [
      {
        parent_id: {
          equals: null,
        },
      },
      {
        parent_id: {
          isSet: false,
        },
      },
    ];
  }
  const orderBy: any = {};
  switch (sort) {
    case "like":
      orderBy.collection_like = {
        _count: "desc",
      };
      break;
    default:
      orderBy.createtime = "desc";
      break;
  }
  const list = await prisma.collection.findMany({
    where,
    skip: (page - 1) * 20,
    take: 20,
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
    orderBy,
  });

  const total = await prisma.collection.count({
    where,
  });

  await Promise.all(
    list.map(async (val: any) => {
      const count = await prisma.blueprint_collection.count({
        where: {
          collection_id: val.id,
        },
      });
      val.blueprint_count = count;
      const like = await prisma.collection_like.count({
        where: {
          collection_id: val.id,
        },
      });
      val.like_count = like;
    })
  );

  return { list, total, currentPage: page, sort, keyword, view };
}
