const mongoose = require('mongoose');

const BirthSchema = new mongoose.Schema({
  tokenId: Number,
  timestamp: Number,
  blockNumber: Number,
  logIndex: Number,
  transactionIndex: Number,
  transactionHash: String,
  blockHash: String,
  address: String,
  id: String,
  owner: String,
  owners: [String],
  signature: String,
  data: String,
  topics: [String],

  // Horse specific:
  svg: String,
  background: String,
  tail: String,
  mane: String,
  pattern: String,
  headAccessory: String,
  bodyAccessory: String,
  utility: String,
  maneColor: String,
  patternColor: String,
  hoofColor: String,
  bodyColor: String,
});

BirthSchema.index({ tokenId: 1 }, { "unique": true });

const Birth = mongoose.model('ch_birth', BirthSchema);
module.exports = Birth;
