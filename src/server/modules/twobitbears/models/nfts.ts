import { Schema, Connection, Model } from 'mongoose';

interface NFT {
    tokenId: number;
    owner: string;
    owners: string[];
   // Bear specific:
   description: String,
   name: String,
   image: String,
   Species: String,
   Mood: String,
   Name: String,
   Family: String,
   RealisticHeadFur: String,
   RealisticBodyFur: String,
}

const schema = new Schema<NFT>({
    tokenId: { type: Number, required: true, unique: true },
    owner: { type: String, required: true },
    owners: [{ type: String }],
   // Bear specific:
   description: String,
   name: String,
   image: String,
   Species: String,
   Mood: String,
   Name: String,
   Family: String,
   RealisticHeadFur: String,
   RealisticBodyFur: String,
}, {
    timestamps: true,
    strict: false // Allow additional fields from processEvent
});

export default (prefix: string, db: Connection): Model<NFT> => {
    const modelName = `${prefix}_nfts`;
    return db.model<NFT>(modelName, schema);
};
