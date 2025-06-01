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

export const initializeGreaterTractorState = (namespace: any, initialBlock: number, Models: any) => {
    let currentGame: GameState = {
        votes: { left: 0, right: 0 },
        gameStart: initialBlock,
        gameLength: 6600, // ~1 day in blocks
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

    // Get current game from database if available
    const getCurrentGame = async () => {
        try {
            // Find the most recent game that hasn't ended yet
            const currentGameFromDB = await Models.GreaterTractorGame.findOne(
                {
                    gameStart: {
                        $lte: initialBlock,
                        $gt: initialBlock - 6600
                    }
                },
                { '_id': 0, '__v': 0 }
            ).sort({ gameStart: -1 }).exec();
            
            if (currentGameFromDB) {
                console.log('Found current game in database:', currentGameFromDB);
                
                // Update current game state with data from database
                currentGame.gameStart = currentGameFromDB.gameStart;
                currentGame.gameLength = currentGameFromDB.gameLength;
                currentGame.votes = currentGameFromDB.votes;
                
                // Load player votes if available
                if (currentGameFromDB.playerVotes) {
                    currentGame.playerVotes = currentGameFromDB.playerVotes;
                    console.log('Loaded player votes from database:', Object.keys(currentGame.playerVotes).length);
                }
            } else {
                console.log('No current game found in database, using default');
            }
        } catch (error) {
            console.error('Error getting current Greater Tractor game:', error);
        }
    };

    // Initialize by getting last game and current game
    getLastGame();
    getCurrentGame();

    // Handle player vote
    const handleVote = async (account: string, tokenId: number, direction: 'left' | 'right', blockNumber: number) => {
        // Check if player has already voted
        const existingVote = currentGame.playerVotes[account];
        
        if (existingVote !== undefined) {
            // Player has already voted, do nothing
            return;
        }
        
        // New vote
        currentGame.votes[direction]++;
        currentGame.playerVotes[account] = { direction, block: blockNumber };
        
        // Save current game state to database
        try {
            // Find the current game in the database
            const currentGameInDB = await Models.GreaterTractorGame.findOne(
                { gameStart: currentGame.gameStart }
            );
            
            // Create a simple update object with just the data we need
            const update = {
                votes: {
                    left: currentGame.votes.left,
                    right: currentGame.votes.right
                },
                playerVotes: { ...currentGame.playerVotes }
            };
            
            if (currentGameInDB) {
                // Update existing game
                await Models.GreaterTractorGame.updateOne(
                    { gameStart: currentGame.gameStart },
                    { $set: update }
                );
            } else {
                // Create new game with required fields
                const newGame = new Models.GreaterTractorGame({
                    gameStart: currentGame.gameStart,
                    gameLength: currentGame.gameLength,
                    votes: update.votes,
                    playerVotes: update.playerVotes,
                    winner: 'left', // Default winner, will be updated when game ends
                    winners: [],    // Empty winners list, will be updated when game ends
                    totalPayout: 0  // Default payout, will be updated when game ends
                });
                await newGame.save();
            }
        } catch (error) {
            console.error('Error saving vote to database:', error);
        }
        
        // Emit updated state (without vote counts to promote discussion)
        emitState();
    };

    // Emit game state to clients (without revealing vote counts)
    const emitState = () => {
        // Emit general state to all clients
        namespace.emit('greaterTractor:state', {
            nextReset: currentGame.gameStart + currentGame.gameLength,
            lastGame: currentGame.lastGame
        });
        
        // Emit personalized state to each connected player
        const connectedSockets = namespace.sockets;
        for (const [socketId, socket] of Object.entries(connectedSockets)) {
            const player = namespace.worldState.actors.find(
                (actor: any) => actor.type === 'player' && actor.socketId === socketId
            );
            
            if (player && player.walletAddress) {
                // Check if this player has voted in the game state
                const gameStateVote = currentGame.playerVotes[player.walletAddress.toLowerCase()];
                
                // Create a simple object with just the data we need
                const playerState = {
                    hasVoted: !!gameStateVote,
                    vote: gameStateVote ? gameStateVote.direction : null
                };
                
                // Send personalized state to this player
                (socket as any).emit('greaterTractor:playerState', playerState);
            }
        }
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
                votes: {
                    left: currentGame.votes.left,
                    right: currentGame.votes.right
                },
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
                        reward: "<b>$HAY</b> 5"
                    });
                }
            }
            
            // Save game state to database
            try {
                // Create a simple object with just the data we need
                const gameState = {
                    gameStart: currentGame.gameStart,
                    gameLength: currentGame.gameLength,
                    votes: {
                        left: currentGame.votes.left,
                        right: currentGame.votes.right
                    },
                    playerVotes: { ...currentGame.playerVotes },
                    winner,
                    winners: [...winners],
                    totalPayout
                };
                
                // Save to database if model exists
                if (Models.GreaterTractorGame) {
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
                gameLength: 6600, // ~1 day in blocks
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
        // Send general state
        socket.emit('greaterTractor:state', {
            nextReset: currentGame.gameStart + currentGame.gameLength,
            lastGame: currentGame.lastGame
        });
    });

    // Send personalized state when a player joins the game
    namespace.on('player:joined', (data: any) => {
        const socketId = data?.id;
        if (!socketId) return;
        
        // Find the player by socket ID
        const player = namespace.worldState.actors.find(
            (actor: any) => actor.type === 'player' && actor.socketId === socketId
        );
        
        if (player && player.walletAddress) {
            // Check if this player has voted in the game state
            const gameStateVote = currentGame.playerVotes[player.walletAddress.toLowerCase()];
            
            // Send personalized state to this player
            const playerSocket = namespace.sockets.get(player.socketId);
            if (playerSocket) {
                // Create a simple object with just the data we need
                const playerState = {
                    hasVoted: !!gameStateVote,
                    vote: gameStateVote ? gameStateVote.direction : null
                };
                
                // Send personalized state to this player
                playerSocket.emit('greaterTractor:playerState', playerState);
            }
        }
    });

    return {
        handleBlockUpdate,
        handleVote,
        getState: () => currentGame
    };
};