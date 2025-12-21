export type CurlRequestArg = {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  data?: Record<string, any> | string;
  proxyUrl?: string;
  verifySSL?: boolean;
  ssl?: {
    caPath?: string;
    caFile?: string;
    certFile?: string;
    keyFile?: string;
    password?: string;
  };
};

export type CurlSucessfulResponseArg = {
  statusCode: number;
  headers: Record<string, string>;
  body: Record<string, any> | string;
};

export type CurlErrorResponseArg = {
  error: string;
  code: number;
  proxy: string;
};

export type CurlResponseArg = CurlSucessfulResponseArg | CurlErrorResponseArg;
