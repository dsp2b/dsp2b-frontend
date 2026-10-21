import { message } from "antd";

export type UploadResponse = {
  key: string;
};

// Remix resource route 的 action 需要带 _data 参数才会返回 JSON
const UPLOAD_URL = "/upload?_data=routes/upload";

/**
 * 上传图片到服务端（本地文件存储）
 * 直接以 multipart/form-data 提交文件，由服务端 action 落盘
 */
export function upload(
  type: "blueprint" | "avatar",
  file: any,
  t: (key: string) => string,
  req: any
) {
  const formData = new FormData();
  formData.append("type", type);
  formData.append("file", file);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", UPLOAD_URL);
  xhr.upload.onprogress = (e) => {
    if (!e.lengthComputable) {
      return;
    }
    req.onProgress &&
      req.onProgress({
        percent: Math.round((e.loaded / e.total) * 100),
      });
  };
  xhr.onerror = () => {
    message.warning(t("file_upload_failed"));
    req.onError &&
      req.onError({
        status: xhr.status,
        name: "上传错误",
        message: "error",
      });
  };
  xhr.onload = () => {
    if (xhr.status >= 400) {
      message.warning(t("file_upload_failed"));
      req.onError &&
        req.onError({
          status: xhr.status,
          name: "上传错误",
          message: "error",
        });
      return;
    }
    let key = "";
    try {
      const body = JSON.parse(xhr.responseText);
      key = body?.data?.key || "";
    } catch (e) {
      console.error(e);
    }
    if (!key) {
      message.warning(t("file_upload_failed"));
      req.onError &&
        req.onError({
          status: xhr.status,
          name: "上传错误",
          message: "error",
        });
      return;
    }
    message.success(t("file_upload_success"));
    req.onSuccess &&
      req.onSuccess({
        url: key,
      });
  };
  xhr.send(formData);
}
