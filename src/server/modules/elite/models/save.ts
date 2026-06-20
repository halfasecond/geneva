import { Schema, Connection, Model } from 'mongoose';

interface SaveDoc {
    walletAddress: string;
    tokenId: number;
    player: Record<string, unknown>;
    version: number;
    economySchemaVersion?: number;
    lastSeen: Date;
}

const playerSchema = new Schema({
    systemId: String,
    flightMode: String,
    dockedAtStationId: { type: String, default: null },
    dockBayIndex: { type: Number, default: null },
    navReference2d: { x: Number, y: Number },
    systemPos2d: { x: Number, y: Number },
    pos: { x: Number, y: Number, z: Number },
    vel: { x: Number, y: Number, z: Number },
    heading: { x: Number, y: Number, z: Number },
    up: { x: Number, y: Number, z: Number },
    roll: Number,
    speed: Number,
    fuel: Number,
    credits: Number,
    cargo: { type: Map, of: Number },
    cargoCapacity: Number,
}, { _id: false });

const schema = new Schema<SaveDoc>({
    walletAddress: { type: String, required: true, index: true },
    tokenId: { type: Number, required: true, index: true },
    player: { type: playerSchema, required: true },
    version: { type: Number, default: 1 },
    economySchemaVersion: { type: Number, default: 1 },
    lastSeen: { type: Date, default: Date.now },
}, {
    timestamps: true,
});

schema.index({ walletAddress: 1, tokenId: 1 }, { unique: true });

export default (prefix: string, db: Connection): Model<SaveDoc> => {
    return db.model<SaveDoc>(`${prefix}_Save`, schema);
};