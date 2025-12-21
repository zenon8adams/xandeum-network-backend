import { ValidationError, ExternalAPIError, RPCError } from "@/errors";
import { randomUUID } from "crypto";
import { Stats, statsSchema, PodsWithStats, podsWithStatsSchema, jsonRpcResponseSchema, JsonRpcResponse } from "./types";
import { request } from "@/modules/http/curl-client";

export class Connection {
    private rpcEndpoint: string;
    constructor(endpoint: string) {
        this.rpcEndpoint = endpoint;
    }

    async getStats(): Promise<Stats> {
        const result = await this._makeRpcRequest<Stats>("get-stats");

        const validation = statsSchema.safeParse(result);
        if (!validation.success) {
            throw new ValidationError(
                `Invalid stats response format from RPC method 'get-stats'`,
                validation.error
            );
        }

        return validation.data;
    }

    async getPodsWithStats(): Promise<PodsWithStats> {
        const result = await this._makeRpcRequest<PodsWithStats>("get-pods-with-stats");

        const validation = podsWithStatsSchema.safeParse(result);
        if (!validation.success) {
            throw new ValidationError(
                `Invalid pods-with-stats response format from RPC method 'get-pods-with-stats'`,
                validation.error
            );
        }

        return validation.data;
    }

    private async _makeRpcRequest<T = any>(method: string, params?: any[]): Promise<T> {
        const payload = {
            id: randomUUID(),
            jsonrpc: "2.0",
            method,
            ...(params && { params }),
        };

        try {
            const response = await request({
                url: this.rpcEndpoint,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                data: payload,
            });

            // Check if response is an error
            if ('error' in response) {
                throw new ExternalAPIError(
                    'RPC Node',
                    `RPC request failed: ${response.error}`,
                    response.code
                );
            }

            // Check HTTP status code
            if (response.statusCode >= 400) {
                throw new ExternalAPIError(
                    'RPC Node',
                    `RPC request failed with status ${response.statusCode}`,
                    response.statusCode
                );
            }

            const rawData = response.body;

            const validationResult = jsonRpcResponseSchema.safeParse(rawData);

            if (!validationResult.success) {
                throw new ValidationError(
                    `Invalid RPC response format for method '${method}'`,
                    validationResult.error
                );
            }

            const data = validationResult.data as JsonRpcResponse<T>;

            if (data.error) {
                throw new RPCError(
                    data.error.message,
                    data.error.code,
                    method,
                    data.error.data
                );
            }

            if (data.result === undefined) {
                throw new RPCError(
                    `RPC method '${method}' returned no result`,
                    -32603,
                    method
                );
            }

            return data.result;
        } catch (error) {
            if (error instanceof ExternalAPIError ||
                error instanceof ValidationError ||
                error instanceof RPCError) {
                throw error;
            }

            throw new ExternalAPIError(
                'RPC Node',
                `Failed to execute RPC method '${method}': ${error instanceof Error ? error.message : 'Unknown error'}`,
                500,
                error
            );
        }
    }
}
