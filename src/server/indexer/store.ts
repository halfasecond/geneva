import type { Connection } from 'mongoose';
import { createIndexerModels, type IndexerModels } from './models';
import type { RpcBlock } from './rpc';

export interface ChainTx {
    hash: string;
    fromAddress: string;
    toAddress: string | null;
    timestamp: number;
    valueWei: string;
    blockNumber: number;
}

export class IndexerStore {
    private readonly models: IndexerModels;

    constructor(db: Connection) {
        this.models = createIndexerModels(db);
    }

    async storeBlock(block: RpcBlock): Promise<number> {
        const blockNumber = Number.parseInt(block.number, 16);
        const blockTimestamp = new Date(Number.parseInt(block.timestamp, 16) * 1000);

        if (block.transactions.length > 0) {
            await this.models.Transaction.bulkWrite(
                block.transactions.map((tx) => ({
                    updateOne: {
                        filter: { hash: tx.hash },
                        update: {
                            $setOnInsert: {
                                hash: tx.hash,
                                blockNumber,
                                blockTimestamp,
                                fromAddress: tx.from.toLowerCase(),
                                toAddress: tx.to ? tx.to.toLowerCase() : null,
                                valueWei: BigInt(tx.value).toString(),
                            },
                        },
                        upsert: true,
                    },
                })),
                { ordered: false },
            );
        }

        await this.models.IndexedBlock.updateOne(
            { blockNumber },
            { $setOnInsert: { blockNumber, blockTimestamp } },
            { upsert: true },
        );

        return block.transactions.length;
    }

    async hasIndexedBlock(blockNumber: number): Promise<boolean> {
        return (await this.models.IndexedBlock.exists({ blockNumber })) !== null;
    }

    async getMaxIndexedBlock(): Promise<number | null> {
        const latest = await this.models.IndexedBlock.findOne()
            .sort({ blockNumber: -1 })
            .select('blockNumber')
            .lean();
        return latest?.blockNumber ?? null;
    }

    async getStats(): Promise<{ blocks: number; transactions: number }> {
        const [blocks, transactions] = await Promise.all([
            this.models.IndexedBlock.countDocuments(),
            this.models.Transaction.countDocuments(),
        ]);
        return { blocks, transactions };
    }

    async getTransactions(address: string, limit = 200): Promise<ChainTx[]> {
        const normalized = address.toLowerCase();
        const rows = await this.models.Transaction.find({
            $or: [{ fromAddress: normalized }, { toAddress: normalized }],
        })
            .sort({ blockTimestamp: -1 })
            .limit(limit)
            .lean();

        return rows.map((row) => ({
            hash: row.hash,
            fromAddress: row.fromAddress,
            toAddress: row.toAddress,
            timestamp: Math.floor(new Date(row.blockTimestamp).getTime() / 1000),
            valueWei: row.valueWei,
            blockNumber: row.blockNumber,
        }));
    }
}
