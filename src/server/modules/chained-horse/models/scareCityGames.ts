import mongoose from 'mongoose';
import { ScareCityGameDocument, ScareCityAnswers } from './types';

const AnswersSchema = new mongoose.Schema<ScareCityAnswers>({
    answer: String,
    discounted: [String],
    discounters: [String],
    foundBy: { type: String, default: null },
    foundAtBlock: { type: Number, default: null }
});

const ScareCityGameSchema = new mongoose.Schema<ScareCityGameDocument>({
    gameStart: Number,
    gameLength: Number,
    ghosts: [String],
    totalPaidOut: Number,
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
});

ScareCityGameSchema.index({ gameStart: 1 }, { unique: true });

export const ScareCityGame = mongoose.model<ScareCityGameDocument>('ch_scarecitygame', ScareCityGameSchema);