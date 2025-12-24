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
    uptime: number, // Node uptime in milliseconds
    version: string, // Software version running on the node
    credit?: number, // Credit score or balance for the node
    credit_rank?: number // Rank of the node based on credit score
}

This are more information about node versions:
{
    name: 'Reinheim', 
    version: '0.8',
    description: \`Reinheim (v0.8) is a focused, small release in Xandeum's South Era, delivering directory tree name searching via glob patterns to make large file systems significantly more navigable for sedApps and operators.\`
},
{ 
    name: 'Heidelberg', 
    version: '0.7',
    color: '#14F195', 
    description: \`Heidelberg (v0.7) advances Xandeum's South Era by introducing comprehensive paging statistics, enabling detailed monitoring and optimization of data pages in file systems.\`
},
{ 
    name: 'Stuttgart', 
    version: '0.6',
    description: \`Stuttgart (v0.6) advances Xandeum's South Era by introducing redundancy mechanisms to the scalable storage layer for Solana, enhancing fault tolerance and data durability for smart contracts.\`
},
{ 
    name: 'Ingolstadt', 
    version: '0.5',
    description: \`The Ingolstadt release in Xandeum's South Era shifts focus to reward tracking and performance incentives, introducing a heartbeat credit systems, useing metrics to assess pNode performance. \`
},
{ 
    name: 'Herrenberg', 
    version: '0.4',
    description: \`Herrenberg shifted focus to enhanced communication, reliability, and tools for sedApps.\`
},
{ 
    name: 'TryNet', 
    version: '0.8.0-trynet.20251217111503.7a5b024',
    description: 'Node for testing purposes'
},
{
    name: 'TryNet',
    version: '0.8.0-trynet.20251212183600.9eea72e',
    description: 'Node for testing purposes'
},
{
    name: 'Others',
    version: 'Any other version',
    description: 'Nodes running custom or unrecognized validator versions'
}
Note: Some nodes might run a minor version of any of the stated versions.
*/

`;