import { useEffect, useRef, useState } from "react";
import { useGameServer } from "./hooks/useGameServer";
import { useViewport } from './hooks/useViewport'
import { useRace } from './hooks/useRace'
import type { Actor, Position } from 'src/server/types/actor';
import GameActor from "./GameActor"
import { PerformancePanel } from "./PerformancePanel";
import { Pond, RainbowPuke, Farm } from "./components/GameElements";
import { Path, Rivers } from "./components/Environment";
import Beach from './components/Beach'
import { Minimap } from "../Minimap";
import Race from "../Race";
import IssuesField from "../IssuesField";
import * as Styled from './Game.style'
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../utils/coordinates';
import { rivers } from '../Paddock/components/Environment/set';
import { isOnPath, isBlockedByRiver, isInStartBox, RaceState } from "./utils";

const HORSE_SIZE = 100;

interface Props {
    tokenId?: number;
    nfts: any;
    token: string;
}

const Game: React.FC<Props> = ({ tokenId, token, nfts }) => {
    // Track active keys
    const [activeKeys, setActiveKeys] = useState(new Set<string>());
    const [staticActors, setStaticActors] = useState<Actor[]>();

    const { connected, actors, position, updatePosition, gameSettings, metrics } = useGameServer({
        tokenId, token, onStaticActors: (actors: Actor[]) => setStaticActors(actors)
    });

    // Use race hook
    const {
        state: raceState,
        position: racePosition,
        isRacing,
        startRace,
        countdown,
        finishResults,
        aiPositions,
    } = useRace({
        initialPosition: position || { x: 580, y: 2060, direction: 'right' },
        tokenId
    });

    useEffect(() => {
        if (tokenId && finishResults.length > 0) {
            updatePosition(racePosition)
        }
    }, [finishResults, tokenId])

    // Handle keyboard input
    useEffect(() => {
        if (!connected || !position) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return; // Ignore key repeat
            const key = e.key.toLowerCase();
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
                e.preventDefault();
                setActiveKeys(prev => new Set([...prev, key]));
            }
            if (['r'].includes(key)) {
                updatePosition({ x: 180, y: 2060, direction: 'right' } as Position)
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
                e.preventDefault();
                setActiveKeys(prev => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
            }
        };

        let lastTime = performance.now();
        const targetFPS = 60;
        const frameTime = 1000 / targetFPS;

        // Update position based on active keys with frame timing
        const updateFrame = (currentTime: number) => {
            const deltaTime = currentTime - lastTime;
            
            if (activeKeys.size > 0 && deltaTime >= frameTime) {
                const frames = deltaTime / frameTime;
                const speed = gameSettings.movementSpeed * frames;
                lastTime = currentTime - (deltaTime % frameTime);

                let newPosition = { ...position };
                let moved = false;

                if (activeKeys.has('arrowleft') || activeKeys.has('a')) {
                    newPosition.x -= speed;
                    newPosition.direction = 'left';
                    moved = true;
                }
                if (activeKeys.has('arrowright') || activeKeys.has('d')) {
                    newPosition.x += speed;
                    newPosition.direction = 'right';
                    moved = true;
                }
                if (activeKeys.has('arrowup') || activeKeys.has('w')) {
                    newPosition.y -= speed;
                    moved = true;
                }
                if (activeKeys.has('arrowdown') || activeKeys.has('s')) {
                    newPosition.y += speed;
                    moved = true;
                }

                if (moved) {
                    // Keep within world bounds, accounting for horse size
                    newPosition.x = Math.max(0, Math.min(newPosition.x, WORLD_WIDTH - HORSE_SIZE));
                    newPosition.y = Math.max(0, Math.min(newPosition.y, WORLD_HEIGHT - HORSE_SIZE));

                    // Check for collisions before updating position
                    const horseBox = {
                        left: newPosition.x,
                        right: newPosition.x + HORSE_SIZE,
                        top: newPosition.y,
                        bottom: newPosition.y + HORSE_SIZE
                    };

                    // Get intro state from current player
                    const currentPlayer = actors.find(actor => actor.type === 'player' && actor.id === tokenId);
                    const isIntroActive = Boolean(currentPlayer?.introActive) && raceState !== 'finished';

                    // Don't allow movement during racing
                    if (raceState === 'racing' || raceState === 'countdown') {
                        return;
                    }

                    // Check for river collisions first - hard block
                    if (isBlockedByRiver(horseBox, rivers)) {
                        return;
                    }

                    // During intro, only allow movement if we overlap with a path
                    if (isIntroActive && !isOnPath(horseBox)) {
                        return;
                    }

                    // Check if we entered the start box
                    if (raceState === 'not_started' && isInStartBox(horseBox)) {
                        updatePosition({ x: 580, y: 2060, direction: 'right' } as Position);
                        startRace();
                        return;
                    }

                    // Update position if all checks pass
                    updatePosition(newPosition);
                }
            }
            frameRef.current = requestAnimationFrame(updateFrame);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        const frameRef = { current: requestAnimationFrame(updateFrame) };

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(frameRef.current);
        };
    }, [connected, position, gameSettings.movementSpeed, updatePosition]);

    const containerRef = useRef<HTMLDivElement>(null);
    const [viewportDimensions, setViewportDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const [dimensionsReady, setDimensionsReady] = useState(false);
    
    // Update viewport dimensions on resize and initial mount
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                if (clientWidth > 0 && clientHeight > 0) {
                    setViewportDimensions({
                        width: clientWidth,
                        height: clientHeight
                    });
                    setDimensionsReady(true);
                }
            }
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    // Initialize viewport control - center immediately when racing
    const { scale, style, offset } = useViewport({
        position: isRacing ? racePosition : position,
        dimensions: viewportDimensions,
        minScale: 0.2,
        maxScale: 1.5,
        trackMovement: isRacing,
        edgeThreshold: 0.2 // No edge threshold during race
    });

    if (!dimensionsReady) {
        return <Styled.Container ref={containerRef} />;
    }

    return (
        <Styled.Container ref={containerRef}>
            <PerformancePanel metrics={metrics} visible={true} />
            <Styled.GameSpace style={style}>
                <Path active={true} />
                <Rivers active={true} />
                <Farm left={1190} top={940} size={100} />
                <Pond left={1040} top={510} />
                <Pond left={40} top={2580} />
                <RainbowPuke left={40} top={2580} />
                <Beach />
                <Styled.IssuesFieldContainer
                    style={{
                        transform: `scale(${1 / scale})`
                    }}
                >
                    <IssuesField />
                </Styled.IssuesFieldContainer>

                {/* Race component */}
                <Race
                    playerHorse={{
                        tokenId: tokenId?.toString() || '',
                        position: isRacing ? racePosition : position || { x: 580, y: 2060 }
                    }}
                    aiHorses={aiPositions}
                    raceState={raceState}
                    countdown={countdown}
                    finishResults={finishResults}
                />
                {connected && (
                    <>
                        {/* Static Actors */}
                        {staticActors && staticActors.map((actor, i) => (
                            <GameActor
                                key={`static-${i}`}
                                actor={actor}
                                visible={true}
                                asset={undefined}
                            />
                        ))}
                        {/* Dynamic Actors (players, ducks) */}
                        {actors.map((actor, i) => (
                            <GameActor
                                key={`dynamic-${i}`}
                                actor={actor}
                                visible={!(raceState === 'racing' && actor.type === 'player' && actor.id === tokenId)}
                                asset={actor.type === 'player' ? nfts.find((nft: { tokenId: number; svg: string }) => nft.tokenId === actor.id) : undefined}
                            />
                        ))}
                    </>
                )}
            </Styled.GameSpace>
            {position && (
                <Minimap
                    viewportDimensions={viewportDimensions}
                    viewportOffset={offset}
                    scale={scale}
                    currentPosition={position}
                    actors={actors}
                    nfts={nfts}
                />
            )}
        </Styled.Container>
    )
}

export default Game