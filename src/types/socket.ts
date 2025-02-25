import { Position } from './actor';
import { TraitType } from '../server/modules/chained-horse/socket/state/scarecity';

export interface SocketData {
    auth?: {
        token: string;
    };
}

export interface BlockData {
    number: string;
    timestamp: string;
}

export interface MoveData {
    position: Position;
    account: string;
}

export interface ScanData {
    account: string;
    scanType: TraitType;
    scanResult: string;
}

export interface NotificationData {
    account: string;
    type: string;
    message: string;
    alertAll?: boolean;
}