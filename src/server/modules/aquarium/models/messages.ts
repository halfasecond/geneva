import { Schema, Connection, Model } from 'mongoose';

interface Message {
    account: string;
    message: string;
}

const schema = new Schema<Message>({
    account: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

export default (prefix: string, db: Connection): Model<Message> => {
    const modelName = `${prefix}_messages`;
    return db.model<Message>(modelName, schema);
};
