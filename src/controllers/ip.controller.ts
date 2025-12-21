import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getIpInfo } from '../modules/apiip';
import type { TypedRequest } from '@/types/request.types';
import type { IpQueryInput, BatchIpInput } from '@/validators/ip.validator';

/**
 * Get IP address information from query parameter
 * IP is already validated by Zod middleware
 */
export const getIpInfoByQuery = async (
  req: TypedRequest<Record<string, string>, IpQueryInput>,
  res: Response
): Promise<void> => {
  const ip = req.query.ip;

  const ipInfo = await getIpInfo(ip);

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: ipInfo,
  });
};

/**
 * Batch lookup IP addresses and store in MongoDB
 * Processes multiple IPs and returns results for each
 */
export const batchLookupIps = async (
  req: TypedRequest<Record<string, string>, Record<string, string>, BatchIpInput>,
  res: Response
): Promise<void> => {
  const { ips } = req.body;

  const results = await Promise.allSettled(
    ips.map(async (ip) => {
      try {
        const data = await getIpInfo(ip);
        return { ip, status: 'success', data };
      } catch (error: any) {
        return { 
          ip, 
          status: 'error', 
          error: error.message || 'Unknown error'
        };
      }
    })
  );

  const successful = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<any>).value)
    .filter((r) => r.status === 'success');

  const failed = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<any>).value)
    .filter((r) => r.status === 'error');

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      total: ips.length,
      successful: successful.length,
      failed: failed.length,
      results: successful,
      errors: failed,
    },
  });
};
