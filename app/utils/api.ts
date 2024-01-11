export function request(
  route: string,
  options: { method?: string; body?: any; headers?: HeadersInit }
) {
  const s = route.split("?");

  const url =
    "/" + route + "?_data=routes/" + route + (s.length > 1 ? "&" + s[1] : "");
  return fetch(url, {
    method: options.method,
    body: options.body,
    headers: options.headers,
  });
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
