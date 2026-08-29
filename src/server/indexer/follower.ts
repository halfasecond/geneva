import WebSocket from 'ws';
import EventEmitter from 'events';
import { fetchBlock, getLatestBlockNumber, hexToNumber } from './rpc';
import type { IndexerStore } from './store';
import type { ContractRegistry } from './registry';

interface BlockHeader {
    hash: string;
    number: string;
    timestamp?: string;
}

interface SubscriptionMessage {
    id?: number;
    method?: string;
    params?: {
        subscription?: string;
        result?: BlockHeader | string;
    };
}

export interface BlockFollowerOptions {
    httpUrl: string;
    wssUrl: string | null;
    web3: any;
    store: IndexerStore;
    registry: ContractRegistry;
    emitter: EventEmitter;
}

export class BlockFollower {
    private ws: WebSocket | null = null;
    private reconnectDelayMs = 1000;
    private closed = false;
    private processing = false;
    private readonly queue: Array<string | number> = [];
    private lastIndexed = 0;
    private pollTimer: NodeJS.Timeout | null = null;

    constructor(private readonly options: BlockFollowerOptions) {}

    async start(): Promise<void> {
        const liveCap = Math.max(1, Number(process.env.INDEXER_LIVE_CATCHUP ?? 8));
        try {
            const latest = await getLatestBlockNumber(this.options.httpUrl);
            const maxIndexed = await this.options.store.getMaxIndexedBlock();
            const floor = Math.max(1, latest - liveCap);
            const catchupFrom = maxIndexed !== null ? Math.max(maxIndexed, floor) : floor;

            if (catchupFrom <= latest) {
                console.log(`[indexer] catch-up ${catchupFrom} → ${latest}`);
                for (let blockNumber = catchupFrom; blockNumber <= latest; blockNumber += 1) {
                    try {
                        await this.processBlock(blockNumber);
                    } catch (error) {
                        const msg = error instanceof Error ? error.message : String(error);
                        console.error(`[indexer] catch-up stopped at ${blockNumber}: ${msg} — going live`);
                        break;
                    }
                }
            }
            this.lastIndexed = Math.max(this.lastIndexed, latest);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`[indexer] catch-up skipped: ${msg}`);
        }

        if (this.options.wssUrl) {
            console.log('[indexer] live via wss newHeads (1 connection)');
            this.connect();
        } else {
            console.log('[indexer] live via http polling');
            this.poll();
        }
    }

    stop(): void {
        this.closed = true;
        if (this.pollTimer) clearTimeout(this.pollTimer);
        if (this.ws) {
            this.ws.removeAllListeners();
            this.ws.close();
            this.ws = null;
        }
    }

    private connect(): void {
        if (this.closed || !this.options.wssUrl) return;
        this.ws = new WebSocket(this.options.wssUrl);

        this.ws.on('open', () => {
            console.log('[indexer] websocket connected');
            this.reconnectDelayMs = 1000;
            this.ws?.send(
                JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'eth_subscribe',
                    params: ['newHeads'],
                }),
            );
        });

        this.ws.on('message', (raw) => {
            void this.handleMessage(raw.toString());
        });

        this.ws.on('close', () => {
            if (this.closed) return;
            console.warn(`[indexer] websocket closed — reconnecting in ${this.reconnectDelayMs}ms`);
            setTimeout(() => this.connect(), this.reconnectDelayMs);
            this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, 30_000);
        });

        this.ws.on('error', (error) => {
            console.error('[indexer] websocket error', error.message);
        });
    }

    private async handleMessage(raw: string): Promise<void> {
        const message = JSON.parse(raw) as SubscriptionMessage;
        if (message.id === 1 && message.params?.subscription) {
            console.log('[indexer] subscribed to newHeads');
            return;
        }
        if (message.method !== 'eth_subscription' || !message.params?.result) {
            return;
        }
        const header = message.params.result;
        const blockRef = typeof header === 'string' ? header : header.number;
        this.enqueue(blockRef);
    }

    private poll(): void {
        const tick = async () => {
            try {
                const latest = await getLatestBlockNumber(this.options.httpUrl);
                for (let n = this.lastIndexed + 1; n <= latest; n += 1) {
                    this.enqueue(n);
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                console.error(`[indexer] poll error: ${msg}`);
            }
            if (!this.closed) {
                this.pollTimer = setTimeout(tick, 12_000);
            }
        };
        void tick();
    }

    private enqueue(blockRef: string | number): void {
        this.queue.push(blockRef);
        void this.drain();
    }

    private async drain(): Promise<void> {
        if (this.processing) return;
        this.processing = true;
        while (this.queue.length > 0 && !this.closed) {
            const blockRef = this.queue.shift()!;
            try {
                await this.processBlock(blockRef);
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                console.error(`[indexer] failed to index block ${blockRef}: ${msg}`);
            }
        }
        this.processing = false;
    }

    private async processBlock(blockRef: string | number): Promise<void> {
        const block = await fetchBlock(this.options.httpUrl, blockRef);
        const blockNumber = hexToNumber(block.number);
        const timestamp = hexToNumber(block.timestamp);

        const txCount = await this.options.store.storeBlock(block);
        await this.dispatchLogs(blockNumber);

        this.lastIndexed = Math.max(this.lastIndexed, blockNumber);
        this.options.emitter.emit('newEthBlock', { number: blockNumber, timestamp });
        console.log(`[indexer] block ${blockNumber} (${txCount} txs)`);
    }

    private async dispatchLogs(blockNumber: number): Promise<void> {
        const { web3, registry } = this.options;
        const pending: Array<{ name: string; handle: (event: any) => Promise<void>; event: any }> = [];

        for (const watcher of registry.list()) {
            const contract = new web3.eth.Contract(watcher.abi, watcher.address);
            let events: any[] = [];
            try {
                events = await contract.getPastEvents('allEvents', {
                    fromBlock: blockNumber,
                    toBlock: blockNumber,
                });
            } catch {
                try {
                    for (const eventName of watcher.events) {
                        const named = await contract.getPastEvents(eventName, {
                            fromBlock: blockNumber,
                            toBlock: blockNumber,
                        });
                        events.push(...named);
                    }
                } catch (error) {
                    console.error(`[indexer] ${watcher.name} logs failed at ${blockNumber}:`, error);
                    continue;
                }
            }
            for (const event of events) {
                const eventName = event.event as string;
                if (!watcher.events.includes(eventName)) continue;
                pending.push({
                    name: watcher.name,
                    handle: watcher.handle,
                    event: { ...event, event: eventName },
                });
            }
        }

        pending.sort((a, b) => {
            const block = Number(a.event.blockNumber) - Number(b.event.blockNumber);
            if (block !== 0) return block;
            const aHash = String(a.event.transactionHash || '');
            const bHash = String(b.event.transactionHash || '');
            if (aHash && aHash === bHash) {
                const aTransfer = a.event.event === 'Transfer' ? 1 : 0;
                const bTransfer = b.event.event === 'Transfer' ? 1 : 0;
                if (aTransfer !== bTransfer) return aTransfer - bTransfer;
            }
            return Number(a.event.logIndex) - Number(b.event.logIndex);
        });

        for (const item of pending) {
            try {
                await item.handle(item.event);
            } catch (error) {
                console.error(`[indexer] ${item.name} handler failed:`, error);
            }
        }
    }
}
