import { Schema, Connection, Model } from 'mongoose';

interface PlayerState {
    walletAddress: string;
    /** ERC-721 token id of the player's current ship */
    tokenId: number;
    /** Procedural hull id cached from indexed metadata */
    shipId?: number;
    lastSeen: Date;
}

const schema = new Schema<PlayerState>({
    walletAddress: { type: String, required: true, unique: true, index: true },
    tokenId: { type: Number, required: true },
    shipId: Number,
    lastSeen: { type: Date, default: Date.now },
}, {
    timestamps: true,
});

export default (prefix: string, db: Connection): Model<PlayerState> => {
    const modelName = `${prefix}_PlayerState`;
    return db.model<PlayerState>(modelName, schema);
};