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
    tokenId?: number;  // Optional NFT token ID for view-only mode
    introActive?: boolean;
    modalOpen?: boolean;
    nfts: any;
    token: string;  // JWT token for socket authentication
}

// View mode when no tokenId is selected
const isViewMode = (tokenId: number | undefined): boolean => !tokenId;

// Environment configuration - handle various falsy values
const IS_SERVERLESS = import.meta.env.VITE_SERVERLESS?.toLowerCase() === 'true';

// AI horses for the race - using string tokenIds for Race component
const AI_HORSES = [
    { tokenId: '82', position: { x: 580, y: 1800 } },  // Stall 1 (1530 + 270)
    { tokenId: '186', position: { x: 580, y: 1930 } }   // Stall 2 (1660 + 270)
];

export const Paddock: React.FC<PaddockProps> = ({
    tokenId,
    introActive = true,
    modalOpen = false,
    nfts,
    token
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
    const [staticActors, setStaticActors] = useState<Actor[]>([]);  // Initialize with empty array
    // Create static actors callback once
    const handleStaticActors = useCallback((actors: Actor[]) => {
        setStaticActors(actors);
    }, []);

    // In view mode, don't connect to game server
    const { connected, actors, updatePosition, completeTutorial, gameSettings } = useGameServer(
        isViewMode(tokenId)
            ? { // View mode - no server connection
                tokenId: undefined,
                token: '',
                onStaticActors: handleStaticActors  // Use same callback
            }
            : { // Play mode - connect with tokenId
                tokenId: tokenId!,  // Safe to assert as we checked isViewMode
                token,
                onStaticActors: handleStaticActors  // Use same callback
            }
    );

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

    // Track path restriction state separately from visual intro state
    const [pathRestricted, setPathRestricted] = useState(introActive);

    // Find current player by matching NFT token ID
    const currentPlayer = actors.find(actor =>
        actor.type === 'player' &&
        actor.id === tokenId  // actor.id is number, tokenId is number
    );

    // Default view position
    const viewPosition = { x: 100, y: 150, direction: 'right' as const };

    // Use movement hook with disabled state when no tokenId
    const { position, viewportOffset } = useMovement({
        viewportWidth: viewportDimensions.width,
        viewportHeight: viewportDimensions.height,
        introActive: pathRestricted,
        movementDisabled: !tokenId || isRacing,
        onPositionChange: useCallback((pos: Position) => {
            if (!IS_SERVERLESS && connected && tokenId) {
                updatePosition(pos);
            }
        }, [IS_SERVERLESS, connected, updatePosition, tokenId]),
        onMessageTrigger: introActive ? handleMessageTrigger : undefined,
        forcePosition: !tokenId ? viewPosition : forcedPosition,  // Use view position without tokenId
        racingHorsePosition: racingPosition,
        serverPosition: currentPlayer?.position,
        actors,
        tokenId: tokenId || 0,  // Provide default to avoid undefined
        gameSettings
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

                {/* Race Track - only show in play mode */}
                {introActive && position && tokenId && (
                    <Race
                        playerHorse={{
                            tokenId: tokenId.toString(),
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
                        asset={actor.type === 'player' ? nfts.find((nft: { tokenId: number; svg: string }) => nft.tokenId === actor.id) : undefined}
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
