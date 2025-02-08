import React, { useEffect, useState, useCallback } from 'react';
import * as Styled from './Race.style';
import Horse from '../Horse';

interface RaceProps {
    playerHorse: {
        tokenId: string;
        position: { x: number; y: number };
    };
    aiHorses: Array<{
        tokenId: string;
        position: { x: number; y: number };
    }>;
    onStateChange: (state: 'countdown' | 'racing' | 'finished') => void;
}

type RaceState = 'not_started' | 'countdown' | 'racing' | 'finished';

export const Race: React.FC<RaceProps> = ({ 
    playerHorse,
    aiHorses,
    onStateChange
}) => {
    const [raceState, setRaceState] = useState<RaceState>('not_started');
    const [countdown, setCountdown] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [finishTimes, setFinishTimes] = useState<Map<string, number>>(new Map());
    const [aiPositions, setAiPositions] = useState<Map<string, { x: number; y: number }>>(
        new Map(aiHorses.map(horse => [horse.tokenId, horse.position]))
    );
    const [playerPosition, setPlayerPosition] = useState({ x: 580, y: 2070 });  // Start at stall position

    // Check if player is in starting position
    const checkStartPosition = useCallback(() => {
        // Only check if we're not already in a race state
        if (raceState !== 'not_started') return false;

        const { x, y } = playerHorse.position;
        console.log('Horse x position:', x);
        
        // Check if horse is in start box
        const isInStartPosition = x <= 580 && y >= 2070 && y <= 2150;

        console.log('Is in start position:', isInStartPosition);
        return isInStartPosition;
    }, [playerHorse.position, raceState]);

    // Start countdown when player enters start box
    useEffect(() => {
        if (raceState === 'not_started') {
            const isInStartPosition = checkStartPosition();
            console.log('Checking start position:', isInStartPosition);
            if (isInStartPosition) {
                console.log('Starting countdown!');
                setRaceState('countdown');
                onStateChange('countdown');
                setCountdown(3);
            }
        }
    }, [raceState, checkStartPosition, onStateChange]);

    // Handle countdown
    useEffect(() => {
        if (raceState === 'countdown' && countdown !== null) {
            if (countdown > 0) {
                const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
                return () => clearTimeout(timer);
            } else {
                setRaceState('racing');
                onStateChange('racing');
                setStartTime(Date.now());
            }
        }
    }, [raceState, countdown, onStateChange]);

    // Move horses during race
    useEffect(() => {
        if (raceState === 'racing') {
            const moveInterval = setInterval(() => {
                // Move player horse
                setPlayerPosition(prev => {
                    const newX = prev.x + 5;  // Constant speed for player
                    if (newX >= 1990 && !finishTimes.has(playerHorse.tokenId)) {
                        setFinishTimes(times => 
                            new Map(times).set(playerHorse.tokenId, Date.now())
                        );
                    }
                    return { ...prev, x: newX };
                });

                // Move AI horses
                setAiPositions(prev => {
                    const next = new Map(prev);
                    aiHorses.forEach(horse => {
                        if (!finishTimes.has(horse.tokenId)) {
                            const currentPos = next.get(horse.tokenId);
                            if (currentPos) {
                                // Random speed between 3-7 pixels per tick
                                const speed = 3 + Math.random() * 4;
                                const newX = currentPos.x + speed;
                                
                                // Check if horse finished
                                if (newX >= 1990) {
                                    setFinishTimes(times => 
                                        new Map(times).set(horse.tokenId, Date.now())
                                    );
                                } else {
                                    next.set(horse.tokenId, {
                                        ...currentPos,
                                        x: newX
                                    });
                                }
                            }
                        }
                    });
                    return next;
                });
            }, 50);  // Update every 50ms
            
            return () => clearInterval(moveInterval);
        }
    }, [raceState, aiHorses, finishTimes, playerHorse.tokenId]);

    // Check race completion
    useEffect(() => {
        if (raceState === 'racing' && startTime) {
            const allFinished = [playerHorse, ...aiHorses]
                .every(horse => finishTimes.has(horse.tokenId));
            
            if (allFinished) {
                setRaceState('finished');
                onStateChange('finished');
            }
        }
    }, [raceState, startTime, finishTimes, playerHorse, aiHorses, onStateChange]);

    // Get sorted race results
    const getRaceResults = useCallback(() => {
        return Array.from(finishTimes.entries())
            .sort(([, timeA], [, timeB]) => timeA - timeB)
            .map(([tokenId]) => tokenId);
    }, [finishTimes]);

    return (
        <>
            {/* Race Track */}
            <Styled.RaceTrack />
            <Styled.StartLine />
            <Styled.FinishLine />
            
            {/* Starting Stalls */}
            <Styled.StartingStall style={{ left: 580, top: 1800 }} />  {/* Stall 1 (1530 + 270) */}
            <Styled.StartingStall style={{ left: 580, top: 1930 }} />  {/* Stall 2 (1660 + 270) */}
            <Styled.StartingStall style={{ left: 580, top: 2070 }} />  {/* Start Box (1800 + 270) */}

            {/* Fences */}
            <Styled.Fence className="top" />
            <Styled.Fence className="bottom" />

            {/* AI Horses */}
            {aiHorses.map((horse, index) => {
                const position = aiPositions.get(horse.tokenId);
                if (!position) return null;
                return (
                    <Horse
                        key={horse.tokenId}
                        style={{
                            position: 'absolute',
                            left: position.x,
                            top: 1800 + (index * 130),  // Staggered vertically (1530 + 270)
                            transform: 'scaleX(1)'  // Always facing right
                        }}
                        horseId={horse.tokenId}
                    />
                );
            })}

            {/* Player Horse (only during countdown and racing) */}
            {(raceState === 'racing' || raceState === 'countdown') && (
                <Horse
                    style={{
                        position: 'absolute',
                        left: playerPosition.x,
                        top: playerPosition.y,
                        transform: 'scaleX(1)'  // Always facing right during race
                    }}
                    horseId={playerHorse.tokenId}
                />
            )}

            {/* Countdown Display */}
            {raceState === 'countdown' && countdown !== null && (
                <Styled.CountdownDisplay>
                    {countdown === 0 ? 'GO!' : countdown}
                </Styled.CountdownDisplay>
            )}

            {/* Podium */}
            {raceState === 'finished' && (
                <Styled.Podium style={{ opacity: 1 }}>
                    {getRaceResults().slice(0, 3).map((tokenId, index) => (
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
        </>
    );
};

export default Race;