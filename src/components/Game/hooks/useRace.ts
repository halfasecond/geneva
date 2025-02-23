import { useState, useEffect } from 'react';
import { Position } from '../../../server/types/actor';
import { RaceState } from '../utils';

interface UseRaceOptions {
    initialPosition: Position;
    tokenId: number | undefined;
}

export function useRace({ initialPosition, tokenId }: UseRaceOptions) {
    // Race state
    const [state, setState] = useState<RaceState>('not_started');
    const [racePosition, setRacePosition] = useState(initialPosition);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [finishResults, setFinishResults] = useState<{ tokenId: string | number, time: number}[]>([]);
    
    // AI horses state
    const [aiPositions, setAiPositions] = useState([
        { tokenId: '82', position: { x: 580, y: 1800 } },
        { tokenId: '186', position: { x: 580, y: 1930 } }
    ]);

    // Handle state changes
    const updateState = (newState: RaceState) => {
        setState(newState);
    };

    // Start race sequence
    const startRace = () => {
        setRacePosition({ ...initialPosition, x: 580, y: 2060 });
        updateState('countdown');
        setCountdown(3);
    };

    // Handle countdown
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (state === 'countdown' && countdown !== null) {
            if (countdown > 0) {
                timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            } else {
                timer = setTimeout(() => {
                    updateState('racing');
                }, 1000);
            }
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [state, countdown]);

    // Handle race movement and completion
    useEffect(() => {
        if (state !== 'racing') return;

        const finishedHorses = new Set<string>();
        const startTimes = [] as any;
        const startTime = Date.now();

        const moveInterval = setInterval(() => {
            // Move player horse
            setRacePosition(prev => {
                const speed = 2 + Math.random() * 7;
                const newX = prev.x + speed;
                
                if (newX >= 1990) {
                    if (tokenId && !finishedHorses.has(tokenId.toString())) {
                        finishedHorses.add(tokenId.toString());
                        startTimes.push({ tokenId, time: Date.now() - startTime });
                    }
                    return { ...prev, x: 1990 };
                }
                
                return { ...prev, x: newX };
            });

            // Move AI horses
            setAiPositions(prevPositions =>
                prevPositions.map(horse => {
                    if (finishedHorses.has(horse.tokenId)) {
                        return horse;
                    }

                    const speed = 2 + Math.random() * 6;
                    const newX = horse.position.x + speed;

                    if (newX >= 1990) {
                        finishedHorses.add(horse.tokenId);
                        startTimes.push({ tokenId: horse.tokenId, time: Date.now() - startTime });
                        return {
                            ...horse,
                            position: { ...horse.position, x: 1990 }
                        };
                    }

                    return {
                        ...horse,
                        position: { ...horse.position, x: newX }
                    };
                })
            );

            // Update results whenever a horse finishes
            if (finishedHorses.size > 0) {
                const results = startTimes.sort((a: any, b: any) => a.time - b.time)
                setFinishResults(results);
                // End race when all horses finish
                if (finishedHorses.size === 3) {
                    updateState('finished');
                }
            }
        }, 50);

        return () => clearInterval(moveInterval);
    }, [state]);

    return {
        state,
        position: state === 'finished' || state === 'racing' || state === 'countdown' ? racePosition : initialPosition,
        countdown,
        isRacing: state === 'racing' || state === 'countdown',
        startRace,
        finishResults,
        aiPositions
    };
}