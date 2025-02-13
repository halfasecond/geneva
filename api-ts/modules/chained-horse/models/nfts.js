import mongoose from 'mongoose'

const createModel = (prefix) => {
    const Schema = new mongoose.Schema({
        tokenId: Number,
        timestamp: Number,
        blockNumber: Number,
        logIndex: Number,
        transactionIndex: Number,
        transactionHash: String,
        blockHash: String,
        address: String,
        id: String,
        owner: String,
        owners: [String],
        signature: String,
        data: String,
        topics: [String],
        // Horse specific:
        svg: String,
        background: String,
        tail: String,
        mane: String,
        pattern: String,
        headAccessory: String,
        bodyAccessory: String,
        utility: String,
        maneColor: String,
        patternColor: String,
        hoofColor: String,
        bodyColor: String,
    })

    Schema.index({ tokenId: 1 }, { "unique": true })
    const modelName = prefix ? `${prefix}_nft` : 'nft'
    return mongoose.model(modelName, Schema)
}

export default createModel
