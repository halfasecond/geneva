import { EventEmitter } from 'events';
import { Horse, ScareCityAnswers } from '../../models/types';

export type TraitType = 
    | 'background'
    | 'bodyAccessory'
    | 'bodyColor'
    | 'headAccessory'
    | 'hoofColor'
    | 'mane'
    | 'maneColor'
    | 'pattern'
    | 'patternColor'
    | 'tail'
    | 'utility';

const TRAIT_TYPES: TraitType[] = [
    'background',
    'bodyAccessory',
    'bodyColor',
    'headAccessory',
    'hoofColor',
    'mane',
    'maneColor',
    'pattern',
    'patternColor',
    'tail',
    'utility'
];

interface GameState {
    gameStart: number;
    gameLength: number;
    ghosts: string[];
    totalPaidOut: number;
    traits: Record<TraitType, ScareCityAnswers>;
}

interface TraitAttribute {
    name: TraitType;
    value: string;
    amount: number;
    percentage: number;
}

export class ScareCityState extends EventEmitter {
    private state: GameState | null = null;
    private attributes: TraitAttribute[] = [];

    constructor() {
        super();
        this.initializeState();
    }

    private async initializeState() {
        // Load initial attributes from births
        const horses = await Birth.find()
            .sort({ blockNumber: -1, tokenId: -1 })
            .limit(1000)
            .lean();

        // Calculate trait attributes
        TRAIT_TYPES.forEach((traitType) => {
            const uniqueTraits = [...new Set(horses.map((horse: Horse) => horse[traitType]))]
                .filter((trait): trait is string => trait !== undefined);

            uniqueTraits.forEach((trait) => {
                const amount = horses.filter((horse: Horse) => horse[traitType] === trait).length;
                this.attributes.push({
                    name: traitType,
                    value: trait,
                    amount,
                    percentage: (100 / horses.length) * amount
                });
            });
        });
    }

    async createNewGame(blockNumber: number, gameLength: number) {
        const newState: GameState = {
            gameStart: blockNumber,
            gameLength,
            ghosts: [],
            totalPaidOut: 0,
            traits: {} as Record<TraitType, ScareCityAnswers>
        };

        // Initialize trait answers
        TRAIT_TYPES.forEach((trait) => {
            const traitsOfType = this.attributes.filter(({ name }) => name === trait);
            const randomIndex = Math.floor(Math.random() * traitsOfType.length);
            const answer = traitsOfType[randomIndex]?.value || '';

            newState.traits[trait] = {
                answer,
                discounted: [],
                discounters: [],
                foundBy: null,
                foundAtBlock: null
            };
        });

        this.state = newState;
        this.emit('gameUpdated', this.state);

        // Save to database
        const gameDoc = new ScareCityGame(newState);
        await gameDoc.save();
    }

    async handleBlockUpdate(blockNumber: number) {
        if (!this.state) {
            await this.createNewGame(blockNumber, 10);
            return;
        }

        const gameEnded = this.state.gameStart + this.state.gameLength <= blockNumber;
        if (gameEnded) {
            await this.handleGameEnd();
            await this.createNewGame(blockNumber, 10);
        }
    }

    private async handleGameEnd() {
        if (!this.state) return;

        // Check if anyone played
        const someonePlayed = TRAIT_TYPES.some(trait => 
            this.state?.traits[trait].foundBy || 
            this.state?.traits[trait].discounted.length > 0
        );

        if (someonePlayed) {
            // Calculate and distribute rewards
            // TODO: Implement reward distribution
            
            // Save game results
            const gameDoc = new ScareCityGame(this.state);
            await gameDoc.save();
        }
    }

    handleScan(account: string, scanType: TraitType, scanResult: string, blockNumber: number) {
        if (!this.state) return;

        const trait = this.state.traits[scanType];
        
        // Found correct trait
        if (trait.foundBy === null && trait.answer === scanResult) {
            trait.foundBy = account;
            trait.foundAtBlock = blockNumber;
            this.emit('traitFound', { account, scanType, scanResult });
        } 
        // Wrong trait but not previously discounted
        else if (trait.answer !== scanResult && !trait.discounters.includes(account)) {
            trait.discounters.push(account);
            if (!trait.discounted.includes(scanResult)) {
                trait.discounted.push(scanResult);
            }

            // Check if player has discounted all traits
            const allTraitsDiscounted = TRAIT_TYPES.every(traitType => 
                this.state?.traits[traitType].discounters.includes(account)
            );

            if (allTraitsDiscounted && this.state) {
                this.state.ghosts.push(account);
                this.emit('becameGhost', { account });
            }
        }

        this.emit('gameUpdated', this.state);
    }

    getState() {
        return this.state;
    }

    getAttributes() {
        return this.attributes;
    }
}