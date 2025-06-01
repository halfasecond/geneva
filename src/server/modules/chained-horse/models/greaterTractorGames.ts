import { Schema, Connection, Model, Document } from 'mongoose';

// Define the interface for the document
export interface GreaterTractorGameDocument extends Document {
    gameStart: number;      // Starting block number
    gameLength: number;     // Game duration in blocks
    votes: {
        left: number;
        right: number;
    };
    winner: 'left' | 'right';
    winners: string[];      // Addresses of players who voted for the winning tractor
    totalPayout: number;    // Total HAY paid out
}

// Create the schema
const schema = new Schema<GreaterTractorGameDocument>({
    gameStart: { type: Number, required: true },
    gameLength: { type: Number, required: true },
    votes: {
        left: { type: Number, required: true },
        right: { type: Number, required: true }
    },
    winner: { type: String, enum: ['left', 'right'], required: true },
    winners: [String],
    totalPayout: { type: Number, required: true }
}, {
    timestamps: true
});

// Add an index on gameStart for faster queries
schema.index({ gameStart: -1 });

// Export the model factory function
export default (prefix: string, db: Connection): Model<GreaterTractorGameDocument> => {
    const modelName = `${prefix}_greater_tractor_games`;
    return db.model<GreaterTractorGameDocument>(modelName, schema);
};