import mongoose from 'mongoose'

const createModel = (prefix) => {
    const Schema = new mongoose.Schema({
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
    })

    Schema.index({ "blockNumber": 1, logIndex: 1 }, { "unique": true })
    const modelName = prefix ? `${prefix}_event` : 'event'
    return mongoose.model(modelName, Schema)
}

export default createModel
