import React, { useEffect, useRef, useCallback, useState, memo } from "react";
import * as Styled from "./Paddock.style";
import { useMovement } from "./hooks/useMovement";
import { useZoom } from "./hooks/useZoom";
import { useGameServer } from "./hooks/useGameServer";
import { Position } from "../../server/types";
import { Actor } from "../../server/types/actor";
import Beach from "./components/Beach";
import IssuesField from "../IssuesField";
import { PathHighlight } from "./components/Environment";
import { Rivers, paths, rivers } from "./components/Environment";
import { raceElements, issuesColumns } from "../Bridleway/set";
import { introMessages } from "../Bridleway/messages";
import { Pond } from "./components/GameElements";
import { RainbowPuke } from "./components/GameElements";
import { Duck, Flower, Farm } from "./components/GameElements";
import MuteButton from "../MuteButton";
import Race from "../Race";
import { BACKGROUND_MUSIC } from '../../audio';
import { Minimap } from '../Minimap';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../utils/coordinates';
import { Z_LAYERS } from 'src/config/zIndex';
import { getAssetPath } from '../../utils/assetPath'
import { getImage } from '../../utils/getImage'

// Render game actors with smooth transitions
const GameActor = memo(({ actor, visible }: {
    actor: Actor;
    visible: boolean;
}) => (
    <img
        src={getAssetPath(getImage(actor.type, actor.id))}
        alt={`${actor.type} ${actor.id}`}
        style={{
            width: '100px',
            height: '100px',
            left: `${actor.position.x}px`,
            top: `${actor.position.y}px`,
            transform: `scaleX(${actor.position.direction === "right" ? 1 : -1})`,
            display: visible ? 'block' : 'none',
            position: 'absolute',
            willChange: 'transform',
            transition: 'all 0.1s linear',
            zIndex: Z_LAYERS.CHARACTERS,
        }}
    />
));

interface PaddockProps {
    horseId: string;
    introActive?: boolean;
    modalOpen?: boolean;
}

// Environment configuration - handle various falsy values
const IS_SERVERLESS = import.meta.env.VITE_SERVERLESS?.toLowerCase() === 'true';

// Define all restricted areas to avoid
const RESTRICTED_AREAS = [
    // Ponds (500x400 each)
    { left: 1040, top: 510, width: 500, height: 400 },
    { left: 40, top: 2580, width: 500, height: 400 },
    // Rivers
    ...rivers,
    // Bridleway paths
    ...paths.map(path => ({
        ...path,
        // Add 20px buffer around paths
        left: path.left - 20,
        top: path.top - 20,
        width: path.width + 40,
        height: path.height + 40
    })),
    // Race track elements
    ...raceElements,
    // Issues columns
    ...issuesColumns
];

interface RestrictedArea {
    left: number;
    top: number;
    width: number;
    height: number;
}

// Check if a position overlaps with any restricted area
const isInRestrictedArea = (x: number, y: number, size: number) => {
    return RESTRICTED_AREAS.some((area: RestrictedArea) => {
        // Check if any part of the flower overlaps with water
        return !(x + size < area.left || // flower is left of water
                x > area.left + area.width || // flower is right of water
                y + size < area.top || // flower is above water
                y > area.top + area.height); // flower is below water
    });
};

// Generate random flower positions (avoiding water)
const FLOWERS = Array.from({ length: 100 }, () => {
    let left, top, size;
    do {
        left = Math.random() * (WORLD_WIDTH - 200); // Leave space for flower size
        top = Math.random() * (WORLD_HEIGHT - 1000); // Keep away from beach
        size = 100 + Math.random() * 100;
    } while (isInRestrictedArea(left, top, size));
    
    return {
        left,
        top,
        size,
        rotation: 0
    };
});

// AI horses for the race
const AI_HORSES = [
    { tokenId: "82", position: { x: 580, y: 1800 } },  // Stall 1 (1530 + 270)
    { tokenId: "186", position: { x: 580, y: 1930 } }   // Stall 2 (1660 + 270)
];

export const Paddock: React.FC<PaddockProps> = ({
    horseId,
    introActive = true,
    modalOpen = false
}) => {
    const [isMuted, setIsMuted] = useState(false);
    const [debugMode, setDebugMode] = useState(false);

    // Debug mode hotkey
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === '9') {
                setDebugMode(prev => {
                    const newDebugMode = !prev;
                    if (newDebugMode && !isMuted) {
                        handleMuteToggle();
                    }
                    return newDebugMode;
                });
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    // Handle audio mute/unmute
    const handleMuteToggle = useCallback(() => {
        setIsMuted(prev => {
            const newMuted = !prev;
            BACKGROUND_MUSIC.muted = newMuted;
            return newMuted;
        });
    }, []);

    const containerRef = useRef<HTMLDivElement>(null);
    const [viewportDimensions, setViewportDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const [dimensionsReady, setDimensionsReady] = useState(false);
    const [visibleMessages, setVisibleMessages] = useState<boolean[]>(
        new Array(introMessages.length).fill(false)
    );

    // Fade in first message after mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setVisibleMessages(prev => {
                const next = [...prev];
                next[0] = true;
                return next;
            });
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const [isRacing, setIsRacing] = useState(false);
    const [forcedPosition, setForcedPosition] = useState<Position | undefined>();
    const [racingPosition, setRacingPosition] = useState<{ x: number; y: number } | undefined>();

    // Initialize game server connection
    const { connected, actors, updatePosition, completeTutorial } = useGameServer({
        horseId
    });

    // Handle message triggers
    const handleMessageTrigger = useCallback((messageIndex: number) => {
        setVisibleMessages(prev => {
            if (prev[messageIndex]) return prev;
            const next = [...prev];
            next[messageIndex] = true;
            return next;
        });
    }, []);

    // Handle race state changes
    const handleRaceStateChange = useCallback((state: 'countdown' | 'racing' | 'finished') => {
        if (state === 'countdown') {
            setIsRacing(true);
            const finishPosition = { x: 1990, y: 2060, direction: 'right' as const };
            setForcedPosition(finishPosition);
            if (!IS_SERVERLESS) {
                updatePosition(finishPosition);
            }
        } else if (state === 'racing') {
            setIsRacing(true);
        } else if (state === 'finished') {
            // Clear race state
            setForcedPosition(undefined);
            setRacingPosition(undefined);
            setIsRacing(false);
            
            // Complete tutorial and remove path restrictions
            completeTutorial();
            setPathRestricted(false);
            
            // Show final message
            setVisibleMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = true;
                return next;
            });

            setTimeout(() => {
                setVisibleMessages(prev => {
                    const next = [...prev];
                    for (let i = 1; i < next.length; i++) {
                        next[i] = false;
                    }
                    return next;
                });
            }, 10000);
        }
    }, [IS_SERVERLESS, updatePosition]);

    // Track introActive state
    // Track path restriction state separately from visual intro state
    const [pathRestricted, setPathRestricted] = useState(introActive);

    // Initialize movement with current viewport dimensions
    // Find current player in actors
    const currentPlayer = actors.find(actor => actor.type === 'player' && actor.id === horseId);

    const { position, viewportOffset } = useMovement({
        viewportWidth: viewportDimensions.width,
        viewportHeight: viewportDimensions.height,
        introActive: debugMode ? false : pathRestricted,
        movementDisabled: debugMode ? false : (isRacing || modalOpen),
        onPositionChange: useCallback((pos: Position) => {
            if (!IS_SERVERLESS && connected) {
                updatePosition(pos);
            }
        }, [IS_SERVERLESS, connected, updatePosition]),
        onMessageTrigger: introActive && !debugMode ? handleMessageTrigger : undefined,
        forcePosition: debugMode ? undefined : forcedPosition,
        racingHorsePosition: racingPosition,
        serverPosition: currentPlayer?.position,
        actors,
        horseId
    });

    // Initialize zoom control
    const { scale, zoomOrigin } = useZoom({
        minScale: 0.2,
        maxScale: 1.5,
        position,
        viewportOffset,
        viewportDimensions
    });

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

    if (!dimensionsReady) {
        return <Styled.Container ref={containerRef} />;
    }

    return (
        <Styled.Container ref={containerRef}>
            <MuteButton isMuted={isMuted} onToggle={handleMuteToggle} />
            <Styled.GameSpace
                style={{
                    transform: `scale(${scale}) translate(${-viewportOffset.x}px, ${-viewportOffset.y}px)`,
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`
                }}
            >
                {/* Beach with viewport-aware animation */}
                <Beach
                    viewportOffset={viewportOffset}
                    viewportDimensions={viewportDimensions}
                />

                {/* Bridleway Path and Rivers */}
                <PathHighlight active={introActive} />
                <Rivers active={true} />

                {/* Path Labels - show regardless of intro state */}
                {paths.map((path, index) => (
                    <Styled.PathLabel
                        key={`label-${index}`}
                        style={{
                            left: `${path.left}px`,
                            top: `${path.top}px`,
                            width: `${path.width}px`,
                            height: `${path.height}px`
                        }}
                    >
                        {index + 1}
                    </Styled.PathLabel>
                ))}

                {/* Intro Messages */}
                {introActive && introMessages.map((message, index) => (
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

                {/* Random flowers scattered around the paddock */}
                {FLOWERS.map((flower, index) => (
                    <Flower
                        key={`flower-${index}`}
                        left={flower.left}
                        top={flower.top}
                        size={flower.size}
                        rotation={flower.rotation}
                    />
                ))}

                {/* Farm Pond and RainbowPuke Falls */}
                <Pond left={1040} top={510} />
                {/* Farm below top pond */}
                <Farm left={1190} top={940} size={100} />
                <Pond left={40} top={2580} />
                <RainbowPuke left={40} top={2580} />

                {/* Race Track */}
                {introActive && position && (
                    <Race
                        playerHorse={{
                            tokenId: horseId,
                            position: { x: position.x, y: position.y }
                        }}
                        aiHorses={AI_HORSES}
                        onStateChange={handleRaceStateChange}
                        onRacingPositionChange={setRacingPosition}
                    />
                )}

                {/* Issues Field */}
                <Styled.IssuesFieldContainer
                    style={{
                        transform: `scale(${1 / scale})`
                    }}
                >
                    <IssuesField />
                </Styled.IssuesFieldContainer>

                {/* Game Actors */}
                {actors.map((actor) => (
                    <GameActor
                        key={actor.id}
                        actor={actor}
                        visible={!isRacing || actor.type !== 'player'}
                    />
                ))}
            </Styled.GameSpace>

            {/* Minimap */}
            {position && (
                <Minimap
                    viewportOffset={viewportOffset}
                    viewportDimensions={viewportDimensions}
                    scale={scale}
                    currentPosition={position}
                    otherPlayers={actors}
                    isServerless={IS_SERVERLESS}
                    horseId={horseId}
                />
            )}
        </Styled.Container>
    );
};
