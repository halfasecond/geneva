import { Schema, Connection, Model } from 'mongoose';

const schema = new Schema(
    {
        event: String,
        blockNumber: Number,
        timestamp: Number,
        logIndex: Number,
        transactionHash: String,
        blockHash: String,
        address: String,
        tokenId: Number,
        from: String,
        to: String,
        genes: String,
        matronId: Number,
        sireId: Number,
        cooldownEndBlock: Number,
        owner: String,
        startingPrice: String,
        endingPrice: String,
        duration: Number,
        totalPrice: String,
        winner: String,
        value: String,
    },
    { strict: false }
);

schema.index({ blockNumber: 1, logIndex: 1 }, { unique: true });
schema.index({ timestamp: 1 });
schema.index(
    { tokenId: 1 },
    { partialFilterExpression: { tokenId: { $exists: true } } }
);

export default (prefix: string, db: Connection): Model<Record<string, unknown>> => {
    const modelName = prefix ? `${prefix}_event` : 'event';
    return db.model<Record<string, unknown>>(modelName, schema);
};