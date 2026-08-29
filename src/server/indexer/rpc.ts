export async function postJsonRpc<T>(url: string, method: string, params: unknown[]): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    });

    if (!response.ok) {
        throw new Error(`RPC HTTP ${response.status} for ${method}`);
    }

    const payload = (await response.json()) as { result?: T; error?: { message: string } };
    if (payload.error) {
        throw new Error(`RPC error (${method}): ${payload.error.message}`);
    }
    return payload.result as T;
}

export interface RpcBlockTx {
    hash: string;
    from: string;
    to: string | null;
    value: string;
}

export interface RpcBlock {
    number: string;
    timestamp: string;
    transactions: RpcBlockTx[];
}

export async function fetchBlock(httpUrl: string, blockRef: string | number): Promise<RpcBlock> {
    const param = typeof blockRef === 'number' ? `0x${blockRef.toString(16)}` : blockRef;
    return postJsonRpc<RpcBlock>(httpUrl, 'eth_getBlockByNumber', [param, true]);
}

export async function getLatestBlockNumber(httpUrl: string): Promise<number> {
    const hex = await postJsonRpc<string>(httpUrl, 'eth_blockNumber', []);
    return Number.parseInt(hex, 16);
}

export async function getBalanceEth(httpUrl: string, address: string): Promise<number> {
    const weiHex = await postJsonRpc<string>(httpUrl, 'eth_getBalance', [address, 'latest']);
    return Number(BigInt(weiHex)) / 1e18;
}

export async function erc20BalanceOf(httpUrl: string, token: string, holder: string): Promise<string> {
    const data = `0x70a08231${holder.replace(/^0x/i, '').toLowerCase().padStart(64, '0')}`;
    const hex = await postJsonRpc<string>(httpUrl, 'eth_call', [{ to: token, data }, 'latest']);
    return BigInt(hex || '0x0').toString();
}

export function hexToNumber(hex: string): number {
    return Number.parseInt(hex, 16);
}
