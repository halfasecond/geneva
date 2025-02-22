import React, { useEffect, useState, useCallback } from 'react';
import * as Styled from './Race.style';
import Horse from '../Horse';
import { Z_LAYERS } from 'src/config/zIndex';
import { RaceState } from '../Game/utils';

interface RaceProps {
    playerHorse: {
        tokenId: string;
        position: { x: number; y: number };
    };
    aiHorses: Array<{
        tokenId: string;
        position: { x: number; y: number };
    }>;
    raceState: RaceState;
    countdown?: number | null;
    showPodium?: boolean;
    finishResults?: string[];
}

const Race = ({
    playerHorse,
    aiHorses,
    raceState,
    countdown = null,
    showPodium = false,
    finishResults = []
}: RaceProps): React.ReactElement => {

    return (
        <>
            {/* Race Track */}
            <Styled.RaceTrack />
            <Styled.StartLine />
            <Styled.FinishLine />
            
            {/* Starting Stalls */}
            <Styled.StartingStall style={{ left: 580, top: 1790 }} />
            <Styled.StartingStall style={{ left: 580, top: 1920 }} />
            <Styled.StartingStall style={{ left: 580, top: 2060 }} />

            {/* Fences */}
            <Styled.Fence className="top" />
            <Styled.Fence className="bottom" />

            {/* AI Horses */}
            {aiHorses.map((horse, index) => (
                <Horse
                    key={horse.tokenId}
                    style={{
                        position: 'absolute',
                        left: `${horse.position.x}px`,
                        top: `${1790 + (index * 130)}px`,
                        transform: 'scaleX(1)',
                        zIndex: Z_LAYERS.TERRAIN_FEATURES + 1
                    }}
                    horseId={horse.tokenId}
                />
            ))}

            {/* Racing Horse */}
            {(raceState === 'racing' || raceState === 'countdown') && (
                <Horse
                    style={{
                        position: 'absolute',
                        left: `${playerHorse.position.x}px`,
                        top: `${playerHorse.position.y}px`,
                        transform: 'scaleX(1)',
                        zIndex: Z_LAYERS.TERRAIN_FEATURES + 1
                    }}
                    horseId={playerHorse.tokenId}
                />
            )}

            {/* Podium */}
            {showPodium && (
                <Styled.Podium data-testid="podium" style={{ opacity: 1 }}>
                    {finishResults.slice(0, 3).map((tokenId, index) => (
                        <Horse
                            key={tokenId}
                            style={{
                                position: 'absolute',
                                left: [102, 42, 170][index],
                                top: [8, 18, 28][index],
                                width: 50,
                                height: 50
                            }}
                            horseId={tokenId}
                        />
                    ))}
                    <Styled.PodiumPlatform className="first" />
                    <Styled.PodiumPlatform className="second" />
                    <Styled.PodiumPlatform className="third" />
                </Styled.Podium>
            )}

            {/* Countdown Display */}
            {raceState === 'countdown' && countdown !== null && (
                <Styled.CountdownDisplay
                    style={{
                        animation: countdown === 0 ? 'scale 0.5s infinite' : 'none',
                        fontSize: countdown === 0 ? '72px' : '48px',
                        color: '#000',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {countdown === 0 ? 'GO!' : countdown}
                </Styled.CountdownDisplay>
            )}
        </>
    );
};

export default Race;
