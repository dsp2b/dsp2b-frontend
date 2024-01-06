export interface APIResponse {
  [key: string]: any;
  code: number;
  msg: string;
}

export interface APIDataResponse<T> extends APIResponse {
  data: T;
}

export interface APIListResponse<T> extends APIResponse {
  data: {
    list: T[];
    total: number;
  };
}
