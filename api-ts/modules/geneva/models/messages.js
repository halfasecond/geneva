const mongoose = require('mongoose')

const MessageSchema = mongoose.Schema({
    account: String,
    message: String
})

MessageSchema.set('timestamps', true);

module.exports = mongoose.model('message',MessageSchema)