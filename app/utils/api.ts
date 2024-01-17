import { useFetcher } from "@remix-run/react";
import { useState } from "react";

export type RequestOptions = {
  params?: { [key: string]: string };
  method?: string;
  body?: any;
  headers?: HeadersInit;
};

export function routeToUrl(route: string, options: RequestOptions) {
  const s = route.split("?");
  route = s[0];
  let url = "/" + route.replaceAll("_", "");

  if (options.params) {
    url = url.replaceAll(".", "/");
    Object.keys(options.params).forEach((key) => {
      url = url.replace("$" + key, options.params![key]);
    });
  }
  return url + "?_data=routes/" + route + (s.length > 1 ? "&" + s[1] : "");
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

export function useRequest(route: string) {
  const [loading, setLoading] = useState(false);

  return {
    submit: async (options: RequestOptions) => {
      setLoading(true);
      options.method = "POST";
      return request(route, options).then((resp) => {
        setLoading(false);
        return resp;
      });
    },
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
