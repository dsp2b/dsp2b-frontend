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
