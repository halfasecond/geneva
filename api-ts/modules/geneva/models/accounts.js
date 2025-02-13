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
  })
  
  Schema.set('timestamps', true)
  const modelName = prefix ? `${prefix}_account` : 'account'
  return mongoose.model(modelName, Schema)
}

export default createModel