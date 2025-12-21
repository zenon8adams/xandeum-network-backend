import CryptoJS from 'crypto-js';
import { QueryClient } from '@tanstack/query-core';
import { IpLookup } from '@/models/IpLookup.model';
import { isPublicIPv4 } from '@/utils';
import { BadRequestError, ExternalAPIError, ValidationError } from '@/errors';
import { isDBConnected } from '@/config/database';
import { IpInfoResponse, ipInfoResponseSchema } from './types';
export type { IpInfo } from './types';

const BASE_URL = "https://apiip.net";

/**
 * Query client for caching API responses
 * - Script path is cached for 1 day
 * - Google key is cached for 1 day (per script path)
 * - Data remains in memory for up to 7 days (garbage collection time)
 * - Automatic retry with exponential backoff
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, // 1 day in milliseconds
      gcTime: 1000 * 60 * 60 * 24 * 7, // Keep in cache for 7 days (previously cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

async function getScriptFromPage() {
  const response = await fetch(BASE_URL, {
    headers: {
      "Content-Type": "text/html",
    },
  });

  if (!response.ok) {
    throw new ExternalAPIError(
      'apiip.net',
      'Unable to fetch main page',
      response.status
    );
  }

  const page = await response.text();
  const re = /src="(\/.+?main\..+?\.js)"/;
  const match = re.exec(page);

  const path = match?.[1];

  if (!path) {
    throw new ExternalAPIError(
      'apiip.net',
      'Unable to extract script path from main page'
    );
  }

  return path;
}

async function getGoogleKey(url: string) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/javascript",
    },
  });

  if (!response.ok) {
    throw new ExternalAPIError(
      'apiip.net',
      'Unable to fetch script to extract API key',
      response.status
    );
  }

  const result = await response.text();

  const modalInfos = Array.from(result.matchAll(/modalInfo:.+/g));
  const googleKeyContainer = modalInfos[modalInfos.length - 1]?.[0];

  if (!googleKeyContainer) {
    throw new ExternalAPIError(
      'apiip.net',
      'Unable to extract google key container from script'
    );
  }

  const keyRe = /modalInfo:.+?const.+?\{[a-zA-Z0-9_]+?:"([^"]+?)"\};/;
  const key = keyRe.exec(googleKeyContainer)?.[1];

  if (!key) {
    throw new ExternalAPIError(
      'apiip.net',
      'Unable to extract google API key from script'
    );
  }

  return key;
}

function getTraceID() {
  return {
    traceId: crypto.randomUUID().replace(/-/g, ""),
    spanId: crypto.randomUUID().substring(16),
    sampled: false,
  };
}

function getSentryEntryKey() {
  const { traceId, spanId, sampled } = getTraceID();
  const sampledKey = sampled ? "-1" : "-0";
  return {
    traceId,
    spanId,
    sentryKey: "".concat(traceId, "-").concat(spanId).concat(sampledKey),
    sampled,
  };
}

/**
 * Fetch IP address information from apiip.net
 * Checks MongoDB cache first, then fetches from API if not found
 * Only queries public IP addresses
 * @param ip - IP address to lookup
 * @returns IP information
 */
export async function getIpInfo(ip: string) {
  if (!isPublicIPv4(ip)) {
    throw new BadRequestError('Only public IPv4 addresses can be queried');
  }

  if (isDBConnected()) {
    const cached = await IpLookup.findOne({ 
      ip,
      expiresAt: { $gt: new Date() }
    });

    if (cached) {
      return cached.data.data as IpInfoResponse['data'];
    }
  }

  // Fetch script path with caching (cached for 1 day)
  const scriptPath = await queryClient.fetchQuery({
    queryKey: ['scriptPath'],
    queryFn: getScriptFromPage,
  });

  const fullScriptPath = `${BASE_URL}${scriptPath}`;
  
  // Fetch Google key with caching (cached for 1 day, keyed by script path)
  const code = await queryClient.fetchQuery({
    queryKey: ['googleKey', fullScriptPath],
    queryFn: () => getGoogleKey(fullScriptPath),
  });

  const { traceId, sentryKey } = getSentryEntryKey();
  const baggageId = `sentry-environment=production,sentry-public_key=75904230633849308b8cb0b121abf375,sentry-trace_id=${traceId},sentry-sample_rate=0.1,sentry-transaction=%2F,sentry-sampled=false`;
  const message = new Date().getTime().toString();
  const sessionCode = CryptoJS.AES.encrypt(message, code).toString();

  const response = await fetch(`${BASE_URL}/api/ip-check-public?ip=${ip}`, {
    headers: {
      baggage: baggageId,
      "sentry-trace": sentryKey,
      "Google-Session": sessionCode,
      Accept: "application/json, text/plain, */*",
      referer: "https://apiip.net/",
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ExternalAPIError(
      'apiip.net',
      `Unable to fetch IP details: ${text}`,
      response.status
    );
  }

  const rawData = await response.json();

  // Validate response structure with Zod
  const validationResult = ipInfoResponseSchema.safeParse(rawData);

  if (!validationResult.success) {
    throw new ValidationError(
      'Invalid IP info response format from apiip.net',
      validationResult.error
    );
  }

  const ipInfo = validationResult.data.data;

  // Store in MongoDB if connected (cache for 7 days)
  if (isDBConnected()) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await IpLookup.findOneAndUpdate(
      { ip },
      {
        ip,
        data: ipInfo,
        queriedAt: new Date(),
        expiresAt,
      },
      { upsert: true, new: true }
    );
  }

  return ipInfo;
}

export { queryClient };

export function clearScriptCache() {
  queryClient.invalidateQueries({ queryKey: ['scriptPath'] });
  queryClient.invalidateQueries({ queryKey: ['googleKey'] });
}

export function getCachedScriptPath() {
  return queryClient.getQueryData(['scriptPath']);
}