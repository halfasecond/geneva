import { Connection, Model, Schema } from 'mongoose';

const accountSchema = new Schema({}, { strict: false, strictQuery: false, timestamps: true });
accountSchema.index({ address: 1 }, { unique: true, sparse: true });

const messageSchema = new Schema(
    { account: String, message: String },
    { strict: false, strictQuery: false, timestamps: true },
);

export interface KittyFamilyModels {
    Account: Model<any>;
    Message: Model<any>;
}

const existing = <T>(db: Connection, name: string, schema: Schema): Model<T> =>
    (db.models[name] as Model<T>) || db.model<T>(name, schema, name);

export default (db: Connection): KittyFamilyModels => ({
    Account: existing(db, 'kf_accounts', accountSchema),
    Message: existing(db, 'kf_messages', messageSchema),
});
