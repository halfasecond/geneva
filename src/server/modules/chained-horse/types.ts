import { Model } from 'mongoose';

export interface Horse {
    tokenId: number;
    utility?: string;
}

export interface Race {
    race: string;
    tokenId: number;
    winner: boolean;
    owner: string;
    time: number;
    riders: any[];
}

export interface BlockData {
    number: string;
    timestamp: string;
}

export interface Models {
    Event: Model<any>;
    NFT: Model<Horse>;
    Owner: Model<any>;
    Account: Model<any>;
    Message: Model<any>;
    Race: Model<Race>;
    ScareCityGame: Model<any>;
    GameState: Model<any>;
    [key: string]: Model<any>;
}