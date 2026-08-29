import { Connection, Model, Schema } from 'mongoose';

const accountSchema = new Schema(
    { address: { type: String, required: true, unique: true }, token: String },
    { strict: false, strictQuery: false, timestamps: true },
);

export interface KittyInternationalModels {
    Account: Model<any>;
}

const existing = <T>(db: Connection, name: string, schema: Schema): Model<T> =>
    (db.models[name] as Model<T>) || db.model<T>(name, schema, name);

export default (db: Connection): KittyInternationalModels => ({
    Account: existing(db, 'ki_accounts', accountSchema),
});
