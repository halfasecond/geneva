import { Schema, Connection, Model } from 'mongoose';
import { GreaterTractorGameDocument, GreaterTractorVotes } from './types';

const VotesSchema = new Schema<GreaterTractorVotes>({
    left: { type: Number },
    right: { type: Number }
});

const schema = new Schema<GreaterTractorGameDocument>({
    gameStart: { type: Number, required: true },
    gameLength: { type: Number, required: true },
    votes: VotesSchema,
    winner: String,
    winners: [String],
    totalPayout: { type: Number, required: true },
}, {
    timestamps: true
});

schema.index({ gameStart: 1 }, { unique: true });

export default (prefix: string, db: Connection): Model<GreaterTractorGameDocument> => {
    const modelName = `${prefix}_greatertractorgames`;
    return db.model<GreaterTractorGameDocument>(modelName, schema);
};
