import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  isPodAccessible,
  getPodsCredit,
  Connection as PnodeConnection,
  type RootNodeInfo,
  type LeafNodeInfo,
} from '@/modules/pnode';
import { TypedRequest } from '@/types/request.types';
import { BatchPodCheckInput } from '@/validators/pnode.validator';
import { PodAccessibility } from '@/models/PodAccessibility.model';
import { getIpInfo } from '@/modules/apiip';
import { config } from '@/config';
import { LeafNodeInfoModel } from "@/models/LeafNodeInfo.model";

/**
 * Run a pnode command (get-stats, get-pods, get-pods-with-stats, get-version)
 */
const RPC_PORT = 6000;
export const runPnodeCommand = async (
  req: TypedRequest<{ command: string, endpoint: string }>,
  res: Response
): Promise<void> => {
  const { command } = req.params;
  const { endpoint } = req.query;
  const [, host] = /(.+?):.+/.exec(endpoint!) ?? [];
  const url = `http://${host}:${RPC_PORT}/rpc`;
  const connection = new PnodeConnection(url);

  try {
    let result;
    switch (command) {
      case 'get-stats': {
        if (!host) {
          res.status(StatusCodes.BAD_REQUEST).json({
            status: 'fail',
            message: `Invalid endpoint provided: ${endpoint}`
          });

          return;
        }

        result = await connection.getStats();
        break;
      }
      case 'get-pods':
        result = await connection.getPods();
        break;
      case 'get-pods-with-stats':
        result = await connection.getPodsWithStats();
        break;
      case 'get-version':
        result = await connection.getVersion();
        break;
      default:
        res.status(StatusCodes.BAD_REQUEST).json({
          status: 'fail',
          message: `Unknown command: ${command}`
        });
        return;
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Batch check pod accessibility and store results
 */
export const batchCheckPodAccessibility = async (
  req: TypedRequest<{}, {}, BatchPodCheckInput>,
  res: Response
): Promise<void> => {
  const { endpoints } = req.body;

  const results = await Promise.allSettled(
    endpoints.map(async (endpoint) => {
      const isAccessible = await isPodAccessible(endpoint);
      return {
        endpoint,
        isAccessible,
      };
    })
  );

  const formattedResults = results.map((result, index) => {
    const endpoint = endpoints[index]!;
    if (result.status === 'fulfilled') {
      return {
        ...result.value,
        status: 'success',
      };
    } else {
      return {
        endpoint,
        isAccessible: false,
        status: 'error',
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      };
    }
  });

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      checked: formattedResults.length,
      results: formattedResults,
    },
  });
};

/**
 * Get cached pod accessibility status
 */
export const getCachedPodAccessibility = async (
  req: TypedRequest<{ podId: string }>,
  res: Response
): Promise<void> => {
  const { podId } = req.params;

  const cachedData = await PodAccessibility.findOne({ podId }).sort({ lastChecked: -1 });

  if (!cachedData) {
    res.status(StatusCodes.NOT_FOUND).json({
      status: 'fail',
      message: `No cached data found for pod ${podId}`,
    });
    return;
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: cachedData,
  });
};

/**
 * Get root node information
 * Aggregates data from all pods including stats and credits
 */
export const getRootNodeInfo = async (
  _req: TypedRequest,
  res: Response
): Promise<void> => {
  const connection = new PnodeConnection(config.pnodeClusterApi);

  const podsData = await connection.getPodsWithStats();
  const { pods } = podsData;

  const totalPods = pods.length;
  const totalStorageCommitted = pods.reduce((sum, pod) => sum + pod.storage_committed, 0);
  const totalStorageUsed = pods.reduce((sum, pod) => sum + pod.storage_used, 0);
  const averageStoragePerPod = totalPods > 0 ? totalStorageCommitted / totalPods : 0;
  const utilizationRate = totalStorageCommitted > 0
    ? (totalStorageUsed / totalStorageCommitted) * 100
    : 0;

  let totalCredits: number | undefined;
  try {
    const creditsData = await getPodsCredit();
    totalCredits = creditsData.pods_credits.reduce((sum, pc) => sum + pc.credits, 0);
  } catch (error) {
    console.error('Failed to fetch credits:', error);
  }

  const rootInfo: RootNodeInfo = {
    total_pods: totalPods,
    total_storage_committed: totalStorageCommitted,
    total_storage_used: totalStorageUsed,
    average_storage_per_pod: averageStoragePerPod,
    utilization_rate: utilizationRate,
    total_credits: totalCredits,
  };

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: rootInfo,
  });
};

/**
 * Get leaf nodes information
 * Returns detailed information about all pods
 */
export const getLeafNodesInfo = async (
  req: TypedRequest<{ first_time?: boolean }>,
  res: Response
): Promise<void> => {

  if (req.query && req.query.first_time) {
    try {
      const allNodes = await LeafNodeInfoModel.find({}).lean();
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: {
          total: allNodes.length,
          nodes: allNodes,
        },
      });

      return;
    } catch (err) {
      
    }
  }

  const connection = new PnodeConnection(config.pnodeClusterApi);
  const podsData = await connection.getPodsWithStats();
  const { pods } = podsData;

  let creditsMap = new Map<string, number>();
  try {
    const creditsData = await getPodsCredit();
    const sortedCredits = creditsData.pods_credits
      .sort((a, b) => b.credits - a.credits);

    sortedCredits.forEach((pc) => {
      creditsMap.set(pc.pod_id, pc.credits);
    });
  } catch (error) {
    console.error('Failed to fetch credits:', error);
  }

  const leafNodesPromises = pods.map(async (pod) => {
    const ipMatch = pod.address.match(/^(\d+\.\d+\.\d+\.\d+)/);
    const ipAddress = ipMatch ? ipMatch[1] : null;

    let ipInfo;
    if (ipAddress) {
      try {
        const ipData = await getIpInfo(ipAddress);
        ipInfo = {
          continentCode: ipData.continentCode,
          continentName: ipData.continentName,
          countryCode: ipData.countryCode,
          countryName: ipData.countryName,
          latitude: ipData.latitude,
          longitude: ipData.longitude,
        };
      } catch (error) {
        console.error(`Failed to fetch IP info for ${pod.pubkey}:`, error);
      }
    }

    let accessibleNodeDetail;
    let isAccessible = false;

    if (ipAddress) {
      try {
        isAccessible = await isPodAccessible(pod.address, pod.pubkey);

        if (isAccessible) {
          const podConnection = new PnodeConnection(`http://${ipAddress}:${RPC_PORT}/rpc`);
          const stats = await podConnection.getStats();

          accessibleNodeDetail = {
            cpu_usage: stats.cpu_percent,
            total_storage_size: stats.file_size,
            packets_sent: stats.packets_sent,
            packets_received: stats.packets_received,
            total_ram_available: stats.ram_total,
            total_ram_used: stats.ram_used,
            total_storage_allocated: stats.total_bytes,
          };
        }
      } catch (error) {
        console.error(`Failed to check pod accessibility for ${pod.pubkey}:`, error);
      }
    }

    const creditInfo = creditsMap.get(pod.pubkey);

    const leafInfo: LeafNodeInfo = {
      pubkey: pod.pubkey,
      is_registered: true,
      address: {
        endpoint: pod.address,
        ip_info: ipInfo,
      },
      ...(accessibleNodeDetail !== undefined && {
        accessible_node_detail: accessibleNodeDetail
      }),
      is_accessible: isAccessible,
      is_public: pod.is_public,
      last_seen: pod.last_seen_timestamp * 1000,
      is_online: (Date.now() - (pod.last_seen_timestamp * 1000)) <= 60000,
      storage_committed: pod.storage_committed,
      storage_used: pod.storage_used,
      usage_percent: pod.storage_usage_percent,
      uptime: pod.uptime,
      version: pod.version,
      ...(creditInfo !== undefined && {
        credit: creditInfo,
      })
    };

    return leafInfo;
  });

  const leafNodes = await Promise.all(leafNodesPromises);

  try {
    await LeafNodeInfoModel.deleteMany({});
    const docs = leafNodes.map(node => ({ ...node, queriedAt: new Date() }));
    if (docs.length > 0) {
      await LeafNodeInfoModel.insertMany(docs, { ordered: false });
    }
  } catch (err) {
    console.error('Failed to store leaf nodes for AI search:', err);
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      total: leafNodes.length,
      nodes: leafNodes,
    },
  });
};
