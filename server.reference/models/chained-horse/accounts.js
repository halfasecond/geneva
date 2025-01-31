const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true
  },
  token: {
    type: String,
  },
  avatar: {
    type: Number, default: -1
  },
  level: {
    type: Number, default: 0,
  },
  left: {
    type: Number, default: 120,
  },
  top: {
    type: Number, default: 140,
  },
  transform: {
    type: Boolean, default: false,
  },
  hay: {
    type: Number, default: 0
  },
  newbIslandRace: {
    type: Boolean, default: false,
  }
});

AccountSchema.set('timestamps', true);
AccountSchema.index({ "address": 1 }, { "unique": true });
const Account = mongoose.model('ch_account', AccountSchema);

module.exports = Account;