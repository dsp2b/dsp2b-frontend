import { message } from "antd";

export type UploadResponse = {
  postURL: string;
  formData: { [key: string]: string };
};

export function upload(
  resp: UploadResponse,
  file: any,
  t: (key: string) => string,
  req: any
) {
  // 上传文件
  const formData = new FormData();
  for (const key in resp.formData) {
    formData.append(key, resp.formData[key]);
  }
  formData.append("file", file);
  const xhr = new XMLHttpRequest();
  xhr.open("POST", resp.postURL);
  xhr.upload.onprogress = (e) => {
    console.log(e);
    req.onProgress &&
      req.onProgress({
        percent: Math.round((e.loaded / e.total) * 100),
      });
  };
  xhr.onerror = (e) => {
    req.onError &&
      req.onError({
        status: xhr.status,
        name: "上传错误",
        message: "error",
      });
  };
  xhr.onload = (e) => {
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
    message.success(t("file_upload_success"));
    req.onSuccess &&
      req.onSuccess({
        url: resp.formData.key,
      });
  };
  xhr.send(formData);
}
