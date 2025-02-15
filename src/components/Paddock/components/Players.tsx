import React, { memo } from 'react';
import Horse from '../../Horse/Horse';
import { Position } from '../../../server/types';
import { LivePlayer } from '../../../server/modules/chained-horse/socket/state/players';
import { Z_LAYERS } from 'src/config/zIndex';
import styled from 'styled-components';

const StyledHorse = styled.div`
    position: absolute;
    width: 100px;
    height: 100px;
    will-change: transform;
    transition: all 0.1s linear;
    z-index: ${Z_LAYERS.CHARACTERS};
`;

interface PlayersProps {
    localPlayer: {
        horseId: string;
        position: Position;
        isRacing?: boolean;
    };
    remotePlayers: Map<string, LivePlayer>;
    offset?: { x: number; y: number };
}

// Memoize individual horse to prevent unnecessary re-renders
const RemoteHorse = memo(({ player, offset }: { 
    player: LivePlayer; 
    offset: { x: number; y: number; 
}}) => (
    <StyledHorse
        style={{
            left: `${player.x + offset.x}px`,
            top: `${player.y + offset.y}px`,
            transform: `scaleX(${player.direction === "right" ? 1 : -1})`
        }}
    >
        <Horse
            horseId={player.avatarHorseId.toString()}
        />
    </StyledHorse>
));

export const Players: React.FC<PlayersProps> = ({ 
    localPlayer, 
    remotePlayers,
    offset = { x: 100, y: 100 }  // Default offset for testing
}) => {
    console.log('Rendering Players:', {
        localPlayer,
        remotePlayers: Array.from(remotePlayers.entries())
    });

    return (
        <>
            {/* Local player - hide during racing */}
            {!localPlayer.isRacing && (
                <StyledHorse
                    style={{
                        left: `${localPlayer.position.x}px`,
                        top: `${localPlayer.position.y}px`,
                        transform: `scaleX(${localPlayer.position.direction === "right" ? 1 : -1})`
                    }}
                >
                    <Horse horseId={localPlayer.horseId} />
                </StyledHorse>
            )}
            
            {/* Remote players */}
            {Array.from(remotePlayers.entries()).map(([address, player]) => (
                <RemoteHorse
                    key={address}
                    player={player}
                    offset={offset}
                />
            ))}
        </>
    );
};
