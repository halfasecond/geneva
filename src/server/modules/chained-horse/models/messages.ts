import { Schema, Connection, Model } from 'mongoose';

interface Message {
    from: string;
    to: string;
    message: string;
    timestamp?: Date;
}

const schema = new Schema<Message>({
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export default (prefix: string, db: Connection): Model<Message> => {
    const modelName = `${prefix}_messages`;
    return db.model<Message>(modelName, schema);
};
