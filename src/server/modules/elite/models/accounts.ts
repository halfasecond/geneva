import { Schema, Connection, Model } from 'mongoose';

interface Account {
    address: string;
    token?: string;
    /** Wallet-wide credit balance — shared across all owned hulls. */
    credits?: number;
}

const schema = new Schema<Account>({
    address: { type: String, required: true, unique: true },
    token: String,
    credits: Number,
}, {
    timestamps: true,
});

export default (prefix: string, db: Connection): Model<Account> => {
    const modelName = `${prefix}_account`;
    return db.model<Account>(modelName, schema);
};