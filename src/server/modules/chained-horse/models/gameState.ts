import { Schema, Connection, Model } from 'mongoose';
import { Position } from '../../../types/actor';

interface GameState {
    walletAddress: string;
    tokenId: number;
    position: Position;
    connected: boolean;
    lastSeen: Date;
    race?: number;
    hay: number;
    game: {
        level: number;
        greaterTractor: 'left' | 'right' | undefined;
        stable: number;
    }
}

export default (prefix: string, db: Connection): Model<GameState> => {
    const schema = new Schema<GameState>({
        walletAddress: { type: String, required: true, index: true },
        tokenId: { type: Number, required: true },
        position: {
            x: { type: Number, required: true },
            y: { type: Number, required: true },
            direction: { type: String, enum: ['left', 'right'], required: true }
        },
        connected: { type: Boolean, default: false },
        lastSeen: { type: Date, default: Date.now },
        race: { type: Number, default: undefined },
        hay: { type: Number, default: 0 },
        game: {
            level: { type: Number, default: 0 },
            greaterTractor: { type: String, default: undefined },
            stable: { type: Number, default: 0 }
        }
    });

    return db.model<GameState>(`${prefix}_GameState`, schema);
};