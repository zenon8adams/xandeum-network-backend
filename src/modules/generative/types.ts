import { SchemaType } from "@google/generative-ai";

export interface JSONSchema {
  type: SchemaType;
  description?: string;
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: string[];
  nullable?: boolean;
}

export interface GeminiQueryConfig {
  apiKey: string;
  model?: string;
  jsonData: Record<string, any>;
  prompt: string;
  responseSchema: JSONSchema;
}

export interface GeminiResponse<T = any> {
  success: boolean;
  data?: T;
  rawText?: string;
  error?: string;
}

export const PROMPT_PREFIX = `
/*
Schema for the 'leafnodeinfos' collection:

ipAddressDetailSchema = {
    continentCode: string, // Two-letter continent code (e.g., EU, NA, AS)
    continentName: string, // Full continent name (e.g., Europe, North America)
    countryCode: string,   // Two-letter country code (ISO 3166-1 alpha-2, e.g., US, DE)
    countryName: string,   // Full country name (e.g., United States, Germany)
    latitude: number,      // Latitude of the IP address location
    longitude: number      // Longitude of the IP address location
}

leafNodeInfoSchema = {
    pubkey: string, // Unique public key identifier for the pod/node
    is_registered: boolean, // Whether the node is registered in the network
    address: {
        endpoint: string, // Network endpoint address of the node (e.g., IP:port)
        ip_info?: ipAddressDetailSchema // Geolocation and network info for the endpoint IP
    },
    accessible_node_detail?: {
        cpu_usage: number, // Current CPU usage percentage
        total_storage_size: number, // Total storage size available on the node (bytes)
        packets_sent: number, // Number of network packets sent
        packets_received: number, // Number of network packets received
        total_ram_available: number, // Total RAM available on the node (bytes)
        total_ram_used: number, // Total RAM currently used on the node (bytes)
        total_storage_allocated: number // Total storage allocated to the node (bytes)
    },
    is_accessible: boolean, // Whether the node is currently accessible via network
    is_public: boolean, // Whether the node is publicly accessible
    is_online: boolean, // Whether the node is considered online (recently seen)
    last_seen: number, // Timestamp (ms) when the node was last seen online
    storage_committed: number, // Total storage committed by the node (bytes)
    storage_used: number, // Total storage currently used by the node (bytes)
    usage_percent: number, // Percentage of committed storage currently used
    uptime: number, // Node uptime in seconds
    version: string, // Software version running on the node
    credit?: number, // Credit score or balance for the node
    credit_rank?: number // Rank of the node based on credit score
}
*/

`;