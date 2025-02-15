import React from 'react';
import Horse from '../../Horse/Horse';
import { Position } from '../../../server/types';
import { LivePlayer } from '../../../server/modules/chained-horse/socket/state/players';

interface PlayersProps {
    localPlayer: {
        horseId: string;
        position: Position;
        isRacing?: boolean;
    };
    remotePlayers: Map<string, LivePlayer>;
    offset?: { x: number; y: number };
}

export const Players: React.FC<PlayersProps> = ({ 
    localPlayer, 
    remotePlayers,
    offset = { x: 100, y: 100 }  // Default offset for testing
}) => {
    return (
        <>
            {/* Local player - hide during racing */}
            {!localPlayer.isRacing && (
                <Horse 
                    horseId={localPlayer.horseId}
                    style={{
                        position: 'absolute',
                        left: `${localPlayer.position.x}px`,
                        top: `${localPlayer.position.y}px`,
                        transform: `scaleX(${localPlayer.position.direction === "right" ? 1 : -1})`
                    }}
                />
            )}
            
            {/* Remote players */}
            {Array.from(remotePlayers.values()).map(player => (
                <Horse
                    key={player.address}
                    horseId={player.avatarHorseId.toString()}
                    style={{
                        position: 'absolute',
                        left: `${player.x + offset.x}px`,
                        top: `${player.y + offset.y}px`,
                        transform: `scaleX(${player.direction === "right" ? 1 : -1})`
                    }}
                />
            ))}
        </>
    );
};
