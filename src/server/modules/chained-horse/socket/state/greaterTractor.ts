import { incrementBalance } from "./world";

interface GameState {
    votes: {
        left: number;
        right: number;
    };
    gameStart: number;      // Starting block number
    gameLength: number;     // Game duration in blocks
    lastGame: {
        winner: 'left' | 'right';
        votes: {
            left: number;
            right: number;
        };
        block: number;
    } | null;
    playerVotes: Record<string, {
        direction: 'left' | 'right';
        block: number;
    }>;
}

export const initializeGreaterTractorState = (namespace: any, initialBlock: number, Models: any, gameLength: number) => {
    let currentGame: GameState = {
        votes: { left: 0, right: 0 },
        gameStart: initialBlock,
        gameLength,
        lastGame: null,
        playerVotes: {}
    };

    // Get last game from database if available
    const getLastGame = async () => {
        try {
            const lastGame = await Models.GreaterTractorGame.findOne({}, {
                '_id': 0,
                '__v': 0,
            }).sort({ gameStart: -1 }).exec();

            if (lastGame) {
                currentGame.lastGame = {
                    winner: lastGame.winner,
                    votes: lastGame.votes,
                    block: lastGame.gameStart + lastGame.gameLength
                };
            }
        } catch (error) {
            console.error('Error getting last Greater Tractor game:', error);
        }
    };

    // Initialize by getting last game
    getLastGame();

    // Handle player vote
    const handleVote = (account: string, tokenId: number, direction: 'left' | 'right', blockNumber: number) => {
        // Check if player has already voted
        const existingVote = currentGame.playerVotes[account];

        if (existingVote) {
            // If player is changing their vote, update vote counts
            if (existingVote.direction !== direction) {
                currentGame.votes[existingVote.direction]--;
                currentGame.votes[direction]++;
                currentGame.playerVotes[account] = { direction, block: blockNumber };
                // Send notification
                namespace.emit('greaterTractor:vote', {
                    account,
                    tokenId: tokenId, 
                    type: 'greater_tractor_vote_change',
                });
            }
        } else {
            // New vote
            currentGame.votes[direction]++;
            currentGame.playerVotes[account] = { direction, block: blockNumber };
            // Send notification
            namespace.emit('greaterTractor:vote', {
                account,
                tokenId: tokenId, 
                type: 'greater_tractor_vote',
            });
        }

        // Emit updated state (without vote counts to promote discussion)
        emitState();
    };

    // Emit game state to clients (without revealing vote counts)
    const emitState = () => {
        namespace.emit('greaterTractor:state', {
            nextReset: currentGame.gameStart + currentGame.gameLength,
            lastGame: currentGame.lastGame
        });
    };

    // Handle block update
    const handleBlockUpdate = async (blockNumber: number) => {
        // Check if game should end
        if (blockNumber >= currentGame.gameStart + currentGame.gameLength) {
            // Determine winner
            const winner = currentGame.votes.left > currentGame.votes.right ? 'left' as const : 'right' as const;

            // Save last game results
            const lastGame = {
                winner,
                votes: { ...currentGame.votes },
                block: blockNumber
            };

            // Reward winners
            const winners: string[] = [];
            let totalPayout = 0;

            for (const [account, vote] of Object.entries(currentGame.playerVotes)) {
                if (vote.direction === winner) {
                    winners.push(account);
                    // Add 5 **$HAY** to player
                    await incrementBalance(namespace, blockNumber, 5, account, 'hay', 'greater_tractor_win', Models);
                    totalPayout += 5;

                    // Send notification
                    namespace.emit('greaterTractor:results', {
                        account,
                        type: 'greater_tractor_win',
                        winner,
                        reward: "5 $HAY"
                    });
                }
            }

            // Save game state to database
            try {
                const gameState = {
                    gameStart: currentGame.gameStart,
                    gameLength: currentGame.gameLength,
                    votes: currentGame.votes,
                    winner,
                    winners,
                    totalPayout
                };

                // Save to database if model exists
                if (Models.GreaterTractorGame && gameState.totalPayout > 0) {
                    console.log(`🚜 Greater Tractor Game: ${winner} tractor won! $HAY: ${totalPayout}`);
                    console.log(gameState)
                    const newGame = new Models.GreaterTractorGame(gameState);
                    await newGame.save();
                } 

                // Update current game state
                currentGame.lastGame = lastGame;
            } catch (error) {
                console.error('Error saving GreaterTractorGame:', error);
            }

            // Reset for new game
            currentGame = {
                votes: { left: 0, right: 0 },
                gameStart: blockNumber,
                gameLength,
                lastGame,
                playerVotes: {}
            };

            // Emit reset event
            namespace.emit('greaterTractor:reset', { gameStart: blockNumber });
        }

        // Always emit current state
        emitState();
    };

    // Send initial state to new connections
    namespace.on('connection', (socket: any) => {
        socket.emit('greaterTractor:state', {
            nextReset: currentGame.gameStart + currentGame.gameLength,
            lastGame: currentGame.lastGame
        });
    });

    return {
        handleBlockUpdate,
        handleVote,
        getState: () => currentGame
    };
};