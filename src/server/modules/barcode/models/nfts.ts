import { Schema, Connection, Model } from 'mongoose';

interface NFT {
    tokenId: number;
    owner: string;
    owners: string[];
   description: String;
   image: String;
   x: String;
   y: String;
}

const schema = new Schema<NFT>({
    tokenId: { type: Number, required: true, unique: true },
    owner: { type: String, required: true },
    owners: [{ type: String }],
   description: String,
   image: String,
   x: String,
   y: String,
}, {
    timestamps: true,
    strict: false
});

export default (prefix: string, db: Connection): Model<NFT> => {
    const modelName = `${prefix}_nfts`;
    return db.model<NFT>(modelName, schema);
};
