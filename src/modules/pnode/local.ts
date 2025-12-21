import { Connection } from "./connection";
import { PodAccessibility } from "@/models/PodAccessibility.model";
import { isDBConnected } from "@/config/database";
import { QueryClient } from '@tanstack/query-core';

const RPC_PORT = 6000;

/**
 * Query client for caching pod accessibility checks
 * - Accessibility status is cached for 5 minutes
 * - Data remains in memory for up to 1 hour (garbage collection time)
 * - Automatic retry with exponential backoff
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes in milliseconds
      gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

/**
 * Internal function to check pod accessibility without caching
 */
async function checkPodAccessibilityInternal(
  apiEndpoint: string,
  podId?: string
): Promise<{ isAccessible: boolean; responseTime: number; error?: string }> {
  const connection = new Connection(apiEndpoint);
  const startTime = Date.now();
  let isAccessible = false;
  let error: string | undefined;

  try {
    await connection.getStats();
    isAccessible = true;
  } catch (err) {
    isAccessible = false;
    error = err instanceof Error ? err.message : String(err);
  }

  const responseTime = Date.now() - startTime;

  // Store in MongoDB if connected and podId is provided
  if (isDBConnected() && podId) {
    try {
      await PodAccessibility.findOneAndUpdate(
        { podId },
        {
          podId,
          endpoint: apiEndpoint,
          isAccessible,
          lastChecked: new Date(),
          responseTime: isAccessible ? responseTime : undefined,
          error: isAccessible ? undefined : error,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
        },
        { upsert: true, new: true }
      );
    } catch (dbError) {
      console.error('Failed to store pod accessibility:', dbError);
    }
  }

  if (error !== undefined) {
    return { isAccessible, responseTime, error };
  }
  return { isAccessible, responseTime };
}

/**
 * Check if a pod is accessible and store the result in the database
 * Results are cached for 5 minutes to reduce redundant checks
 * @param podEndpoint - The pod endpoint (with or without port)
 * @param podId - Optional pod ID for database storage
 * @returns Boolean indicating if the pod is accessible
 */
export async function isPodAccessible(podEndpoint: string, podId?: string): Promise<boolean> {
    let host;
    if(podEndpoint.indexOf(':') === -1) {
        host = podEndpoint;
    } else {
        const [_host] = podEndpoint.split(':');
        if(_host === undefined) {
            return false;
        }
        host = _host;
    }

    const apiEndpoint = `http://${host}:${RPC_PORT}/rpc`;

    // Use query client to cache accessibility checks
    const result = await queryClient.fetchQuery({
      queryKey: ['podAccessibility', apiEndpoint, podId],
      queryFn: () => checkPodAccessibilityInternal(apiEndpoint, podId),
    });

    return result.isAccessible;
}

/**
 * Clear the cache for a specific pod or all pods
 * @param podEndpoint - Optional endpoint to clear specific pod cache
 */
export function clearPodAccessibilityCache(podEndpoint?: string) {
  if (podEndpoint) {
    queryClient.invalidateQueries({ queryKey: ['podAccessibility', podEndpoint] });
  } else {
    queryClient.invalidateQueries({ queryKey: ['podAccessibility'] });
  }
}

/**
 * Get cached accessibility status without making a new check
 * @param podEndpoint - The pod endpoint
 * @param podId - Optional pod ID
 * @returns Cached result or undefined if not in cache
 */
export function getCachedPodAccessibility(podEndpoint: string, podId?: string) {
  let host;
  if(podEndpoint.indexOf(':') === -1) {
    host = podEndpoint;
  } else {
    const [_host] = podEndpoint.split(':');
    if(_host === undefined) {
      return undefined;
    }
    host = _host;
  }

  const apiEndpoint = `http://${host}:${RPC_PORT}/rpc`;
  return queryClient.getQueryData(['podAccessibility', apiEndpoint, podId]);
}