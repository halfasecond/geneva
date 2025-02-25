const mongoose = require('mongoose');

const AnswersSchema = new mongoose.Schema({
    answer: String,
    discounted: [String],
    discounters: [String],
    foundBy: String,
    foundAtBlock: Number
  });

const ScareCityGameSchema = new mongoose.Schema({
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

ScareCityGameSchema.index({ gameStart: 1, unique: true });

const ScareCityGame = mongoose.model('ch_scarecitygame', ScareCityGameSchema);
module.exports = ScareCityGame;