import { Schema, Connection, Model } from 'mongoose';

interface Event {
    blockNumber: number;
    transactionHash: string;
    logIndex: number;
    transactionIndex: number;
    blockHash: string;
    address: string;
    id: string;
    signature: string;
    data: string;
    topics: string[];
    event: string;
    tokenId?: number;
    from?: string;
    to?: string;
    owner?: string;
    approved?: string;
    multtamp?: number;
}

const schema = new Schema<Event>({
    blockNumber: { type: Number, required: true },
    transactionHash: { type: String, required: true },
    logIndex: { type: Number, required: true },
    transactionIndex: { type: Number, required: true },
    blockHash: { type: String, required: true },
    address: { type: String, required: true },
    id: String,
    signature: String,
    data: String,
    topics: [String],
    event: String,
    tokenId: Number,
    from: String,
    to: String,
    owner: String,
    approved: String,
    multtamp: Number
}, {
    timestamps: true,
    strict: false // Allow additional fields from processEvent
});

// Create compound index for efficient querying
schema.index({ blockNumber: 1, transactionHash: 1, event: 1 });

export default (prefix: string, db: Connection): Model<Event> => {
    const modelName = `${prefix}_events`;
    return db.model<Event>(modelName, schema);
};
