import mongoose from 'mongoose'


const createModel = (prefix) => {
    const Schema = new mongoose.Schema({
        owner: String,
        balance: Number,
    })

    Schema.index({ owner: 1 }, { "unique": true })
    const modelName = prefix ? `${prefix}_owner` : 'owner'
    return mongoose.model(modelName, Schema)
}

export default createModel