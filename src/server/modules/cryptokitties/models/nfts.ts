import { Schema, Connection, Model } from 'mongoose';

const schema = new Schema(
    {
        tokenId: Number,
        timestamp: Number,
        blockNumber: Number,
        logIndex: Number,
        owner: String,
        owners: [String],
        hatchedBy: String,
        gen: Number,
        matronId: Number,
        sireId: Number,
        genes: String,
        cooldownIndex: { type: Number, default: 0 },
        pregnant: { type: Boolean, default: false },
        offspring: { type: Number, default: 0 },
        offspringIds: [Number],
        partners: { type: Number, default: 0 },
        partnerIds: [Number],
        cooldownEndBlock: { type: Number, default: 0 },
        sale: { type: Boolean, default: false },
        sire: { type: Boolean, default: false },
        startingPrice: String,
        endingPrice: String,
        currentPrice: String,
        duration: Number,
        auctionStart: Number,
        auctionEnd: Number,
        hats: [{
            blockNumber: Number,
            timestamp: Number,
            itemName: String,
            transactionHash: String,
        }],
        lastHatBlockNumber: Number,
    },
    { strict: false }
);

schema.index({ tokenId: 1 }, { unique: true });

export default (prefix: string, db: Connection): Model<Record<string, unknown>> => {
    const modelName = prefix ? `${prefix}_nft` : 'nft';
    return db.model<Record<string, unknown>>(modelName, schema);
};