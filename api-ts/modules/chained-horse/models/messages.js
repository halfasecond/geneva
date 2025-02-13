import mongoose from 'mongoose'

const createModel = (prefix) => {
    const Schema = new mongoose.Schema({
        account: String,
        message: String
    })

    Schema.set('timestamps', true)
    const modelName = prefix ? `${prefix}_message` : 'message'
    return mongoose.model(modelName, Schema)
}

export default createModel
