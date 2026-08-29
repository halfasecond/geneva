import type { ChainTx, IndexerStore } from './store';
import { getBalanceEth, getLatestBlockNumber } from './rpc';

const TX_FETCH_LIMIT = 200;
const DEFAULT_INDEX_BLOCKS = 32;

export interface ScreeningResult {
    address: string;
    balanceEth: number;
    recentTxCount: number;
    uniqueCounterparties: number;
    recentOutboundRecipients: string;
    daysSinceLastActivity: number | null;
    indexFromBlock: number;
    dataSource: string;
}

export const CSV_HEADERS = [
    'address',
    'balance_eth',
    'recent_tx_count',
    'unique_counterparties',
    'recent_outbound_recipients',
    'days_since_last_activity',
    'index_from_block',
    'data_source',
] as const;

export function resolveIndexFromBlock(latestBlock: number): number {
    const explicit = process.env.INDEX_FROM_BLOCK;
    if (explicit) {
        const block = Number(explicit);
        if (!Number.isInteger(block) || block < 1) {
            throw new Error('INDEX_FROM_BLOCK must be a positive integer');
        }
        return block;
    }
    return Math.max(1, latestBlock - DEFAULT_INDEX_BLOCKS);
}

function counterparty(tx: ChainTx, subject: string): string | null {
    if (tx.fromAddress === subject && tx.toAddress) return tx.toAddress;
    if (tx.toAddress === subject) return tx.fromAddress;
    return null;
}

export async function screenAddress(
    address: string,
    httpUrl: string,
    store: IndexerStore,
): Promise<ScreeningResult> {
    const normalized = address.toLowerCase();
    const now = Math.floor(Date.now() / 1000);
    const latest = await getLatestBlockNumber(httpUrl);
    const indexFromBlock = resolveIndexFromBlock(latest);

    const [balanceEth, txs] = await Promise.all([
        getBalanceEth(httpUrl, normalized),
        store.getTransactions(normalized, TX_FETCH_LIMIT),
    ]);

    const recent = txs.filter((tx) => tx.blockNumber >= indexFromBlock);
    const counterparties = new Set<string>();
    for (const tx of recent) {
        const cp = counterparty(tx, normalized);
        if (cp) counterparties.add(cp);
    }

    const outboundCounts = new Map<string, number>();
    for (const tx of recent) {
        if (tx.fromAddress === normalized && tx.toAddress) {
            outboundCounts.set(tx.toAddress, (outboundCounts.get(tx.toAddress) ?? 0) + 1);
        }
    }

    const topRecipients = [...outboundCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([addr]) => addr)
        .join(', ');

    const lastTs = txs.length ? Math.max(...txs.map((tx) => tx.timestamp)) : null;

    return {
        address: normalized,
        balanceEth,
        recentTxCount: recent.length,
        uniqueCounterparties: counterparties.size,
        recentOutboundRecipients: topRecipients,
        daysSinceLastActivity: lastTs === null ? null : Math.floor((now - lastTs) / 86_400),
        indexFromBlock,
        dataSource: 'local-index',
    };
}

export function screeningResultToCsv(result: ScreeningResult): string {
    const row: Record<string, string | number> = {
        address: result.address,
        balance_eth: result.balanceEth.toFixed(6),
        recent_tx_count: result.recentTxCount,
        unique_counterparties: result.uniqueCounterparties,
        recent_outbound_recipients: result.recentOutboundRecipients,
        days_since_last_activity: result.daysSinceLastActivity ?? '',
        index_from_block: result.indexFromBlock,
        data_source: result.dataSource,
    };
    const escape = (value: string) =>
        value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
    return `${CSV_HEADERS.join(',')}\n${CSV_HEADERS.map((h) => escape(String(row[h]))).join(',')}\n`;
}
