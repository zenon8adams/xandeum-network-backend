import { z } from 'zod';

/**
 * IPv4 regex pattern
 */
const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;

/**
 * IPv6 regex pattern (simplified)
 */
const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

/**
 * Custom IP validation
 */
const ipAddress = z.string().refine(
  (val) => ipv4Pattern.test(val) || ipv6Pattern.test(val),
  { message: 'Invalid IP address format' }
);

/**
 * Schema for IP query parameter
 */
export const ipQuerySchema = z.object({
  ip: ipAddress.transform((val) => val.trim().toLowerCase()),
});

/**
 * Schema for batch IP lookup
 */
export const batchIpSchema = z.object({
  ips: z
    .array(ipAddress)
    .min(1, 'At least one IP address is required')
    .max(400, 'Maximum 100 IP addresses allowed per request'),
});

export type IpQueryInput = z.infer<typeof ipQuerySchema>;
export type BatchIpInput = z.infer<typeof batchIpSchema>;
