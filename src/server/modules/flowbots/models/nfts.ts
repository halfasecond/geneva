
import { Schema, Connection, Model } from 'mongoose';

interface NFT {
    tokenId: number;
    owner: string;
    owners: string[];
}

const schema = new Schema<NFT>({
    tokenId: { type: Number, required: true, unique: true },
    blockNumber: Number,
    logIndex: Number,
    transactionIndex: Number,
    transactionHash: String,
    blockHash: String,
    owner: String,
    owners: [String],
    // bot specific:
    arms: Number,
    grill: Number,
    panel: Number,
    body: Number,
    head: Number,
    legs: Number,
    awards: [String],
    luck: Number,
    skill: Number,
    power: Number,
    isPrime: Number,
    issue: Number,
    // auction specific
    bids: [{ 
        bidder: String,
        timestamp: Number,
        amount: String,
        txHash: String,
    }],
    // sale specific
    startPrice: String,
    endPrice: String,
    currentPrice: String,
    endTime: Number,
    forSale: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    strict: false // Allow additional fields from processEvent
});

export default (prefix: string, db: Connection): Model<NFT> => {
    const modelName = `${prefix}_nfts`;
    return db.model<NFT>(modelName, schema);
};


