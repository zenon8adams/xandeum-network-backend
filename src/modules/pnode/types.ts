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

export const versionSchema = z.object({
    version: z.string()
});

export type Version = z.infer<typeof versionSchema>;

export const podsSchema = z.object({
    pods: z.array(z.object({
        address: z.string(),
        last_seen_timestamp: z.number(),
        pubkey: z.string().nullable(),
        version: z.string()
    })),
    total_count: z.number()
});

export type Pods = z.infer<typeof podsSchema>;

/**
 * IP Address detail schema
 */
export const ipAddressDetailSchema = z.object({
    continentCode: z.string().describe('Two-letter continent code (e.g., EU, NA, AS)'),
    continentName: z.string().describe('Full continent name (e.g., Europe, North America)'),
    countryCode: z.string().describe('Two-letter country code (ISO 3166-1 alpha-2, e.g., US, DE)'),
    countryName: z.string().describe('Full country name (e.g., United States, Germany)'),
    latitude: z.number().describe('Latitude of the IP address location'),
    longitude: z.number().describe('Longitude of the IP address location'),
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
    pubkey: z.string().describe('Unique public key identifier for the pod/node'),
    is_registered: z.boolean().describe('Whether the node is registered in the network'),
    address: z.object({
        endpoint: z.string().describe('Network endpoint address of the node (e.g., IP:port)'),
        ip_info: ipAddressDetailSchema.optional().describe('Geolocation and network info for the endpoint IP'),
    }).describe('Network address and geolocation info for the node'),
    accessible_node_detail: z.object({
        cpu_usage: z.number().describe('Current CPU usage percentage'),
        total_storage_size: z.number().describe('Total storage size available on the node (bytes)'),
        packets_sent: z.number().describe('Number of network packets sent'),
        packets_received: z.number().describe('Number of network packets received'),
        total_ram_available: z.number().describe('Total RAM available on the node (bytes)'),
        total_ram_used: z.number().describe('Total RAM currently used on the node (bytes)'),
        total_storage_allocated: z.number().describe('Total storage allocated to the node (bytes)'),
    }).optional().describe('Detailed resource usage stats if node is accessible'),
    is_accessible: z.boolean().describe('Whether the node is currently accessible via network'),
    is_public: z.boolean().describe('Whether the node is publicly accessible'),
    is_online: z.boolean().describe('Whether the node is considered online (recently seen)'),
    last_seen: z.number().describe('Timestamp (ms) when the node was last seen online'),
    storage_committed: z.number().describe('Total storage committed by the node (bytes)'),
    storage_used: z.number().describe('Total storage currently used by the node (bytes)'),
    usage_percent: z.number().describe('Percentage of committed storage currently used'),
    uptime: z.number().describe('Node uptime in seconds'),
    version: z.string().describe('Software version running on the node'),
    credit: z.number().optional().describe('Credit score or balance for the node'),
    credit_rank: z.number().optional().describe('Rank of the node based on credit score'),
});

export type LeafNodeInfo = z.infer<typeof leafNodeInfoSchema>;

export const leafNodeInfoArraySchema = z.array(leafNodeInfoSchema);