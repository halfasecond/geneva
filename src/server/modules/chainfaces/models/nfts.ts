import { Schema, Connection, Model } from 'mongoose';

interface NFT {
    tokenId: number;
    owner: string;
    owners: string[];
    // chainface specific:
    face: String, 
    backgroundColor: Number,
    faceSymmetry: Number,
    golfScore: Number,
    percentBear: Number,
    textColor: Number
}

const schema = new Schema<NFT>({
    tokenId: { type: Number, required: true, unique: true },
    owner: { type: String, required: true },
    owners: [{ type: String }],
    // chainface specific:
    face: String, 
    backgroundColor: Number,
    faceSymmetry: Number,
    golfScore: Number,
    percentBear: Number,
    textColor: Number
}, {
    timestamps: true,
    strict: false // Allow additional fields from processEvent
});

export default (prefix: string, db: Connection): Model<NFT> => {
    const modelName = `${prefix}_nfts`;
    return db.model<NFT>(modelName, schema);
};
