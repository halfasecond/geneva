const mongoose = require('mongoose');

const OwnerSchema = new mongoose.Schema({
  owner: String,
  balance: Number,
});

OwnerSchema.index({ owner: 1 }, { "unique": true });

const Owner = mongoose.model('ch_owner', OwnerSchema);
module.exports = Owner;