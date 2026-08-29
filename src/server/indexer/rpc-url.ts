export interface RpcEndpoints {
    http: string;
    wss: string | null;
}

export function parseRpcUrl(url: string): RpcEndpoints {
    const trimmed = url.trim();

    if (trimmed.startsWith('wss://')) {
        return { http: `https://${trimmed.slice('wss://'.length)}`, wss: trimmed };
    }
    if (trimmed.startsWith('ws://')) {
        return { http: `http://${trimmed.slice('ws://'.length)}`, wss: trimmed };
    }
    if (trimmed.startsWith('https://')) {
        return { http: trimmed, wss: `wss://${trimmed.slice('https://'.length)}` };
    }
    if (trimmed.startsWith('http://')) {
        return { http: trimmed, wss: `ws://${trimmed.slice('http://'.length)}` };
    }

    throw new Error('RPC_URL must start with http://, https://, ws://, or wss://');
}

export function resolveRpcUrl(): RpcEndpoints {
    const raw = process.env.RPC_URL || process.env.WEB3_SOCKET_URL;
    if (!raw) {
        throw new Error('RPC_URL or WEB3_SOCKET_URL is required');
    }
    return parseRpcUrl(raw);
}
