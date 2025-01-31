const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  tokenId: Number,
  event: String,
  blockNumber: Number,
  timestamp: Number,
  logIndex: Number,
  transactionIndex: Number,
  transactionHash: String,
  blockHash: String,
  address: String,
  id: String,

  // These won't be in all events:
  from: String,
  to: String,
  owner: String,
  operator: String,
  approved: String,
  //
  
  signature: String,
  data: String,
  topics: [String]
});

EventSchema.index({ "blockNumber": 1, logIndex: 1 }, { "unique": true });

const Event = mongoose.model('ch_event', EventSchema);
module.exports = Event;
