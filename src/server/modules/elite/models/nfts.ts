import { Schema, Connection, Model } from 'mongoose';

interface NFT {
    tokenId: number;
    /** Procedural hull id from metadata (differs from ERC-721 tokenId). */
    shipId?: number;
    owner: string;
    owners: string[];
    // vech specific:
    tokenURI?: string;
    name?: string;
    description?: string;
    image?: string;
    animation_url?: string;
    background_color?: string;
    attributes?: { trait_type: string; value: string }[];
}

const schema = new Schema<NFT>({
    tokenId: { type: Number, required: true, unique: true },
    shipId: { type: Number, index: true },
    owner: { type: String, required: true },
    owners: [{ type: String }],
    tokenURI: String,
    name: String,
    description: String,
    image: String,
    animation_url: String,
    background_color: String,
    attributes: [{ _id: false, trait_type: String, value: Schema.Types.Mixed }],
}, {
    timestamps: true,
    strict: false // Allow additional fields from processEvent
});

export default (prefix: string, db: Connection): Model<NFT> => {
    const modelName = `${prefix}_nfts`;
    return db.model<NFT>(modelName, schema);
};