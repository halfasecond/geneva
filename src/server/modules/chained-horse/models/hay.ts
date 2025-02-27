import { Schema, Connection, Model } from 'mongoose';

interface Hay {
    blockNumber: number,
    address: string;
    tokenId?: number;
    activity: string;
    amount: number;
}

const schema = new Schema<Hay>({
    blockNumber: Number,
    address: {
        type: String,
        required: true,
    },
    tokenId: Number,
    activity: String,
    amount: Number,
}, {
    timestamps: true
});

export default (prefix: string, db: Connection): Model<Hay> => {
    const modelName = `${prefix}_hay`;
    return db.model<Hay>(modelName, schema);
};
