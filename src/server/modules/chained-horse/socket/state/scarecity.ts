import { Namespace } from 'socket.io';

export const initializeScareCityState = (namespace: Namespace, utilities: any, initialBlock: number) => {
    let blockCounter = 0;
    let currentGame: any = null;

    const createNewGame = (blockNumber: number) => {
        currentGame = {
            gameStart: blockNumber,
            gameLength: 10,
            ghosts: [],
            totalPaidOut: 0,
            traits: {}
        };

        // Initialize traits from utilities
        Object.entries(utilities).forEach(([trait, count]) => {
            currentGame.traits[trait] = {
                answer: trait,
                discounted: [],
                discounters: [],
                foundBy: null,
                foundAtBlock: null,
                count
            };
        });

        namespace.emit('scarecity:reset', { gameStart: blockNumber });
        return currentGame;
    };

    // Create initial game on boot
    createNewGame(initialBlock);

    const handleBlockUpdate = (blockNumber: number) => {
        blockCounter++;
        if (blockCounter >= 10) {
            currentGame = createNewGame(blockNumber);
            blockCounter = 0;
        }
        // Always emit current state
        namespace.emit('scarecity:gameState', currentGame);
    };

    const handleScan = (account: string, scanType: string, scanResult: string, blockNumber: number) => {
        if (!currentGame) return;

        const trait = currentGame.traits[scanType];
        if (!trait) return;
        
        // Found correct trait
        if (trait.foundBy === null && trait.answer === scanResult) {
            trait.foundBy = account;
            trait.foundAtBlock = blockNumber;
            namespace.emit('scarecity:traitFound', { account, scanType, scanResult });
        } 
        // Wrong trait but not previously discounted
        else if (trait.answer !== scanResult && !trait.discounters.includes(account)) {
            trait.discounters.push(account);
            if (!trait.discounted.includes(scanResult)) {
                trait.discounted.push(scanResult);
            }

            // Check if player has discounted all traits
            const allTraitsDiscounted = Object.values(currentGame.traits)
                .every((t: any) => t.discounters.includes(account));

            if (allTraitsDiscounted) {
                currentGame.ghosts.push(account);
                namespace.emit('scarecity:becameGhost', { account });
            }
        }

        namespace.emit('scarecity:gameState', currentGame);
    };

    const getState = () => currentGame;

    // Send initial state to new connections
    namespace.on('connection', (socket) => {
        socket.emit('scarecity:gameState', currentGame);
    });

    return {
        handleBlockUpdate,
        handleScan,
        getState
    };
};