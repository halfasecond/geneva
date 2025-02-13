import { Schema, Connection, Model } from 'mongoose';

interface Account {
    address: string;
    token?: string;
}

const schema = new Schema<Account>({
    address: {
        type: String,
        required: true,
        unique: true
    },
    token: {
        type: String
    }
}, {
    timestamps: true
});

export default (prefix: string, db: Connection): Model<Account> => {
    const modelName = `${prefix}_account`;
    return db.model<Account>(modelName, schema);
};
