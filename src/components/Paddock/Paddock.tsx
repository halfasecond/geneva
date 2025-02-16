import React, { useEffect, useRef, useCallback, useState, memo } from "react";
import * as Styled from "./Paddock.style";
import { useMovement } from "./hooks/useMovement";
import { useZoom } from "./hooks/useZoom";
import { useGameServer } from "./hooks/useGameServer";
import { Position } from "../../server/types";
import { Actor } from "../../server/types/actor";
import Beach from "./components/Beach";
import IssuesField from "../IssuesField";
import { PathHighlight, Rivers, paths } from "./components/Environment";
import { introMessages } from "../Bridleway/messages";
import { Pond, RainbowPuke, Farm } from "./components/GameElements";
import MuteButton from "../MuteButton";
import Race from "../Race";
import { BACKGROUND_MUSIC } from '../../audio';
import { Minimap } from '../Minimap';
import { Z_LAYERS } from 'src/config/zIndex';
import { getAssetPath } from '../../utils/assetPath'
import { getImage, getSVG } from '../../utils/getImage'




// Render game actors with smooth transitions
const GameActor = memo(({ actor, visible, asset }: {
    actor: Actor;
    visible: boolean;
    asset: any,
}) => actor.type === 'player' ? (
        <img
            src={asset?.svg ? getSVG(asset.svg) : ''}
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
    ) : (
        <img
            src={getAssetPath(getImage(actor.type, actor.id))}
            alt={`${actor.type} ${actor.id}`}
            style={{
                width: actor.type === 'flower of goodwill' && actor.size ? `${actor.size}px` : '100px',
                height: actor.type === 'flower of goodwill' && actor.size ? `${actor.size}px` : '100px',
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
    )
);

interface PaddockProps {
    tokenId: number;  // NFT token ID that identifies the player
    introActive?: boolean;
    modalOpen?: boolean;
    nfts: any;
}

// Environment configuration - handle various falsy values
const IS_SERVERLESS = import.meta.env.VITE_SERVERLESS?.toLowerCase() === 'true';

// AI horses for the race
const AI_HORSES = [
    { tokenId: 82, position: { x: 580, y: 1800 } },  // Stall 1 (1530 + 270)
    { tokenId: 186, position: { x: 580, y: 1930 } }   // Stall 2 (1660 + 270)
];

export const Paddock: React.FC<PaddockProps> = ({
    tokenId,
    introActive = true,
    modalOpen = false,
    nfts
}) => {
    const [isMuted, setIsMuted] = useState(false);

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
    const [staticActors, setStaticActors] = useState<Actor[]>([]);
    const { connected, actors, updatePosition, completeTutorial } = useGameServer({
        tokenId,  // Pass tokenId to game server
        onStaticActors: useCallback((actors: Actor[]) => {
            setStaticActors(actors);
        }, [])
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
    // Find current player by matching NFT token ID
    const currentPlayer = actors.find(actor =>
        actor.type === 'player' &&
        actor.id === tokenId  // actor.id is number, tokenId is number
    );

    const { position, viewportOffset } = useMovement({
        viewportWidth: viewportDimensions.width,
        viewportHeight: viewportDimensions.height,
        introActive: pathRestricted,
        movementDisabled: (isRacing || modalOpen),
        onPositionChange: useCallback((pos: Position) => {
            if (!IS_SERVERLESS && connected) {
                updatePosition(pos);
            }
        }, [IS_SERVERLESS, connected, updatePosition]),
        onMessageTrigger: introActive ? handleMessageTrigger : undefined,
        forcePosition: forcedPosition,
        racingHorsePosition: racingPosition,
        serverPosition: currentPlayer?.position,
        actors,
        tokenId
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
                {/* Beach with continuous animation */}
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

                <Farm left={1190} top={940} size={100} />
                <Pond left={1040} top={510} />
                <Pond left={40} top={2580} />
                <RainbowPuke left={40} top={2580} />

                {/* Race Track */}
                {introActive && position && (
                    <Race
                        playerHorse={{
                            tokenId: tokenId.toString(), // Convert to string for Race component
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

                {/* Static Actors (flowers) */}
                {staticActors.map((actor, i) => (
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
                        visible={!isRacing || actor.type !== 'player'}
                        asset={actor.type === 'player' ? nfts.find(nft => nft.tokenId === actor.id) : undefined}
                    />
                ))}
            </Styled.GameSpace>

            {/* Minimap */}
            {position && (
                <Minimap
                    viewportDimensions={viewportDimensions}
                    viewportOffset={viewportOffset}
                    scale={scale}
                    currentPosition={position}
                    tokenId={tokenId}
                    actors={actors}
                    nfts={nfts}
                    otherPlayers={actors}
                    isServerless={IS_SERVERLESS}
                />
            )}
        </Styled.Container>
    );
};
