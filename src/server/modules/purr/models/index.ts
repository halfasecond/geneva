import { Connection, Schema } from 'mongoose';

export default (prefix: string, db: Connection) => {
    const Account = db.model(
        `${prefix}_account`,
        new Schema ({
            address: {
                type: String,
                required: true,
                unique: true
            },
            token: {
                type: String
            },
            timestamp: { type: Date, default: Date.now }
        })
    )
    
    const Event = db.model(
        `${prefix}_event`,
        new Schema({
            contract: String,
            event: String,
            transactionHash: String,
            blockNumber: Number,
            from: String,
            to: String,
            amount: String,
            timestamp: { type: Date, default: Date.now }
        })
    );

    const Balance = db.model(
        `${prefix}_balance`,
        new Schema({
            address: { type: String, unique: true, index: true },
            balance: String,
            lastUpdated: { type: Date, default: Date.now }
        })
    );

    const Claim = db.model(
        `${prefix}_claim`,
        new Schema({
            tokenId: { type: Number, index: true, unique: true },
            address: { type: String, index: true },
            amount: String,
            transactionHash: String,
            timestamp: { type: Date, default: Date.now }
        })
    );

    return { Account, Event, Balance, Claim };
};
