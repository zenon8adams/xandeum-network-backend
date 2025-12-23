import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LeafNodeInfoModel } from "@/models/LeafNodeInfo.model";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client";
import { GoogleGenAI } from "@google/genai";
import { PROMPT_PREFIX } from "./types";
import { config } from "@/config";

class MongoQueryMCP {
    private genAI: GoogleGenAI;
    private model: string;
    private server: McpServer;
    private client: Client;
    private tools: {
        name: string;
        description: string | undefined;
        parameters: {
            type: "object";
            properties: Record<string, any>;
            required: string[];
        };
    }[] = [];
    private static _instance: MongoQueryMCP | null = null; 

    constructor(apiKey: string, model: string = "gemini-2.5-flash") {
        this.genAI = new GoogleGenAI({ apiKey });
        this.server = new McpServer({
            name: "leafnode-query-server",
            version: "1.0.0"
        });
        this.client = new Client({ name: "leafnode-query-client", version: "1.0.0" });
        this.model = model;
    }

    static getInstance() {
        if(!MongoQueryMCP._instance) {
            MongoQueryMCP._instance = new MongoQueryMCP(config.generativeAiApiKey);
        }

        return MongoQueryMCP._instance;
    }

    async connect() {
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
        await this.server.connect(serverTransport);
        await this.client.connect(clientTransport);

        const toolsList = await this.client.listTools();
        this.tools = toolsList.tools.map((tool) => {
            type PropertySchema = {
                description?: string;
                type?: object | string;
                properties?: Record<string, PropertySchema>;
                items?: { type?: string };
            };
            const cleanProperties: Record<string, any> = {};

            const properties = tool.inputSchema.properties as Record<string, PropertySchema> | undefined;
            if (properties) {
                for (const [key, value] of Object.entries(properties)) {
                    cleanProperties[key] = {
                        description: value.description || "",
                        type: value.type || "string",
                    };

                    if (value.properties) {
                        const nestedProperties: Record<string, any> = {};
                        for (const [nestedKey, nestedValue] of Object.entries(value.properties)) {
                            nestedProperties[nestedKey] = {
                                description: nestedValue.description || "",
                                type: nestedValue.type || "string",
                            };
                        }
                        cleanProperties[key].properties = nestedProperties;
                    }

                    if (value.items) {
                        cleanProperties[key].items = {
                            type: value.items.type || "string",
                        };
                    }
                }
            }

            return {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: tool.inputSchema.type,
                    properties: cleanProperties,
                    required: tool.inputSchema.required || [],
                },
            };
        });
    }

    linkTools() {
        this.server.tool(
            "findDocuments",
            "Find documents in the 'leafnodeinfos' collection",
            {
                query: z.record(z.string(), z.any())
                    .describe("The leafnodeinfos query filter").optional().default({}),
                options: z.object({
                    limit: z.number().optional().describe("Maximum number of documents to return"),
                    skip: z.number().optional().describe("Number of documents to skip"),
                    sort: z.record(z.string(), z.any()).optional()
                        .describe("Sort criteria (e.g. {field: 1} for ascending, {field: -1} for descending)")
                }).optional().default({})
            },
            async (arg) => {
                try {
                    const { query, options } = arg;
                    let cursor = LeafNodeInfoModel.find(query || {});
                    if (options) {
                        if (options.limit) cursor = cursor.limit(options.limit);
                        if (options.skip) cursor = cursor.skip(options.skip);
                        if (options.sort) cursor = cursor.sort(options.sort);
                    }
                    const results = await cursor.exec();
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Found ${results.length} documents in collection 'leafnodeinfos'`
                            },
                            {
                                type: "text",
                                text: JSON.stringify(results, null, 2)
                            }
                        ],
                    };
                } catch (error: any) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Error finding documents: ${error.message}`
                            }
                        ]
                    };
                }
            }
        );

        this.server.tool(
            "findOneDocument",
            "Find a single document in the 'leafnodeinfos' collection",
            {
                query: z.record(z.string(), z.any()).describe("The query filter")
            },
            async (arg) => {
                try {
                    const { query } = arg;
                    const result = await LeafNodeInfoModel.findOne(query);
                    return {
                        content: [
                            {
                                type: "text",
                                text: result ? `Found document in collection 'leafnodeinfos'`
                                    : `No document found in collection 'leafnodeinfos' matching the query`
                            },
                            {
                                type: "text",
                                text: result ? JSON.stringify(result, null, 2) : "null"
                            }
                        ],
                        isError: false
                    };
                } catch (error: any) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Error finding document: ${error.message}`
                            }
                        ]
                    };
                }
            }
        );
    }

    async ask(prompt: string) {
        try {
            const response = await this.genAI.models.generateContent({
                model: this.model,
                contents: [
                    { role: "user", parts: [{ text: PROMPT_PREFIX + prompt }] }
                ],
                config: {
                    tools: [
                        {
                            functionDeclarations: this.tools as any,
                        },
                    ],
                },
            });
            const functionCall = response?.candidates?.[0]?.content?.parts?.[0]?.functionCall;

            if (functionCall) {
                const toolResponse = await this.client.callTool({
                    name: functionCall.name!,
                    arguments: functionCall.args,
                });

                const content: any | undefined = toolResponse.content;

                if (content[1]) {
                    return JSON.parse(content[1].text);
                }

                return content?.[0]?.text;
            }

            return response?.candidates?.[0]?.content?.parts?.[0]?.text;
        } catch (error) {
            console.error("Error communicating with Gemini API:", error);
            return "Sorry, I encountered an error while processing your request.";
        }
    }
}

export default MongoQueryMCP.getInstance();