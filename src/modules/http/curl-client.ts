import * as fs from "node:fs";

import { Curl, CurlHttpVersion } from "node-libcurl";
import { CurlRequestArg, CurlResponseArg } from "./types";
/**
 * Make an HTTP request using node-libcurl with Promise wrapper
 *
 * @param {Object} options - Request options
 * @param {string} options.url - The URL to request
 * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {Object} [options.headers] - HTTP headers
 * @param {Object|string} [options.data] - Request body data
 * @param {string} [options.proxyUrl] - Proxy URL to use
 * @param {boolean} [options.verifySSL=true] - Whether to verify SSL certificates
 * @returns {Promise<Object>} - Promise resolving to response object
 */
export function request(options: CurlRequestArg): Promise<CurlResponseArg> {
  return new Promise((resolve, reject) => {
    const curl = new Curl();
    const {
      url,
      method = "GET",
      headers = {},
      data,
      proxyUrl,
      ssl,
    } = options;

    // Merge default headers with user-provided headers
    const finalHeaders = Object.entries({
      ...headers,
    }).map(([key, value]) => `${key}: ${value}`);

    // Configure curl options
    curl.setOpt(Curl.option.URL, url);
    curl.setOpt(Curl.option.FOLLOWLOCATION, true);
    curl.setOpt(Curl.option.HTTPHEADER, finalHeaders);
    
    // Set timeout to 5 seconds
    curl.setOpt(Curl.option.TIMEOUT, 5);
    curl.setOpt(Curl.option.CONNECTTIMEOUT, 5);

    // curl.setOpt(Curl.option.VERBOSE, true);

    // Configure SSL verification options

    // Additional TLS configuration if needed
    curl.setOpt(Curl.option.SSL_VERIFYPEER, true);
    curl.setOpt(Curl.option.SSL_VERIFYHOST, 2);
    curl.setOpt(Curl.option.HTTP_VERSION, CurlHttpVersion.V2_0);
    curl.setOpt(Curl.option.ACCEPT_ENCODING, "gzip, deflate, br");
    
    // Configure SSL certificates if provided
    if (ssl) {
      if (ssl.caPath && fs.existsSync(ssl.caPath)) {
        curl.setOpt(Curl.option.CAPATH, ssl.caPath);
      }

      if (ssl.caFile && fs.existsSync(ssl.caFile)) {
        curl.setOpt(Curl.option.CAINFO, ssl.caFile);
      }

      // Set client certificate if provided
      if (ssl.certFile && fs.existsSync(ssl.certFile)) {
        curl.setOpt(Curl.option.SSLCERT, ssl.certFile);

        // Set certificate type (default is PEM)
        curl.setOpt(Curl.option.SSLCERTTYPE, "PEM");
      }

      // Set client private key if provided
      if (ssl.keyFile && fs.existsSync(ssl.keyFile)) {
        curl.setOpt(Curl.option.SSLKEY, ssl.keyFile);

        // Set key type (default is PEM)
        curl.setOpt(Curl.option.SSLKEYTYPE, "PEM");

        // Set key password if provided
        if (ssl.password) {
          curl.setOpt(Curl.option.KEYPASSWD, ssl.password);
        }
      }
    }

    // Set HTTP method
    if (method !== "GET") {
      curl.setOpt(Curl.option.CUSTOMREQUEST, method);
    }

    // Set request body if provided
    if (data && method === "POST") {
      const bodyData = typeof data === "string" ? data : JSON.stringify(data);
      curl.setOpt(Curl.option.POST, true);
      curl.setOpt(Curl.option.POSTFIELDS, bodyData);
    }

    // Set proxy if provided
    if (proxyUrl) {
      curl.setOpt(Curl.option.PROXY, proxyUrl);
      curl.setOpt(Curl.option.PROXYHEADER, finalHeaders);
    }

    // Handle response data
    let responseBody = "";
    let responseHeaders = "";

    curl.setOpt(Curl.option.WRITEFUNCTION, (chunk: Buffer) => {
      responseBody += chunk.toString();
      return chunk.length;
    });

    curl.setOpt(Curl.option.HEADERFUNCTION, (chunk: Buffer) => {
      responseHeaders += chunk.toString();
      return chunk.length;
    });

    // Perform the request
    curl.on("end", (statusCode: number) => {
      curl.close();
      const body = tryParseJson(responseBody);
      if (typeof body === "string" && statusCode >= 400) {
        // If the response is a string and status code is 4xx or 5xx,
        // reject the promise
        reject({
          message: body,
          code: statusCode,
          proxy: proxyUrl,
        });
      } else {
        resolve({
          statusCode,
          headers: parseHeaders(responseHeaders),
          body,
        });
      }
    });

    curl.on("error", (error: Error, errorCode: number) => {
      curl.close();
      reject({
        message: error,
        code: errorCode,
        proxy: proxyUrl,
      });
    });

    curl.perform();
  });
}

/**
 * Helper function to parse response headers
 * @param {string} headersString - Raw headers string
 * @returns {Record<string, string>} - Parsed headers object
 */
function parseHeaders(headersString: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const headerLines = headersString.split(/\r?\n/);

  headerLines.forEach((line) => {
    const parts = line.split(": ") as [string, string];
    if (parts.length === 2) {
      const [name, value] = parts;
      headers[name.toLowerCase()] = value;
    }
  });

  return headers;
}

/**
 * Try to parse a string as JSON, return the original string if parsing fails
 * @param {string} str - String to parse
 * @returns {Object|string} - Parsed JSON or original string
 */
function tryParseJson(str: string): string | Record<string, any> {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
}

// Example usage functions
export async function get(url: string, options: CurlRequestArg) {
  return request({ method: "GET", ...options, url });
}

export async function post(url: string, data: string, options: CurlRequestArg) {
  return request({ method: "POST", data, ...options, url });
}
