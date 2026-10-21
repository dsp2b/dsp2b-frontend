import { ActionFunction, json } from "@remix-run/node";
import { v4 as uuidv4 } from "uuid";
import { ErrBuleprint, ErrUser } from "~/code/user";
import { authenticator } from "~/services/auth.server";
import { LimitSvc } from "~/services/limit.server";
import { errBadRequest } from "~/utils/errcode";
import { putObject } from "~/utils/storage.server";

// 上传大小上限 4MB，与原 post policy 的 content-length-range 保持一致
const MAX_UPLOAD_SIZE = 1024 * 1024 * 4;
const ALLOWED_EXT = ["jpg", "jpeg", "png", "gif"];

export const action: ActionFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return json({});
  }
  const form = await request.formData();
  const file = form.get("file");
  const type = (form.get("type") as string) || "blueprint";
  if (["blueprint", "avatar"].indexOf(type) === -1) {
    return errBadRequest(request, ErrBuleprint.FilenameInvalid);
  }
  if (!file || typeof file === "string") {
    return errBadRequest(request, ErrBuleprint.FilenameInvalid);
  }
  const upload = file as File;
  const filename = upload.name || "";
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext || ALLOWED_EXT.indexOf(ext) === -1) {
    return errBadRequest(request, ErrBuleprint.FilenameInvalid);
  }
  if (upload.size > MAX_UPLOAD_SIZE) {
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
      const key = "images/" + type + "/" + uuidv4() + "." + ext;
      const buf = Buffer.from(await upload.arrayBuffer());
      await putObject(key, buf);
      return json({ code: 0, data: { key } });
    }
  );
  if (err) {
    return errBadRequest(request, ErrUser.UploadTooMany);
  }
  return result;
};
