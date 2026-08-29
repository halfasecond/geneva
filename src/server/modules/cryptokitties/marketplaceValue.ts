import Web3 from 'web3';
import Contracts from './contracts';

const Web3Ctor = Web3 as any;
const web3 = new Web3Ctor();

const CK = Contracts.Core.addr.toLowerCase();
const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const ZERO = '0x0000000000000000000000000000000000000000';

export const ORDER_FULFILLED_TOPIC =
    '0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31';
export const ORDERS_MATCHED_TOPIC =
    '0xc4109843e0b7d514e4c093114b863f8e7d8d9a458c372cd51bfe526b588006c9';
export const TRANSFER_TOPIC =
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const ORDER_FULFILLED_INPUTS = [
    { indexed: false, name: 'orderHash', type: 'bytes32' },
    { indexed: true, name: 'offerer', type: 'address' },
    { indexed: true, name: 'zone', type: 'address' },
    { indexed: false, name: 'recipient', type: 'address' },
    {
        components: [
            { name: 'itemType', type: 'uint8' },
            { name: 'token', type: 'address' },
            { name: 'identifier', type: 'uint256' },
            { name: 'amount', type: 'uint256' },
        ],
        indexed: false,
        name: 'offer',
        type: 'tuple[]',
    },
    {
        components: [
            { name: 'itemType', type: 'uint8' },
            { name: 'token', type: 'address' },
            { name: 'identifier', type: 'uint256' },
            { name: 'amount', type: 'uint256' },
            { name: 'recipient', type: 'address' },
        ],
        indexed: false,
        name: 'consideration',
        type: 'tuple[]',
    },
];

const ORDERS_MATCHED_INPUTS = [
    { indexed: false, name: 'buyHash', type: 'bytes32' },
    { indexed: false, name: 'sellHash', type: 'bytes32' },
    { indexed: true, name: 'maker', type: 'address' },
    { indexed: true, name: 'taker', type: 'address' },
    { indexed: false, name: 'price', type: 'uint256' },
    { indexed: true, name: 'metadata', type: 'bytes32' },
];

export type RpcLog = { address: string; topics: string[]; data: string };

const asAddr = (v: unknown) => String(v || '').toLowerCase();
const asType = (v: unknown) => Number(v);
const asId = (v: unknown) => Number(v);
const asWei = (v: unknown) => BigInt(typeof v === 'bigint' ? v.toString() : String(v || '0'));

const ckIds = (items: any[] | undefined) => {
    if (!Array.isArray(items)) return [] as number[];
    return items
        .filter((item) => asType(item.itemType) === 2 && asAddr(item.token) === CK)
        .map((item) => asId(item.identifier));
};

const paymentWei = (items: any[] | undefined): bigint => {
    if (!Array.isArray(items)) return 0n;
    let native = 0n;
    let weth = 0n;
    for (const item of items) {
        const t = asType(item.itemType);
        const tok = asAddr(item.token);
        const amt = asWei(item.amount);
        if (t === 0) native += amt;
        else if (t === 1 && tok === WETH) weth += amt;
    }
    if (native > 0n) return native;
    return weth;
};

export const padValue = (wei: bigint | string) => BigInt(wei).toString().padStart(35, '0');

/** Per-kitty ETH/WETH from marketplace logs. Never uses tx.value. */
export const valuesFromLogs = (logs: RpcLog[]): Map<number, bigint> => {
    const values = new Map<number, bigint>();
    const wyvernPrices: bigint[] = [];
    const ckTransfers: number[] = [];

    for (const log of logs) {
        const topic0 = (log.topics?.[0] || '').toLowerCase();
        const addr = asAddr(log.address);

        if (addr === CK && topic0 === TRANSFER_TOPIC) {
            try {
                const decoded = web3.eth.abi.decodeParameters(
                    ['address', 'address', 'uint256'],
                    log.data,
                );
                const from = asAddr(decoded[0] ?? decoded.from);
                const tokenId = asId(decoded[2] ?? decoded['2']);
                if (from !== ZERO) ckTransfers.push(tokenId);
            } catch {
                /* ignore */
            }
            continue;
        }

        if (topic0 === ORDER_FULFILLED_TOPIC) {
            try {
                const decoded = web3.eth.abi.decodeLog(
                    ORDER_FULFILLED_INPUTS,
                    log.data,
                    log.topics.slice(1),
                ) as any;
                const offered = ckIds(decoded.offer);
                const received = ckIds(decoded.consideration);
                if (offered.length === 1 && received.length === 0) {
                    const pay = paymentWei(decoded.consideration);
                    if (pay > 0n) values.set(offered[0], pay);
                } else if (received.length === 1 && offered.length === 0) {
                    const pay = paymentWei(decoded.offer);
                    if (pay > 0n) values.set(received[0], pay);
                } else if (offered.length === 1) {
                    const pay = paymentWei(decoded.consideration);
                    if (pay > 0n) values.set(offered[0], pay);
                }
            } catch {
                /* ignore malformed seaport log */
            }
            continue;
        }

        if (topic0 === ORDERS_MATCHED_TOPIC) {
            try {
                const decoded = web3.eth.abi.decodeLog(
                    ORDERS_MATCHED_INPUTS,
                    log.data,
                    log.topics.slice(1),
                ) as any;
                const price = asWei(decoded.price);
                if (price > 0n) wyvernPrices.push(price);
            } catch {
                /* ignore */
            }
        }
    }

    const unassigned = ckTransfers.filter((id) => !values.has(id));
    if (unassigned.length === 1 && wyvernPrices.length === 1) {
        values.set(unassigned[0], wyvernPrices[0]);
    }

    return values;
};

type ReceiptWeb3 = {
    eth: {
        getTransactionReceipt?: (hash: string) => Promise<{ logs?: RpcLog[] } | null>;
    };
};

const receiptCache = new Map<string, Promise<Map<number, bigint>>>();

export const valuesForTx = async (web3Client: ReceiptWeb3, txHash: string): Promise<Map<number, bigint>> => {
    const hash = txHash.toLowerCase();
    const hit = receiptCache.get(hash);
    if (hit) return hit;
    const getter = web3Client.eth.getTransactionReceipt;
    if (!getter) return new Map();
    const pending = getter.call(web3Client.eth, txHash).then((receipt) => {
        const logs = (receipt?.logs || []) as RpcLog[];
        return valuesFromLogs(logs);
    });
    receiptCache.set(hash, pending);
    if (receiptCache.size > 256) {
        const first = receiptCache.keys().next().value;
        if (first) receiptCache.delete(first);
    }
    return pending;
};
