import { Schema, Connection, Model } from 'mongoose';

interface Rider {
    tokenId: number;
    owner?: string;
    time: number;
}

interface Race {
    race: string;
    tokenId: number;
    winner?: string;
    time: number;
    riders: Rider[];
    timestamp: Date;
}

const RiderSchema = new Schema<Rider>({
    tokenId: { type: Number, required: true },
    owner: { type: String },
    time: { type: Number, required: true }
});

const schema = new Schema<Race>({
    race: { type: String, required: true },
    tokenId: { type: Number, required: true },
    winner: { type: String, default: undefined },
    time: { type: Number, required: true },
    riders: [RiderSchema],
    timestamp: { type: Date, required: true, default: Date.now },
}, {
    timestamps: true
});

export default (prefix: string, db: Connection): Model<Race> => {
    const modelName = `${prefix}_race`;
    return db.model<Race>(modelName, schema);
};