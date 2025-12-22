import { z } from 'zod';


/**
 * IP Info response schema from apiip.net
 */
export const ipInfoSchema = z.object({
  ip: z.string(),
  continentCode: z.string(),
  continentName: z.string(),
  countryCode: z.string(),
  countryName: z.string(),
  countryNameNative: z.string().optional(),
  officialCountryName: z.string().optional(),
  regionCode: z.string().optional(),
  regionName: z.string().optional(),
  cityGeoNameId: z.number().optional(),
  city: z.string().optional(),
  cityWOSC: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  capital: z.string().optional(),
  phoneCode: z.string().optional(),
  countryFlagEmoj: z.string().optional(),
  countryFlagEmojUnicode: z.string().optional(),
  isEu: z.boolean().optional(),
  borders: z.array(z.string()).optional(),
  topLevelDomains: z.array(z.string()).optional(),
  languages: z.record(z.string(), z.any()).optional(),
  currency: z.object({
    code: z.string(),
    name: z.string(),
    symbol: z.string(),
    number: z.string(),
    rates: z.any().optional(),
  }).optional(),
  timeZone: z.object({
    id: z.string(),
    currentTime: z.string(),
    code: z.string(),
    timeZoneName: z.string(),
    utcOffset: z.number(),
  }).optional(),
  userAgent: z.object({
    isMobile: z.boolean(),
    isiPod: z.boolean(),
    isTablet: z.boolean(),
    isDesktop: z.boolean(),
    isSmartTV: z.boolean(),
    isRaspberry: z.boolean(),
    isBot: z.boolean(),
    browser: z.string(),
    browserVersion: z.string(),
    operatingSystem: z.string(),
    platform: z.string(),
    source: z.string(),
  }).optional(),
  connection: z.object({
    asn: z.number(),
    isp: z.string(),
    descr: z.string(),
    regCountry: z.string(),
    isActive: z.boolean(),
    website: z.string().optional(),
    abuseEmail: z.string().optional(),
    type: z.string(),
    created: z.string().optional(),
    updated: z.string().optional(),
    rir: z.string(),
  }).optional(),
  security: z.object({
    isProxy: z.boolean(),
    isBogon: z.boolean(),
    isTorExitNode: z.boolean(),
    isCloud: z.boolean(),
    isHosting: z.boolean(),
    isSpamhaus: z.boolean(),
    suggestion: z.string(),
    network: z.string(),
  }).optional(),
});

/**
 * API response wrapper schema
 */
export const ipInfoResponseSchema = z.object({
  data: ipInfoSchema,
  success: z.boolean(),
});

export type IpInfo = z.infer<typeof ipInfoSchema>;
export type IpInfoResponse = z.infer<typeof ipInfoResponseSchema>;