import { Document } from 'mongoose';

export interface Horse extends Document {
    tokenId: number;
    blockNumber: number;
    background: string;
    bodyAccessory: string;
    bodyColor: string;
    headAccessory: string;
    hoofColor: string;
    mane: string;
    maneColor: string;
    pattern: string;
    patternColor: string;
    tail: string;
    utility: string;
}

export interface ScareCityAnswers {
    answer: string;
    discounted: string[];
    discounters: string[];
    foundBy: string | null;
    foundAtBlock: number | null;
}

export interface ScareCityGameDocument extends Document {
    gameStart: number;
    gameLength: number;
    ghosts: string[];
    totalPaidOut: number;
    background: ScareCityAnswers;
    bodyAccessory: ScareCityAnswers;
    bodyColor: ScareCityAnswers;
    headAccessory: ScareCityAnswers;
    hoofColor: ScareCityAnswers;
    mane: ScareCityAnswers;
    maneColor: ScareCityAnswers;
    pattern: ScareCityAnswers;
    patternColor: ScareCityAnswers;
    tail: ScareCityAnswers;
    utility: ScareCityAnswers;
}