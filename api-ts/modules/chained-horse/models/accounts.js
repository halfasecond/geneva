import mongoose from 'mongoose'

const createModel = (prefix) => {
  const Schema = new mongoose.Schema({
    address: {
      type: String,
      required: true,
      unique: true
    },
    token: {
      type: String,
    },
    avatar: {
      type: Number,
      default: -1,
    }
  })
  
  Schema.set('timestamps', true)
  const modelName = prefix ? `${prefix}_account` : 'account'
  return mongoose.model(modelName, Schema)
}

export default createModel