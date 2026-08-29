import { Connection, Model, Schema } from 'mongoose';

const dailySchema = new Schema({}, { strict: false, strictQuery: false });
dailySchema.index({ timestamp: 1 }, { unique: true, sparse: true });

const ethPriceSchema = new Schema(
    { timestamp: Number, ethprice: Number },
    { strict: false, strictQuery: false },
);
ethPriceSchema.index({ timestamp: 1 }, { unique: true, sparse: true });

const cmsSchema = new Schema({}, { strict: false, strictQuery: false, timestamps: true });
cmsSchema.index({ slug: 1 }, { unique: true, sparse: true });

const accountSchema = new Schema(
    { address: { type: String, required: true, unique: true }, token: String },
    { strict: false, strictQuery: false, timestamps: true },
);

export interface KittyNewsModels {
    Daily: Model<any>;
    EthPrice: Model<any>;
    Cms: Model<any>;
    Account: Model<any>;
}

const existing = <T>(db: Connection, name: string, schema: Schema): Model<T> =>
    (db.models[name] as Model<T>) || db.model<T>(name, schema, name);

export default (db: Connection): KittyNewsModels => ({
    Daily: existing(db, 'kn_dailies', dailySchema),
    EthPrice: existing(db, 'kn_ethprices', ethPriceSchema),
    Cms: existing(db, 'kn_cms', cmsSchema),
    Account: existing(db, 'kn_accounts', accountSchema),
});
