import { Actor, Position, WorldState, createActor } from '../../../../types/actor';
import { Namespace } from 'socket.io';

// Initialize world state
export const initializeWorldState = (namespace: Namespace, actors: Actor[]) => {
    namespace.worldState = {
        actors,
        timestamp: Date.now()
    };
    namespace.staticActors = [];
};

// Get static actors
export const getStaticActors = (namespace: Namespace): Actor[] => {
    return namespace.staticActors;
};

// Add static actor
export const addStaticActor = (namespace: Namespace, actor: Actor): void => {
    namespace.staticActors.push(actor);
};

// Player management
export const addPlayer = (namespace: Namespace, socketId: string, position: Position, tokenId: number, walletAddress: string, race: number | undefined, hay: number): Actor => {
    const existingPlayer = namespace.worldState.actors.find(
        actor => actor.type === 'player' && actor.id === tokenId  // Compare tokenIds
    );

    if (existingPlayer) {
        // Only update connection state and sprite, preserve position
        existingPlayer.connected = true;
        existingPlayer.lastSeen = new Date();
        existingPlayer.socketId = socketId;  // Update socket mapping
        return existingPlayer;
    }

    const player = {
        ...createActor(
            'player',
            tokenId,  // NFT token ID is the player's ID
            position.x,
            position.y,
            position.direction
        ),
        socketId,
        race,
        walletAddress,
        hay,
    } as PlayerActor;
    
    namespace.worldState.actors.push(player);
    return player;
};

export const updateActorPosition = (
    namespace: Namespace,
    id: number,
    x: number,
    y: number,
    direction: 'left' | 'right'
): void => {
    const actor = namespace.worldState.actors.find(a => a.id === id); // TODO - could this move e.g. ducks if the player owned one.. ?
    if (actor) {
        actor.position = { x, y, direction };
        if (actor.type === 'player') {
            actor.lastSeen = new Date();
        }
    }
};

export const incrementBalance = async (
    namespace: any,
    blockNumber: any,
    amount: number,
    payee: string,
    balanceType: string, // e.g. hay - hardcoded for now as this is the only game balance planned for launch
    activity: string, // e.g. "ScareCity" / "TheGreaterTractor"
    Models: any
) => {
    const actor = namespace.worldState.actors.find(a => a.type === 'player' && a.walletAddress.toLowerCase() === payee.toLowerCase())
    try {
        actor[balanceType] += amount
        await new Models.Hay({
            blockNumber, amount, address: payee.toLowerCase(), tokenId: actor.id, activity
        }).save();
        console.log(`🐎 horse #${actor.id}`, 'earnt:', amount, balanceType, 'playing', activity, 'new balance: $HAY', actor[balanceType])
    } catch (e) {
        console.log(e)
    }
    
}

export const setPlayerConnected = (namespace: Namespace, id: number): void => {
    const player = namespace.worldState.actors.find(
        actor => actor.type === 'player' && actor.id === id
    );
    if (player) {
        player.connected = true;
        player.lastSeen = new Date();
    }
};

export const setPlayerDisconnected = (namespace: Namespace, id: number): void => {
    const player = namespace.worldState.actors.find(
        actor => actor.type === 'player' && actor.id === id
    );
    if (player) {
        player.connected = false;
        player.lastSeen = new Date();
    }
};

export const completePlayerTutorial = (namespace: Namespace, id: number, race: any): void => {
    const player = namespace.worldState.actors.find(
        actor => actor.type === 'player' && actor.id === id
    )
    if (player && race.find((r: any) => r.tokenId === id)) {
        const time = race.find((r: any) => r.tokenId === id).time
        if (player.race === undefined || player.race > time) {
            player.race = time // either sets a time (ending the tutorial sequence) or updates to their best time
        } 
    }
};

export const getConnectedPlayers = (namespace: Namespace): Actor[] => {
    return namespace.worldState.actors.filter(
        actor => actor.type === 'player' && actor.connected
    );
};

export interface PlayerActor extends Actor {
    socketId?: string;
    walletAddress: string;  // Required for all players
}

export const getPlayerBySocket = (namespace: Namespace, socketId: string): Actor | undefined => {
    return namespace.worldState.actors.find(
        actor => actor.type === 'player' && actor.connected && (actor as PlayerActor).socketId === socketId
    );
};

// Duck management
export const addDuck = (namespace: Namespace, x: number, y: number, horseId: number): Actor => {
    const duck = createActor('duck of doom', horseId, x, y, 'right');
    namespace.worldState.actors.push(duck);
    return duck;
};

// Turtle management
export const addTurtle = (namespace: Namespace, x: number, y: number, horseId: number): Actor => {
    const turtle = createActor('turtle of speed', horseId, x, y, 'right');
    namespace.worldState.actors.push(turtle);
    return turtle;
};

// Flower management (static actors)
export const addFlower = (namespace: Namespace, x: number, y: number, horseId: number): Actor => {
    const size = 100 + Math.random() * 100; // Random size 100-200
    const flower = {
        ...createActor('flower of goodwill', horseId, x, y, 'right'),
        size
    };
    addStaticActor(namespace, flower);
    return flower;
};

interface RestrictedArea {
    left: number;
    top: number;
    width: number;
    height: number;
}

// Check if position is in restricted area
export const isInRestrictedArea = (x: number, y: number, size: number, areas: RestrictedArea[]) => {
    return areas.some(area => {
        return !(x + size < area.left ||
                x > area.left + area.width ||
                y + size < area.top ||
                y > area.top + area.height
            );
    });
};

// Get random position avoiding areas
export const getRandomPosition = (areas: RestrictedArea[], worldWidth: number, worldHeight: number): { x: number, y: number } => {
    let x, y;
    do {
        x = Math.random() * (worldWidth - 200);  // Leave space for size
        y = Math.random() * (worldHeight - 1000); // Keep away from beach
    } while (isInRestrictedArea(x, y, 100, areas));
    return { x, y };
};

// World state helpers
export const getWorldState = (namespace: Namespace): WorldState => {
    return {
        actors: namespace.worldState.actors,
        timestamp: Date.now()
    };
};

export const formatActorState = (actor: Actor) => ({
    id: actor.id,
    type: actor.type,
    position: actor.position,
    connected: actor.connected,
    lastSeen: actor.lastSeen,
    size: actor.size,
    race: actor.race
});
