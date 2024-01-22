import { FileUploadHandlerOptions } from "@remix-run/node/dist/upload/fileUploadHandler";
import type {
  RcFile as OriRcFile,
  UploadRequestOption,
} from "rc-upload/lib/interface";
import {
  useFetcher,
  useLocation,
  useNavigation,
  useResolvedPath,
} from "@remix-run/react";
import { message } from "antd";
import { useState } from "react";
import { APIDataResponse } from "~/services/api";
import { RcFile } from "antd/es/upload";
import { getLocale, getLocaleByURL } from "./i18n";

export type RequestOptions = {
  params?: { [key: string]: string };
  method?: string;
  body?: any;
  headers?: HeadersInit;
  search?: string;
};

export function routeToUrl(route: string, options: RequestOptions) {
  const s = route.split("?");
  route = s[0];
  let url = "/" + route.replaceAll("_", "");
  url = url.replaceAll(".", "/");
  if (options.params) {
    Object.keys(options.params).forEach((key) => {
      url = url.replace("$" + key, options.params![key]);
    });
  }
  return (
    url +
    "?_data=routes/" +
    route +
    (s.length > 1 ? "&" + s[1] : "") +
    (options.search ? "&" + options.search : "")
  );
}

class ResponsePrimse<T = any> {
  private promise: Promise<Response>;

  private thenCallback?: (value: Response) => any;

  private errorCallback?: (code: number, msg: string) => any;

  private successCallback?: (value: T) => any;

  constructor(promise: Promise<Response>) {
    this.promise = promise;
    this.promise.then(this._then.bind(this));
  }

  private _then(value: Response) {
    this.thenCallback && this.thenCallback(value);
    if (value.status == 200) {
      value.json().then((data: APIDataResponse<T>) => {
        this.successCallback && this.successCallback(data.data);
      });
    } else if (value.status < 500) {
      value.json().then((data: APIDataResponse<T>) => {
        if (this.errorCallback) {
          this.errorCallback(data.code, data.msg);
        } else {
          message.error(data.msg);
        }
      });
    } else {
      message.error("Server error");
    }
  }

  public then(callback: (value: Response) => any) {
    this.thenCallback = callback;
    return this;
  }

  public success(callback: (data: T) => any) {
    this.successCallback = callback;
    return this;
  }

  public error(callback: (code: number, msg: string) => any) {
    this.errorCallback = callback;
    return this;
  }
}

export function request(route: string, options: RequestOptions) {
  const url = routeToUrl(route, options);
  const opts: RequestInit = {
    method: options.method,
    body: options.body,
    headers: options.headers || {},
  };
  if (typeof options.body === "object") {
    // @ts-ignore
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(opts.body);
  }
  return fetch(url, opts);
}

export function get(route: string) {
  return request(route, { method: "GET" });
}

export function postForm(route: string, form: FormData) {
  return request(route, {
    method: "POST",
    body: form,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export function post(route: string, data: any) {
  return request(route, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function useRequest<T>(route: string) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  return {
    submit: (options: RequestOptions) => {
      setLoading(true);
      options.method = options.method ?? "POST";
      options.params = options.params || {};
      options.params.lng = getLocaleByURL(location.href);
      return new ResponsePrimse<T>(
        request("$lng." + route, options).then((resp) => {
          setLoading(false);
          return resp;
        })
      );
    },
    setData: setData,
    data: data,
    loading: loading,
  };
}

export function replaceSearchParam(
  search: string,
  params: { [key: string]: any }
): string {
  for (const key in params) {
    if (search.indexOf(key + "=") > -1) {
      const regex = new RegExp(key + "=.*?(&|$)");
      search = search.replace(regex, key + "=" + params[key] + "$1");
    } else {
      search += (search ? "&" : "") + key + "=" + params[key];
    }
  }
  return search;
}
