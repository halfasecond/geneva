import { Schema, Connection, Model } from 'mongoose';

const schema = new Schema({
    owner: String,
    balance: { type: Number, default: 0 },
    birthed: { type: Number, default: 0 },
});

schema.index({ owner: 1 }, { unique: true });

export default (prefix: string, db: Connection): Model<Record<string, unknown>> => {
    const modelName = prefix ? `${prefix}_owner` : 'owner';
    return db.model<Record<string, unknown>>(modelName, schema);
};