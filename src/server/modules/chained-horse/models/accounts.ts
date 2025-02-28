import { Schema, Connection, Model } from 'mongoose';

interface Account {
    address: string;
    token?: string;
    avatar?: number;
}

const schema = new Schema<Account>({
    address: {
        type: String,
        required: true,
        unique: true
    },
    token: {
        type: String
    },
    avatar: {
        type: Number
    }
}, {
    timestamps: true
});

export default (prefix: string, db: Connection): Model<Account> => {
    const modelName = `${prefix}_accounts`;
    return db.model<Account>(modelName, schema);
};
