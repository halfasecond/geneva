import { Actor, Position, WorldState, createActor } from '../../../../types/actor';
import { Namespace } from 'socket.io';

// Track world state
declare module 'socket.io' {
    interface Namespace {
        worldState: WorldState;
    }
}

// Initialize world state
export const initializeWorldState = (namespace: Namespace) => {
    namespace.worldState = {
        actors: [],
        timestamp: Date.now()
    };
};

// Player management
export const addPlayer = (namespace: Namespace, address: string, socketId: string, position: Position, horseId: number): Actor => {
    const existingPlayer = namespace.worldState.actors.find(
        actor => actor.type === 'player' && actor.id === address
    );

    if (existingPlayer) {
        existingPlayer.position = position;
        existingPlayer.connected = true;
        existingPlayer.lastSeen = new Date();
        return existingPlayer;
    }

    const player = {
        ...createActor(
            'player',
            address,
            position.x,
            position.y,
            `horse/${horseId}.svg`,  // getAssetPath will prepend /svg/ on client
            position.direction
        ),
        socketId
    } as PlayerActor;
    
    namespace.worldState.actors.push(player);
    return player;
};

export const updateActorPosition = (
    namespace: Namespace,
    id: string,
    x: number,
    y: number,
    direction: 'left' | 'right'
): void => {
    const actor = namespace.worldState.actors.find(a => a.id === id);
    if (actor) {
        actor.position = { x, y, direction };
        if (actor.type === 'player') {
            actor.lastSeen = new Date();
        }
    }
};

export const setPlayerConnected = (namespace: Namespace, address: string, socketId: string): void => {
    const player = namespace.worldState.actors.find(
        actor => actor.type === 'player' && actor.id === address
    );
    if (player) {
        player.connected = true;
        player.lastSeen = new Date();
    }
};

export const setPlayerDisconnected = (namespace: Namespace, address: string): void => {
    const player = namespace.worldState.actors.find(
        actor => actor.type === 'player' && actor.id === address
    );
    if (player) {
        player.connected = false;
        player.lastSeen = new Date();
    }
};

export const getConnectedPlayers = (namespace: Namespace): Actor[] => {
    return namespace.worldState.actors.filter(
        actor => actor.type === 'player' && actor.connected
    );
};

export interface PlayerActor extends Actor {
    socketId?: string;
}

export const getPlayerBySocket = (namespace: Namespace, socketId: string): Actor | undefined => {
    return namespace.worldState.actors.find(
        actor => actor.type === 'player' && actor.connected && (actor as PlayerActor).socketId === socketId
    );
};

// Duck management
export const addDuck = (namespace: Namespace, x: number, y: number): Actor => {
    const id = `duck-${namespace.worldState.actors.filter(a => a.type === 'duck').length + 1}`;
    const duck = createActor('duck', id, x, y, 'horse/Duck.svg');  // getAssetPath will prepend /svg/
    namespace.worldState.actors.push(duck);
    return duck;
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
    sprite: actor.sprite,
    position: actor.position,
    connected: actor.connected,
    lastSeen: actor.lastSeen
});