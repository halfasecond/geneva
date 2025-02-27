import { Schema, Connection, Model } from 'mongoose';
import { ScareCityGameDocument, ScareCityAnswers } from './types';

const AnswersSchema = new Schema<ScareCityAnswers>({
    answer: String,
    discounted: [String],
    discounters: [String],
    foundBy: { type: String, default: null },
    foundAtBlock: { type: Number, default: null }
});

const schema = new Schema<ScareCityGameDocument>({
    gameStart: { type: Number, required: true },
    gameLength: { type: Number, required: true },
    ghosts: [String],
    totalPaidOut: { type: Number, required: true },
    background: AnswersSchema,
    bodyAccessory: AnswersSchema,
    bodyColor: AnswersSchema,
    headAccessory: AnswersSchema,
    hoofColor: AnswersSchema,
    mane: AnswersSchema,
    maneColor: AnswersSchema,
    pattern: AnswersSchema,
    patternColor: AnswersSchema,
    tail: AnswersSchema,
    utility: AnswersSchema,
}, {
    timestamps: true
});

schema.index({ gameStart: 1 }, { unique: true });

export default (prefix: string, db: Connection): Model<ScareCityGameDocument> => {
    const modelName = `${prefix}_scarecitygames`;
    return db.model<ScareCityGameDocument>(modelName, schema);
};
