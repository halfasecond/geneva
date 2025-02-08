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
    onStateChange?: (state: 'countdown' | 'racing' | 'finished') => void;
    onRacingPositionChange?: (position: { x: number; y: number }) => void;
}

type RaceState = 'not_started' | 'countdown' | 'racing' | 'finishing' | 'finished';
const Race = ({
    playerHorse,
    aiHorses,
    onStateChange,
    onRacingPositionChange
}: RaceProps): React.ReactElement => {
    // Destructure props to make them available in scope
    const { tokenId: playerTokenId, position: playerPosition } = playerHorse;
    const [raceState, setRaceState] = useState<RaceState>('not_started');
    const [countdown, setCountdown] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [finishTimes, setFinishTimes] = useState<Map<string, number>>(new Map());
    const [aiPositions, setAiPositions] = useState<Map<string, { x: number; y: number }>>(
        new Map(aiHorses.map(horse => [horse.tokenId, horse.position]))
    );
    const [racingHorsePosition, setRacingHorsePosition] = useState({ x: 580, y: 2070 });
    const [hasStarted, setHasStarted] = useState(false);  // Track if race has started

    // Check if player is in starting position - only check once
    const checkStartPosition = useCallback(() => {
        if (hasStarted || raceState !== 'not_started') return false;
        const { x } = playerPosition;
        const isInPosition = x >= 580 && x <= 700;
        if (isInPosition) {
            setHasStarted(true);  // Lock the start check
        }
        return isInPosition;
    }, [hasStarted, raceState, playerPosition]);

    // Start countdown when player enters start box
    useEffect(() => {
        if (raceState === 'not_started') {
            const isInStartPosition = checkStartPosition();
            if (isInStartPosition) {
                setRaceState('countdown');
                if (onStateChange) onStateChange('countdown');
                setCountdown(3);
            }
        }
    }, [raceState, checkStartPosition, onStateChange]);

    // Handle countdown
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (raceState === 'countdown' && countdown !== null) {
            if (countdown > 0) {
                timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            } else {
                timer = setTimeout(() => {
                    setRaceState('racing');
                    if (onStateChange) onStateChange('racing');
                    setStartTime(Date.now());
                }, 1000);  // Show GO! for 1 second
            }
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [raceState, countdown, onStateChange]);

    // Move horses during race
    useEffect(() => {
        if (raceState === 'racing' || raceState === 'finishing') {
            const moveInterval = setInterval(() => {
                // Move racing horse
                setRacingHorsePosition(prev => {
                    const newX = prev.x + 5;  // Constant speed
                    if (newX >= 1990) {
                        if (!finishTimes.has(playerTokenId)) {
                            setFinishTimes(times =>
                                new Map(times).set(playerTokenId, Date.now())
                            );
                        }
                        return { ...prev, x: 1990 };  // Cap at finish line
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
                                    next.set(horse.tokenId, {
                                        ...currentPos,
                                        x: 1990  // Cap at finish line
                                    });
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

    // Notify parent of racing position changes
    useEffect(() => {
        if (onRacingPositionChange && (raceState === 'countdown' || raceState === 'racing' || raceState === 'finishing')) {
            onRacingPositionChange(racingHorsePosition);
        }
    }, [onRacingPositionChange, racingHorsePosition, raceState]);

    // Check race completion
    useEffect(() => {
        if (raceState === 'racing' && startTime) {
            const allFinished = [{ tokenId: playerTokenId }, ...aiHorses]
                .every(horse => finishTimes.has(horse.tokenId));
            
            if (allFinished && racingHorsePosition.x >= 1990) {
                // Signal race completion - Paddock will handle position update
                setRaceState('finished');
                if (onStateChange) onStateChange('finished');
            }
        }
    }, [raceState, startTime, finishTimes, playerTokenId, aiHorses, onStateChange, racingHorsePosition.x]);

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
            <Styled.StartingStall style={{ left: 580, top: 1800 }} />  {/* Stall 1 */}
            <Styled.StartingStall style={{ left: 580, top: 1930 }} />  {/* Stall 2 */}
            <Styled.StartingStall style={{ left: 580, top: 2070 }} />  {/* Start Box */}

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
                            left: `${position.x}px`,
                            top: `${1800 + (index * 130)}px`,
                            transform: 'scaleX(1)'
                        }}
                        horseId={horse.tokenId}
                    />
                );
            })}

            {/* Racing Horse (during countdown, racing, and finishing) */}
            {(raceState === 'racing' || raceState === 'countdown' || raceState === 'finishing') && (
                <Horse
                    style={{
                        position: 'absolute',
                        left: `${racingHorsePosition.x}px`,
                        top: `${racingHorsePosition.y}px`,
                        transform: 'scaleX(1)'
                    }}
                    horseId={playerHorse.tokenId}
                />
            )}

            {/* Podium */}
            {raceState === 'finished' && (
                <Styled.Podium data-testid="podium" style={{ opacity: 1 }}>
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

            {/* Countdown Display */}
            {raceState === 'countdown' && countdown !== null && (
                <Styled.CountdownDisplay>
                    {countdown === 0 ? 'GO!' : countdown}
                </Styled.CountdownDisplay>
            )}
        </>
    );
};

export default Race;