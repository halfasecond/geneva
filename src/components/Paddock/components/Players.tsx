import React, { memo } from 'react';
import Horse from '../../Horse/Horse';
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
    players: Map<string, LivePlayer>;
}

// Memoize individual horse to prevent unnecessary re-renders
const RemoteHorse = memo(({ player }: { 
    player: LivePlayer; }) => (
    <StyledHorse
        style={{
            left: `${player.x}px`,
            top: `${player.y}px`,
            transform: `scaleX(${player.direction === "right" ? 1 : -1})`,
            display: player.isRacing ? 'none' : 'block'
        }}
    >
        <Horse
            horseId={player.avatarHorseId.toString()}
        />
    </StyledHorse>
));

export const Players: React.FC<PlayersProps> = ({ 
    players,
}) => {
    return (
        <>
            {/* Local player - hide during racing */}
            {/* {!localPlayer.isRacing && (
                <StyledHorse
                    style={{
                        left: `${localPlayer.position.x}px`,
                        top: `${localPlayer.position.y}px`,
                        transform: `scaleX(${localPlayer.position.direction === "right" ? 1 : -1})`
                    }}
                >
                    <Horse horseId={localPlayer.horseId} />
                </StyledHorse>
            )} */}
            
            {/* Remote players */}
            {Array.from(players.entries()).map(([address, player]) => (
                <RemoteHorse
                    key={address}
                    player={player}
                />
            ))}
        </>
    );
};
