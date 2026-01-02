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
export const addPlayer = (namespace: Namespace, socketId: string, position: Position, tokenId: number, walletAddress: string, race: number | undefined, hay: number, game: any): Actor => {
    const existingPlayer = namespace.worldState.actors.find(
        actor => actor.type === 'player' && actor.id === tokenId  // Compare tokenIds
    );

    if (existingPlayer) {
        existingPlayer.game = game
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
        game
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

export const getRandomPosition = (
    areas: RestrictedArea[],
    worldWidth: number,
    worldHeight: number,
    nearbyHorse?: { x: number; y: number }
): { x: number; y: number } => {
    let x: number, y: number;

    for (let attempt = 0; attempt < 80; attempt++) {
        // Start from dead center — this is our "κ attractor"
        x = worldWidth / 2;
        y = worldHeight * 0.55;

        // Add soft κ-like breathing noise — this is the magic
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * Math.random() * worldWidth * 0.42; // ← triangular dist = natural falloff
        x += Math.cos(angle) * distance;
        y += Math.sin(angle) * distance;

        // Gentle avoidance of horses
        if (nearbyHorse && Math.hypot(nearbyHorse.x - x, nearbyHorse.y - y) < 50) {
            continue;
        }

        if (!isInRestrictedArea(x, y, 100, areas)) {
            return { x, y };
        }
    }

    // Safe fallback
    let fx, fy;
    do {
        fx = Math.random() * (worldWidth - 200);
        fy = Math.random() * (worldHeight - 1000);
    } while (isInRestrictedArea(fx, fy, 100, areas));
    return { x: fx, y: fy };
};

const gaussianRandom = () => {
    // Box-Muller lite – gives nice natural clumping
    const u = 1 - Math.random();
    const v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
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
