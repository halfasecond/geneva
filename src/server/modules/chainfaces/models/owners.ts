import { Schema, Connection, Model } from 'mongoose';

interface Owner {
    address: string;
    balance: number;
    tokens: number[];
}

const schema = new Schema<Owner>({
    address: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    tokens: [{ type: Number }]
}, {
    timestamps: true,
    strict: false // Allow additional fields
});

export default (prefix: string, db: Connection): Model<Owner> => {
    const modelName = `${prefix}_owners`;
    return db.model<Owner>(modelName, schema);
};
