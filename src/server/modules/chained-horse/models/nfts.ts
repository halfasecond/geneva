import { Schema, Connection, Model } from 'mongoose';

interface NFT {
    tokenId: number;
    owner: string;
    owners: string[];
    svg?: string;
    background?: string;
    tail?: string;
    mane?: string;
    pattern?: string;
    headAccessory?: string;
    bodyAccessory?: string;
    utility?: string;
    maneColor?: string;
    patternColor?: string;
    hoofColor?: string;
    bodyColor?: string;
}

const schema = new Schema<NFT>({
    tokenId: { type: Number, required: true, unique: true },
    owner: { type: String, required: true },
    owners: [{ type: String }],
    svg: String,
    background: String,
    tail: String,
    mane: String,
    pattern: String,
    headAccessory: String,
    bodyAccessory: String,
    utility: String,
    maneColor: String,
    patternColor: String,
    hoofColor: String,
    bodyColor: String
}, {
    timestamps: true,
    strict: false // Allow additional fields from processEvent
});

export default (prefix: string, db: Connection): Model<NFT> => {
    const modelName = `${prefix}_nfts`;
    return db.model<NFT>(modelName, schema);
};
