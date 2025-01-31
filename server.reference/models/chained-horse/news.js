const mongoose = require('mongoose')

const NewsSchema = mongoose.Schema({
  account: String,
  headline: String,
  img: String,
  story: String
})

NewsSchema.set('timestamps', true);

module.exports = mongoose.model('ch_news',NewsSchema)
