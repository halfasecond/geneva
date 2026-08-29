import { Schema, Connection, Model } from 'mongoose';

const schema = new Schema({
    owner: String,
    balance: { type: Number, default: 0 },
    birthed: { type: Number, default: 0 },
}, { strict: false, strictQuery: false });

schema.index({ owner: 1 }, { unique: true });

export default (prefix: string, db: Connection, tableSuffix = ''): Model<Record<string, unknown>> => {
    const collection = `${prefix ? `${prefix}_` : ''}owners${tableSuffix}`;
    const modelName = `${prefix ? `${prefix}_` : ''}owner${tableSuffix || ''}`;
    return (db.models[modelName] as Model<Record<string, unknown>>)
        || db.model<Record<string, unknown>>(modelName, schema, collection);
};