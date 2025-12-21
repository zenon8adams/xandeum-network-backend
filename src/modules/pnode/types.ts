import { z } from "zod";

/**
 * JSON-RPC error schema
 */
const jsonRpcErrorSchema = z.object({
    code: z.number(),
    message: z.string(),
    data: z.any().optional(),
});

/**
 * JSON-RPC response schema
 */
export const jsonRpcResponseSchema = z.object({
    jsonrpc: z.literal("2.0"),
    id: z.string(),
    result: z.any().optional(),
    error: jsonRpcErrorSchema.nullable(),
});

export type JsonRpcResponse<T = any> = {
    jsonrpc: "2.0";
    id: string;
    result?: T;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
};

/**
 * Pod schema for get-pods-with-stats
 */
export const podSchema = z.object({
    address: z.string(),
    is_public: z.boolean().nullable().transform(val => val ?? false),
    last_seen_timestamp: z.number(),
    pubkey: z.string().nullable().transform(val => val ?? "Unavailable"),
    rpc_port: z.number().nullable().transform(val => val ?? 0),
    storage_committed: z.number().nullable().transform(val => val ?? 0),
    storage_usage_percent: z.number().nullable().transform(val => val ?? 0),
    storage_used: z.number().nullable().transform(val => val ?? 0),
    uptime: z.number().nullable().transform(val => val ?? 0),
    version: z.string(),
});

/**
 * Pods with stats response schema
 */
export const podsWithStatsSchema = z.object({
    pods: z.array(podSchema),
    total_count: z.number()
});

export type Pod = z.infer<typeof podSchema>;
export type PodsWithStats = z.infer<typeof podsWithStatsSchema>;

/**
 * Stats response schema for get-stats
 */
export const statsSchema = z.object({
    active_streams: z.number(),
    cpu_percent: z.number(),
    current_index: z.number(),
    file_size: z.number(),
    last_updated: z.number(),
    packets_received: z.number(),
    packets_sent: z.number(),
    ram_total: z.number(),
    ram_used: z.number(),
    total_bytes: z.number(),
    total_pages: z.number(),
    uptime: z.number(),
});

export type Stats = z.infer<typeof statsSchema>;

/**
 * Pod credit schema for pods-credits API
 */
export const podCreditSchema = z.object({
    credits: z.number(),
    pod_id: z.string(),
});

/**
 * Pods credits response schema
 */
export const podsCreditsSchema = z.object({
    pods_credits: z.array(podCreditSchema),
});

export type PodCredit = z.infer<typeof podCreditSchema>;
export type PodsCredits = z.infer<typeof podsCreditsSchema>;

/**
 * IP Address detail schema
 */
export const ipAddressDetailSchema = z.object({
    continentCode: z.string(),
    continentName: z.string(),
    countryCode: z.string(),
    countryName: z.string(),
    latitude: z.number(),
    longitude: z.number(),
});

export type IpAddressDetail = z.infer<typeof ipAddressDetailSchema>;

/**
 * Root node information schema
 */
export const rootNodeInfoSchema = z.object({
    total_pods: z.number(),
    total_storage_committed: z.number(),
    total_storage_used: z.number(),
    average_storage_per_pod: z.number(),
    utilization_rate: z.number(),
    total_credits: z.number().optional(),
});

export type RootNodeInfo = z.infer<typeof rootNodeInfoSchema>;

/**
 * Leaf node information schema
 */
export const leafNodeInfoSchema = z.object({
    pubkey: z.string(),
    is_registered: z.boolean(),
    address: z.object({
        endpoint: z.string(),
        ip_info: ipAddressDetailSchema.optional(),
    }),
    accessible_node_detail: z.object({
        cpu_usage: z.number(),
        total_storage_size: z.number(),
        packets_sent: z.number(),
        packets_received: z.number(),
        total_ram_available: z.number(),
        total_ram_used: z.number(),
        total_storage_allocated: z.number(),
    }).optional(),
    is_accessible: z.boolean(),
    is_public: z.boolean(),
    is_online: z.boolean(),
    last_seen: z.number(),
    storage_committed: z.number(),
    storage_used: z.number(),
    usage_percent: z.number(),
    uptime: z.number(),
    version: z.string(),
    credit: z.number().optional(),
    credit_rank: z.number().optional(),
});

export type LeafNodeInfo = z.infer<typeof leafNodeInfoSchema>;