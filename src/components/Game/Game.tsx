import { useCallback, useEffect, useRef, useState } from "react";
import ChatRoom from "./components/ChatRoom";
import { useGameServer } from "./hooks/useGameServer";
import { useViewport } from './hooks/useViewport'
import { useRace } from './hooks/useRace'
import type { Actor, Position } from 'src/server/types/actor';
import GameActor from "./GameActor"
import { BACKGROUND_MUSIC } from '../../audio';
import MuteButton from "../MuteButton";
import { PerformancePanel } from "./PerformancePanel";
import { Pond, RainbowPuke, Farm } from "./components/GameElements";
import { Path, Rivers } from "./components/Environment";
import Beach from './components/Beach'
import { Minimap } from "../Minimap";
import Race from "../Race";
import IssuesField from "../IssuesField";
import * as Styled from './Game.style'
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../utils/coordinates';
import { rivers, introMessages } from './components/Environment/set';
import { isOnPath, isBlockedByRiver, isInStartBox, handleKeyDown, handleKeyUp } from "./utils";
import Clock from './components/Clock/Clock';
import ProbablyWood from "./components/ProbablyWood";
import { ScareCity } from './components/ScareCity';
import Hay from './components/Hay'
import { getAssetPath } from "src/utils/assetPath";

const { VITE_APP_NODE_ENV } = import.meta.env;
export const HORSE_SIZE = 100;
const attributeTypes = [
    'background', 'bodyAccessory', 'bodyColor', 'headAccessory',
    'hoofColor', 'mane', 'maneColor', 'pattern', 'patternColor',
    'tail', 'utility'
]

interface Props {
    tokenId?: number;
    token?: string;
    nfts: any[];
}

interface BuildingDimensions {
    width: number;
    height: number;
    left: number;
    top: number;
}

interface Message {
    message: string;
    account: string;
    createdAt?: string | number;
    timestamp?: number;
    avatar?: number;
}

const Game: React.FC<Props> = ({ tokenId, token, nfts }) => {
    const [activeKeys, setActiveKeys] = useState(new Set<string>());
    const [staticActors, setStaticActors] = useState<Actor[]>();
    const [isMuted, setIsMuted] = useState(false);
    const [showMetrics, setShowMetrics] = useState(false);
    const [buildingDimensions, setBuildingDimensions] = useState<Record<string, BuildingDimensions>>({});
    const [probablyWoodDimensions, setProbablyWoodDimensions] = useState<Record<string, BuildingDimensions>>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensionsReady, setDimensionsReady] = useState(false);
    const [viewportDimensions, setViewportDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    const [isOpen, setIsOpen] = useState<number>(-1);
    const [showMinimap, setShowMinimap] = useState(false);

    const { 
        connected,
        actors,
        introActive,
        player,
        position,
        hay,
        updatePosition,
        updatePlayerIntroStatus,
        gameSettings,
        metrics,
        block,
        scareCityState,
        scanTrait,
        messages,
        addMessage
    } = useGameServer({
        tokenId, token, onStaticActors: (actors: Actor[]) => setStaticActors(actors)
    });

    const [visibleMessages, setVisibleMessages] = useState<boolean[]>(
        new Array(introMessages.length).fill(false)
    );

    const handleMuteToggle = useCallback(() => {
        setIsMuted(prev => {
            const newMuted = !prev;
            BACKGROUND_MUSIC.muted = newMuted;
            return newMuted;
        });
    }, []);

    // Use race hook
    const {
        state: raceState,
        position: racePosition,
        isRacing,
        startRace,
        resetRace,
        countdown,
        finishResults,
        aiPositions,
    } = useRace({
        initialPosition: position || { x: 580, y: 2060, direction: 'right' },
        nfts,
        tokenId
    });

    useEffect(() => {
        if (isRacing) {
            if (finishResults.find(({ tokenId: id }) => id === tokenId) === undefined) {
                updatePosition({ ...racePosition, direction: 'right' })
            }
        }
    }, [raceState, racePosition])

    useEffect(() => {
        if (raceState === 'finished') {
            const horse = finishResults.find(({ tokenId: id }) => id === tokenId)
            horse && updatePlayerIntroStatus(finishResults)
        }
    }, [raceState])

    useEffect(() => {
       if (introActive && raceState === 'finished' && !visibleMessages[introMessages.length - 1]) {
            handleMessageTrigger(introMessages.length - 1)
        }
    }, [raceState, introActive])

    // Fade in first message after mount
    useEffect(() => {
        if (tokenId && tokenId >= 0) {
            const timer = setTimeout(() => {
                setVisibleMessages(prev => {
                    const next = [...prev];
                    next[0] = true;
                    return next;
                });
                
                if (VITE_APP_NODE_ENV === '!development') {
                    handleMuteToggle()
                } else {
                    BACKGROUND_MUSIC.play()
                }
            }, 500)
            return () => clearTimeout(timer);
        }
    }, [tokenId])

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'p') {
                setShowMetrics(prev => !prev);
            }
        };
        window.addEventListener('keypress', handleKeyPress);
        return () => window.removeEventListener('keypress', handleKeyPress);
    }, []);

    // Handle message triggers
    const handleMessageTrigger = useCallback((messageIndex: number) => {
        setVisibleMessages(prev => {
            if (prev[messageIndex]) return prev;
            const next = [...prev];
            next[messageIndex] = true;
            return next;
        });
        if (messageIndex === introMessages.length - 1) {
            setTimeout(() => { // Hide all message except the first one after the tutorial sequence
                setVisibleMessages(prev => {
                    const next = [...prev];
                    for (let i = 1; i < next.length; i++) {
                        next[i] = false;
                    }
                    return next;
                });
            }, 10000)
        }
    }, []);

    const keyDown = (e: KeyboardEvent) => handleKeyDown(e, setActiveKeys);
    const keyUp = (e: KeyboardEvent) => handleKeyUp(e, setActiveKeys);

    // Handle keyboard input
    useEffect(() => {
        if (!connected || !position) return;
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

                if (activeKeys.has('arrowleft')) {
                    newPosition.x -= speed;
                    newPosition.direction = 'left';
                    moved = true;
                }
                if (activeKeys.has('arrowright')) {
                    newPosition.x += speed;
                    newPosition.direction = 'right';
                    moved = true;
                }
                if (activeKeys.has('arrowup')) {
                    newPosition.y -= speed;
                    moved = true;
                }
                if (activeKeys.has('arrowdown')) {
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

                    // Don't allow movement during racing or countdown
                    if (raceState === 'racing' || raceState === 'countdown') {
                        return;
                    }

                    // Check for river collisions first - hard block
                    if (isBlockedByRiver(horseBox, rivers)) {
                        return;
                    }

                    // During intro, only allow movement if we overlap with a path
                    if (introActive) {
                        const path = isOnPath(horseBox)
                        if (path === -1) {
                            return;
                        } else {
                            const index = introMessages.findIndex(({ triggerSegment }) => triggerSegment === path)
                            if (index !== -1 && !visibleMessages[index]) {
                                handleMessageTrigger(index);
                            }
                        }
                    }

                    // Check if we entered the start box
                    if (raceState === 'not_started' && isInStartBox(horseBox)) {
                        updatePosition({ x: 580, y: 2060, direction: 'right' } as Position);
                        startRace();
                        return;
                    }

                    // Check if we entered the start box after race finished
                    if (raceState === 'finished' && isInStartBox(horseBox)) {
                        updatePosition({ x: 580, y: 2060, direction: 'right' } as Position);
                        resetRace();
                        return;
                    }

                    // Update position if all checks pass
                    updatePosition(newPosition);
                }
            }
            frameRef.current = requestAnimationFrame(updateFrame);
        };

        window.addEventListener('keydown', keyDown);
        window.addEventListener('keyup', keyUp);
        const frameRef = { current: requestAnimationFrame(updateFrame) };

        return () => {
            window.removeEventListener('keydown', keyDown);
            window.removeEventListener('keyup', keyUp);
            cancelAnimationFrame(frameRef.current);
        };
    }, [connected, position, gameSettings.movementSpeed, updatePosition]);

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
        edgeThreshold: 0.2
    });

    const getRecord = () => {
        const records = actors.filter(({ race }) => race !== undefined).sort((a: any, b: any) => a.race - b.race)
        return (
            <div>
                Track Record: {records.length > 0 ?
                (
                    <>
                        Horse #{records[0].id} - {records[0].race && records[0].race / 1000}s<br />
                        rider: {records[0].walletAddress}
                    </>
                ) : (
                    <>...<br />rider: ...</>
                )}
            </div>
        )
    }

    if (!dimensionsReady) {
        return <Styled.Container ref={containerRef} />;
    }

    return (
        <>
            <Styled.Container ref={containerRef}>
                {showMetrics && <PerformancePanel metrics={metrics} visible={true} />}
                <Styled.GameSpace style={style}>
                    <Path active={true} />
                    <Rivers active={true} />
                    <Farm left={1190} top={940} size={100} />
                    <Pond left={1040} top={510} />
                    <Pond left={40} top={2580} />
                    <RainbowPuke left={40} top={2580} />
                    <Beach />
                    <Clock block={block} />
                    <Styled.IssuesFieldContainer
                        style={{
                            transform: `scale(${1 / scale})`
                        }}
                    >
                        <IssuesField />
                    </Styled.IssuesFieldContainer>

                    {/* ScareCity component */}
                    {connected && player && (
                        <ScareCity 
                            nfts={nfts.filter(nft => nft.owner !== '0x0000000000000000000000000000000000000000')}
                            player={player}
                            gameData={scareCityState}
                            block={block}
                            attributeTypes={attributeTypes}
                            scanTrait={scanTrait}
                            onBuildingDimensions={(dimensions) => {
                                setBuildingDimensions(prev => ({
                                    ...prev,
                                    ...dimensions
                                }));
                            }}
                        />
                    )}

                    {/* Race component */}
                    <Race
                        aiHorses={aiPositions}
                        raceState={raceState}
                        countdown={countdown}
                        finishResults={finishResults}
                        nfts={nfts}
                    />
                    {/* Intro Messages */}
                    {introMessages.map((message, index) => (
                        <Styled.Message
                            key={`message-${index}`}
                            style={{
                                left: `${message.left}px`,
                                top: `${message.top}px`,
                                width: `${message.width}px`,
                                opacity: visibleMessages[index] ? 1 : 0
                            }}
                            dangerouslySetInnerHTML={{ __html: message.message }}
                        />
                    ))}
                    <Styled.Leaderboard style={{ 
                        left: 1050,
                        top: 1620,
                        width: 600
                    }}>
                        <b>🐎 {'Newb Island Race'} 🐎</b>
                        {getRecord()}
                    </Styled.Leaderboard>
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
                                    visible={true}
                                    asset={actor.type === 'player' ? nfts.find((nft: { tokenId: number; svg: string }) => nft.tokenId === actor.id) : undefined}
                                />
                            ))}
                        </>
                    )}
                    {/* Probably Wood */}
                    <ProbablyWood 
                        left={5500} 
                        top={1440} 
                        onElementDimensions={(dimensions: Record<string, BuildingDimensions>) => {
                            setProbablyWoodDimensions(dimensions);
                        }}
                    />
                </Styled.GameSpace>
                {position && showMinimap && (
                    <Minimap
                        viewportDimensions={viewportDimensions}
                        viewportOffset={offset}
                        scale={scale}
                        currentPosition={position}
                        actors={actors}
                        nfts={nfts}
                        block={block}
                        scareCityDimensions={buildingDimensions}
                        scareCityState={scareCityState}
                        probablyWoodDimensions={probablyWoodDimensions}
                    />
                )}
                {connected && player && (
                    <Hay hay={player.hay} />
                )}
            </Styled.Container>
            {connected && (
                <>
                    <h1>The Paddock</h1>
                    <Styled.Menu>
                        {['farm','noun-horse-6722191','noun-news-7120948'].map((img, i) => {
                            return (
                                <div 
                                    key={i} 
                                    style={{ 
                                        opacity: isOpen === i ? .5 : 1,
                                        cursor: isOpen === i ? 'default' : 'pointer'
                                    }}
                                    onClick={() => isOpen === i ? setIsOpen(-1) : setIsOpen(i) }
                                >
                                    <img src={getAssetPath(`/svg/${img}.svg`)}  />
                                </div>
                            )
                        })}
                        <div style={{
                                opacity: showMinimap ? .5 : 1,
                                cursor: 'pointer'
                            }} 
                            onClick={() => setShowMinimap(prevState => !prevState)}
                        >
                            <img src={getAssetPath('svg/noun-map-3047883.svg')} />
                        </div>
                        <div style={{
                                opacity: isMuted ? .5 : 1,
                                cursor: 'pointer'
                            }} 
                            onClick={handleMuteToggle}
                        >
                            <img src={getAssetPath('svg/noun-audio-2524823.svg')} />
                        </div>
                    </Styled.Menu>
                </>
            )}
            {connected && (
                <ChatRoom 
                    messages={messages || []}
                    {...{ nfts, setIsOpen }}
                    isOpen={isOpen}
                    onSendMessage={(message) => addMessage(message)}
                />
            )}
        </>
    );
};

export default Game;
