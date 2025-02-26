import { useState, useEffect } from 'react';
import { Position } from '../../../server/types/actor';
import { RaceState } from '../utils';

interface UseRaceOptions {
    initialPosition: Position;
    nfts: any[];
    tokenId: number | undefined;
}

const getTwoRandomHorses = (tokenId, nfts) => {
    // Filter out NFTs that match the tokenId or have an invalid owner
    const validNFTs = nfts.filter(nft => nft.tokenId !== tokenId && nft.owner !== '0x0000000000000000000000000000000000000000');
  
    if (validNFTs.length < 2) {
      // Not enough valid NFTs to choose two unique ones
      return [];
    }
  
    // Shuffle the array using the Fisher-Yates algorithm
    for (let i = validNFTs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [validNFTs[i], validNFTs[j]] = [validNFTs[j], validNFTs[i]];
    }
  
    // Return the tokenIds of the first two NFTs from the shuffled list
    return [validNFTs[0].tokenId, validNFTs[1].tokenId];
};

const getOpponents = (tokenId: number, nfts: any[]) => {
    const opponents = getTwoRandomHorses(tokenId, nfts)
    return opponents.map((tokenId, i) => (
        { tokenId, position: { x: 580, y: 1800 + (i * 130) } }
    ))
}

export function useRace({ initialPosition, nfts, tokenId }: UseRaceOptions) {
    // Race state
    const [state, setState] = useState<RaceState>('not_started');
    const [racePosition, setRacePosition] = useState(initialPosition);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [finishResults, setFinishResults] = useState<{ tokenId: string | number, time: number}[]>([]);
    
    // AI horses state
    const positions = getOpponents(tokenId, nfts)
    const [aiPositions, setAiPositions] = useState(positions);

    // Handle state changes
    const updateState = (newState: RaceState) => {
        setState(newState);
    };

    // Reset race
    const resetRace = () => {
        setState('not_started');
        setRacePosition(initialPosition);
        setCountdown(null);
        setFinishResults([]);
        const positions = getOpponents(tokenId, nfts)
        setAiPositions(positions);
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
        resetRace,
        finishResults,
        aiPositions
    };
}