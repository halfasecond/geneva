import { incrementBalance } from "./world";

interface Attribute {
    name: string;    // The attribute type (e.g. 'background', 'bodyColor')
    value: string;   // The specific value of this attribute
    amount: number;  // How many NFTs have this value
    percentage?: number; // Percentage rarity of this value
}

interface AttributeState {
    answer: string;          // Randomly selected value for this attribute type
    discounted: string[];    // Wrong values that have been guessed
    discounters: string[];   // Players who made wrong guesses
    foundBy: string | null;  // Player who found the correct value
    foundByTokenId: number | null; // And the horse they rode in on...
    foundAtBlock: number | null;
}

interface GameState {
    gameStart: number;      // Starting block number
    gameLength: number;     // Game duration in blocks
    ghosts: number[];      // Players who found all wrong answers
    totalPaidOut: number;  // Total rewards distributed
    attributes: Record<string, AttributeState>;  // State for each attribute type
}

interface Payment {
    payTo: string;
    payment: number;
}

export const initializeScareCityState = (namespace: any, nfts: any[], attributeTypes: string[], initialBlock: number, Models: any) => {
    let blockCounter = 0;
    let currentGame: GameState | null = null;

    const getAttributes = (nfts: any[]): Attribute[] => {
        const attributes: Attribute[] = [];
        attributeTypes.forEach((attributeType) => {
            // Get all values for this attribute type, filtering out undefined/null
            const values = nfts.map(nft => nft[attributeType]).filter(Boolean);
            const uniqueValues = [...new Set(values)];
            const totalCount = values.length;
            
            // Calculate amount and percentage for each unique value
            uniqueValues.forEach(value => {
                const amount = values.filter(v => v === value).length;
                attributes.push({
                    name: attributeType,
                    value,
                    amount,
                    percentage: (amount / totalCount) * 100
                });
            });
        });
        return attributes;
    };

    const calculateRewards = (game: GameState, attributes: Attribute[]) => {
        const payments: Payment[] = [];
        let ghostPayment = 0;

        // Calculate base rewards for each attribute
        Object.entries(game.attributes).forEach(([attributeType, state]) => {
            const attributeData = attributes.find(
                attr => attr.name === attributeType && attr.value === state.answer
            );
            if (!attributeData) return;

            const baseReward = (attributeData.percentage || 0) / 11 / 100;

            // Reward for finding correct attribute
            if (state.foundBy) {
                payments.push({
                    payTo: state.foundBy,
                    payment: baseReward
                });
            }

            // Reward for discounting wrong attributes
            state.discounters.forEach(discounter => {
                payments.push({
                    payTo: discounter,
                    payment: baseReward / attributes.filter(attr => attr.name === attributeType).length
                });
            });

            // Add to ghost payment pool
            ghostPayment += baseReward;
        });

        // Distribute ghost payments
        if (game.ghosts.length > 0) {
            game.ghosts.forEach(ghost => {
                payments.push({
                    payTo: ghost,
                    payment: ghostPayment
                });
            });
        }

        // Calculate multipliers
        const ghostMultiplier = game.ghosts.length + 1;
        const completionMultiplier = Object.values(game.attributes).every(attr => attr.foundBy) ? 5 : 1;
        const totalMultiplier = ghostMultiplier * completionMultiplier;

        // Apply multipliers and sum by payee
        const payeeTotals = payments.reduce<Record<string, number>>((acc, { payTo, payment }) => {
            acc[payTo] = (acc[payTo] || 0) + (payment * totalMultiplier);
            return acc;
        }, {});

        return payeeTotals;
    };

    const createNewGame = (blockNumber: number): GameState => {
        const attributes = getAttributes(nfts);
        const newGame: GameState = {
            gameStart: blockNumber,
            gameLength: 10,
            ghosts: [],
            totalPaidOut: 0,
            attributes: {}
        };

        // Initialize each attribute type with a random answer
        attributeTypes.forEach(attributeType => {
            const attributesOfType = attributes.filter(attr => attr.name === attributeType);
            if (attributesOfType.length > 0) {
                const randomIndex = Math.floor(Math.random() * attributesOfType.length);
                const selectedAttribute = attributesOfType[randomIndex];
                
                newGame.attributes[attributeType] = {
                    answer: selectedAttribute.value,
                    discounted: [],
                    discounters: [],
                    foundBy: null,
                    foundByTokenId: null,
                    foundAtBlock: null
                };
            }
        });

        namespace.emit('scarecity:reset', { gameStart: blockNumber });
        return newGame;
    };

    // Create initial game on boot
    currentGame = createNewGame(initialBlock);

    const handleBlockUpdate = async (blockNumber: number) => {
        blockCounter++;
        if (blockCounter >= 10) {
            // Calculate and distribute rewards before creating new game
            if (currentGame) {
                const attributes = getAttributes(nfts);
                const someonePlayed = Object.values(currentGame.attributes).some(
                    attr => attr.foundBy || attr.discounted.length > 0
                );

                if (someonePlayed) {
                    const payeeTotals = calculateRewards(currentGame, attributes);
                    currentGame.totalPaidOut = Object.values(payeeTotals).reduce((sum, amount) => sum + amount, 0);
                    
                    // Emit final rewards
                    namespace.emit('scarecity:rewards', payeeTotals);

                    // Update hay balances and save game state
                    try {
                        // Update hay balances for all payees
                        for (const [payee, amount] of Object.entries(payeeTotals)) {
                            incrementBalance(namespace, amount, payee, 389, 'hay')      
                        }

                        // Save game state
                        const gameState = {
                            ...currentGame,
                            blockNumber,
                            payeeTotals
                        };
                        console.log(gameState.totalPaidOut)
                        // const newGame = new Models.ScareCityGame(gameState);
                        // await newGame.save();
                    } catch (error) {
                        console.error('Error saving ScareCityGame:', error);
                    }
                }
            }

            // Start new game
            currentGame = createNewGame(blockNumber);
            blockCounter = 0;
        }
        // Always emit current state
        namespace.emit('scarecity:gameState', currentGame);
    };

    const handleScan = (tokenId: number, account: string, scanType: string, scanResult: string, blockNumber: number) => {
        if (!currentGame) return;
        const attribute = currentGame.attributes[scanType];
        if (!attribute) return;
        
        // Found correct attribute
        if (attribute.foundBy === null && attribute.answer === scanResult) {
            attribute.foundBy = account;
            attribute.foundByTokenId = tokenId;
            attribute.foundAtBlock = blockNumber;
            namespace.emit('scarecity:traitFound', { account, scanType, scanResult });
        } 
        // Wrong attribute but not previously discounted
        else if (attribute.answer !== scanResult && !attribute.discounters.includes(account)) {
            attribute.discounters.push(account);
            if (!attribute.discounted.includes(scanResult)) {
                attribute.discounted.push(scanResult);
            }

            // Check if player has discounted all attributes
            const allAttributesDiscounted = Object.values(currentGame.attributes)
                .every((attr) => attr.discounters.includes(account));

            if (allAttributesDiscounted) {
                currentGame.ghosts.push(tokenId);
                console.log(`🐎 Horse #${tokenId} wasn't scared... 🐎`)
                namespace.emit('scarecity:becameGhost', { tokenId });
            }
        }
        namespace.emit('scarecity:gameState', currentGame);
    };

    const getState = () => currentGame;

    // Send initial state to new connections
    namespace.on('connection', (socket: any) => {
        socket.emit('scarecity:gameState', currentGame);
    });

    return {
        handleBlockUpdate,
        handleScan,
        getState
    };
};
