import { ActionFunction, json } from "@remix-run/node";
import { Client } from "minio";
import { v4 as uuidv4 } from "uuid";
import { ErrBuleprint, ErrUser } from "~/code/user";
import { authenticator } from "~/services/auth.server";
import { LimitSvc } from "~/services/limit.server";
import { errBadRequest } from "~/utils/errcode";

export const action: ActionFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return json({});
  }
  const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT!,
    port: parseInt(process.env.MINIO_PORT!),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
  });
  const bucket = process.env.MINIO_BUCKET!;

  const { filename } = await request.json();
  // 取出后缀
  const ext = filename.split(".").pop();
  if (!ext) {
    return errBadRequest(request, ErrBuleprint.FilenameInvalid);
  }
  // 如果不是图片文件
  if (["jpg", "jpeg", "png", "gif"].indexOf(ext) === -1) {
    return errBadRequest(request, ErrBuleprint.FilenameInvalid);
  }
  const [result, err] = await LimitSvc.limit(
    request,
    user.id,
    "upload",
    filename,
    new Date(Date.now() + 1000 * 60 * 5),
    20,
    async () => {
      const policy = minioClient.newPostPolicy();
      policy.setContentType("image/*");
      policy.setKey("images/blueprint/" + uuidv4() + "." + ext);
      policy.setBucket(bucket);
      policy.setExpires(new Date(Date.now() + 60 * 100 * 1000));
      policy.setContentLengthRange(0, 1024 * 1024 * 4);
      policy.setUserMetaData({
        uid: user.id,
        filename: filename,
      });
      const url = await minioClient.presignedPostPolicy(policy);
      return json({ code: 0, data: url });
    }
  );
  if (err) {
    return errBadRequest(request, ErrUser.UploadTooMany);
  }
  return result;
};
