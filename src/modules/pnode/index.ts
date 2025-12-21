import { Connection, PublicKey } from '@solana/web3.js';
import { ExternalAPIError, ValidationError } from '@/errors/AppError';
import { podsCreditsSchema, type PodsCredits } from './types';

export { Connection } from './connection';
export { isPodAccessible } from './local';
export type { Stats, PodsWithStats, Pod, PodsCredits, PodCredit, RootNodeInfo, LeafNodeInfo, IpAddressDetail } from './types';

export async function getRegisteredPnodes() {
    const connection = new Connection("https://api.devnet.xandeum.com:8899", "confirmed");
    const index = new PublicKey("GHTUesiECzPRHTShmBGt9LiaA89T8VAzw8ZWNE6EvZRs");
    const indexData = await connection.getParsedAccountInfo(index);
    if (indexData?.value == null) {
        return [];
    }

    const indexBuf = indexData.value.data as Buffer<ArrayBufferLike>;

    let pnodes = [];
    for (let i = 0; i < indexBuf.length; i += 32) {
        const pubkeyBytes = indexBuf.subarray(i, i + 32);
        const pubkey = new PublicKey(pubkeyBytes);
        if (pubkey.equals(PublicKey.default)) {
            continue;
        }

        pnodes.push(pubkey.toBase58());
    }

    return pnodes;
}

/**
 * Fetch pods credits from the Xandeum network API
 * @returns Array of pod credits with pod_id and credits
 * @throws {ExternalAPIError} If the API request fails
 * @throws {ValidationError} If the response doesn't match the expected schema
 */
export async function getPodsCredit(): Promise<PodsCredits> {
    const url = 'https://podcredits.xandeum.network/api/pods-credits';

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new ExternalAPIError(
                'Xandeum Pods Credits API',
                `Failed to fetch pods credits: ${response.status} ${response.statusText}`,
                response.status,
                { url, statusText: response.statusText }
            );
        }

        const data = await response.json();

        const validationResult = podsCreditsSchema.safeParse(data);

        if (!validationResult.success) {
            throw new ValidationError(
                'Invalid pods credits response format',
                validationResult.error
            );
        }

        return validationResult.data;
    } catch (error) {
        if (error instanceof ExternalAPIError || error instanceof ValidationError) {
            throw error;
        }

        throw new ExternalAPIError(
            'Xandeum Pods Credits API',
            `Network error while fetching pods credits: ${error instanceof Error ? error.message : String(error)}`,
            502, // Bad Gateway for network errors
            { url, originalError: error }
        );
    }
}