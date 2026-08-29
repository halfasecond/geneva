import { Schema, Connection, Model } from 'mongoose';

export interface IndexedBlockDoc {
    blockNumber: number;
    blockTimestamp: Date;
    indexedAt: Date;
}

export interface IndexedTransactionDoc {
    hash: string;
    blockNumber: number;
    blockTimestamp: Date;
    fromAddress: string;
    toAddress: string | null;
    valueWei: string;
    indexedAt: Date;
}

const indexedBlockSchema = new Schema<IndexedBlockDoc>(
    {
        blockNumber: { type: Number, required: true, unique: true },
        blockTimestamp: { type: Date, required: true },
        indexedAt: { type: Date, required: true, default: Date.now },
    },
    { collection: 'indexed_blocks' },
);

const transactionSchema = new Schema<IndexedTransactionDoc>(
    {
        hash: { type: String, required: true, unique: true },
        blockNumber: { type: Number, required: true, index: true },
        blockTimestamp: { type: Date, required: true },
        fromAddress: { type: String, required: true, lowercase: true, index: true },
        toAddress: { type: String, default: null, lowercase: true, index: true },
        valueWei: { type: String, required: true },
        indexedAt: { type: Date, required: true, default: Date.now },
    },
    { collection: 'indexed_transactions' },
);

transactionSchema.index({ blockTimestamp: -1 });

export interface IndexerModels {
    IndexedBlock: Model<IndexedBlockDoc>;
    Transaction: Model<IndexedTransactionDoc>;
}

export function createIndexerModels(db: Connection): IndexerModels {
    const IndexedBlock =
        (db.models.IndexedBlock as Model<IndexedBlockDoc>) ||
        db.model<IndexedBlockDoc>('IndexedBlock', indexedBlockSchema);
    const Transaction =
        (db.models.IndexedTransaction as Model<IndexedTransactionDoc>) ||
        db.model<IndexedTransactionDoc>('IndexedTransaction', transactionSchema);
    return { IndexedBlock, Transaction };
}
