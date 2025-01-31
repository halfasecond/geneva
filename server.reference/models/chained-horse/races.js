const mongoose = require('mongoose');

const RiderSchema = new mongoose.Schema({
    tokenId: Number,
    owner: String,
    time: Number,
  });

const RaceSchema = new mongoose.Schema({
  race: String,
  tokenId: Number,
  winner: String,
  time: Number,
  riders: [RiderSchema],
  block: Number,
  timestamp: Date,
  newRecordTime: {
    type: Boolean,
    default: false,
  },
});

RaceSchema.index({ winner: 1, block: 1 });

const Race = mongoose.model('ch_race', RaceSchema);
module.exports = Race;