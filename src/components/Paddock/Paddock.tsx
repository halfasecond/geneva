import React, { useEffect, useRef, useCallback, useState } from "react";
import * as Styled from "./Paddock.style";
import { useMovement } from "./hooks/useMovement";
import { useZoom } from "./hooks/useZoom";
import { useGameServer } from "./hooks/useGameServer";
import { Position } from "../../server/types";
import IssuesField from "../IssuesField";
import { PathHighlight } from "../Bridleway";
import { Rivers } from "../Rivers";
import { paths, raceElements, pond, issuesColumns } from "../Bridleway/set";
import { rivers } from "../Rivers";
import { introMessages } from "../Bridleway/messages";
import Pond from "../Pond";
import RainbowPuke from "../RainbowPuke";
import Race from "../Race";

interface PaddockProps {
    horseId: string;
    initialPosition?: Position;
    introActive?: boolean;
}

// Environment configuration - handle various falsy values
const IS_SERVERLESS = import.meta.env.VITE_SERVERLESS?.toLowerCase() === 'true';
console.log('Paddock VITE_SERVERLESS:', import.meta.env.VITE_SERVERLESS);

// AI horses for the race
const AI_HORSES = [
    { tokenId: "30", position: { x: 580, y: 1800 } },  // Stall 1 (1530 + 270)
    { tokenId: "31", position: { x: 580, y: 1930 } }   // Stall 2 (1660 + 270)
];

export const Paddock: React.FC<PaddockProps> = ({ 
    horseId,
    initialPosition = { x: 100, y: 150, direction: "right" as const },  // Default game start position
    introActive = true
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [viewportDimensions, setViewportDimensions] = React.useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const [dimensionsReady, setDimensionsReady] = React.useState(false);
    const [visibleMessages, setVisibleMessages] = React.useState<boolean[]>(
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
        }, 500);  // Small delay before fade in
        return () => clearTimeout(timer);
    }, []);
    const [isRacing, setIsRacing] = useState(false);
    const [forcedPosition, setForcedPosition] = useState<Position | undefined>();
    const [racingPosition, setRacingPosition] = useState<{ x: number; y: number } | undefined>();

    // Initialize game server connection
    const { connected, players, updatePosition } = useGameServer({
        horseId,
        initialPosition
    });

    // Handle message triggers
    const handleMessageTrigger = useCallback((messageIndex: number) => {
        setVisibleMessages(prev => {
            if (prev[messageIndex]) return prev; // Already visible
            const next = [...prev];
            next[messageIndex] = true;
            return next;
        });
    }, []);

    // Handle race state changes
    const handleRaceStateChange = useCallback((state: 'countdown' | 'racing' | 'finished') => {
        if (state === 'countdown') {
            setIsRacing(true);  // Disable movement during countdown
            // Set position to finish line immediately since horse is hidden anyway
            const finishPosition = { x: 1990, y: 2060, direction: 'right' as const };  // -10px
            setForcedPosition(finishPosition);
            if (!IS_SERVERLESS) {
                updatePosition(finishPosition);
            }
        } else if (state === 'racing') {
            setIsRacing(true);  // Keep movement disabled during race
        } else if (state === 'finished') {
            // Clear forced position, racing position, re-enable movement, and show completion
            setForcedPosition(undefined);
            setRacingPosition(undefined);
            setIsRacing(false);
            // Show completion message when movement and path restrictions are lifted
            setVisibleMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = true;  // Show last message (completion)
                return next;
            });
            // Fade out all messages except first one after 10 seconds
            setTimeout(() => {
                setVisibleMessages(prev => {
                    const next = [...prev];
                    // Keep first message (index 0) visible
                    for (let i = 1; i < next.length; i++) {
                        next[i] = false;
                    }
                    return next;
                });
            }, 10000);
        }
    }, [IS_SERVERLESS, updatePosition, setVisibleMessages]);

    // Initialize movement with current viewport dimensions
    const { position, viewportOffset } = useMovement({
        viewportWidth: viewportDimensions.width,
        viewportHeight: viewportDimensions.height,
        initialPosition,
        introActive: introActive,
        movementDisabled: isRacing,  // Disable movement during race
        onPositionChange: useCallback((pos: Position) => {
            if (!IS_SERVERLESS && connected) {
                updatePosition(pos);
            }
        }, [IS_SERVERLESS, connected, updatePosition]),
        onMessageTrigger: introActive ? handleMessageTrigger : undefined,
        forcePosition: forcedPosition,
        racingHorsePosition: racingPosition  // Pass racing position for viewport tracking
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

        // Initial update
        updateDimensions();
        
        // Update on resize
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    if (!dimensionsReady) {
        return <Styled.Container ref={containerRef} />;
    }

    return (
        <Styled.Container ref={containerRef}>
            <Styled.GameSpace 
                style={{
                    transform: `scale(${scale}) translate(${-viewportOffset.x}px, ${-viewportOffset.y}px)`,
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`
                }}
            >
                {/* Bridleway Path and Rivers */}
                <PathHighlight active={introActive} />
                <Rivers active={true} />

                {/* Path Labels - show regardless of intro state */}
                {paths.map((path, index) => (
                    <Styled.PathLabel
                        key={`label-${index}`}
                        left={path.left}
                        top={path.top}
                        width={path.width}
                        height={path.height}
                    >
                        {index + 1}
                    </Styled.PathLabel>
                ))}

                {/* Intro Messages */}
                {introActive && introMessages.map((message, index) => (
                    <Styled.Message
                        key={`message-${index}`}
                        left={message.left}
                        top={message.top}
                        width={message.width}
                        opacity={visibleMessages[index] ? 1 : 0}
                        dangerouslySetInnerHTML={{ __html: message.message }}
                    />
                ))}

                {/* Farm Pond and RainbowPuke Falls */}
                <Pond left={1040} top={510} />
                <Pond left={40} top={2500} />
                <RainbowPuke left={40} top={2500} />

                {/* Race Track */}
                {introActive && (
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
                <Styled.IssuesFieldContainer scale={scale}>
                    <IssuesField />
                </Styled.IssuesFieldContainer>

                {/* Current player - hide during racing */}
                {!isRacing && (
                    <Styled.Horse
                        style={{
                            left: `${position.x}px`,
                            top: `${position.y}px`,
                            transform: `scaleX(${position.direction === "right" ? 1 : -1})`
                        }}
                    >
                        <img src={`/horse/${horseId}.svg`} alt={`#${horseId}`} />
                    </Styled.Horse>
                )}

                {/* Other players - only show in non-serverless mode */}
                {!IS_SERVERLESS && Array.from(players.entries()).map(([id, player]) => {
                    if (id === horseId) return null; // Skip current player
                    return (
                        <Styled.Horse
                            key={id}
                            style={{
                                left: `${player.position.x}px`,
                                top: `${player.position.y}px`,
                                transform: `scaleX(${player.position.direction === "right" ? 1 : -1})`
                            }}
                        >
                            <img src={`/horse/${id}.svg`} alt={`Horse ${id}`} />
                        </Styled.Horse>
                    );
                })}
            </Styled.GameSpace>

            {/* Minimap */}
            <Styled.Minimap>
                {/* Bridleway paths and rivers on minimap - always visible */}
                {[...paths, ...rivers].map((segment, index) => (
                    <Styled.MinimapElement
                        key={index}
                        style={{
                            position: 'absolute',
                            background: segment.backgroundColor === '#37d7ff' 
                                ? segment.backgroundColor 
                                : 'rgba(238, 238, 238, 0.5)',
                            left: `${(segment.left / 5000) * 200}px`,
                            top: `${(segment.top / 5000) * 200}px`,
                            width: `${(segment.width / 5000) * 200}px`,
                            height: `${(segment.height / 5000) * 200}px`
                        }}
                    />
                ))}

                {/* Pond and RainbowPuke Falls */}
                <Styled.MinimapElement
                    style={{
                        position: 'absolute',
                        background: pond.backgroundColor,
                        left: `${(pond.left / 5000) * 200}px`,
                        top: `${(pond.top / 5000) * 200}px`,
                        width: `${(pond.width / 5000) * 200}px`,
                        height: `${(pond.height / 5000) * 200}px`
                    }}
                />
                <Styled.MinimapElement
                    style={{
                        position: 'absolute',
                        background: pond.backgroundColor,
                        left: `${(40 / 5000) * 200}px`,
                        top: `${(2500 / 5000) * 200}px`,
                        width: `${(500 / 5000) * 200}px`,
                        height: `${(340 / 5000) * 200}px`
                    }}
                />

                {/* Issues Field Columns */}
                {issuesColumns.map((column, index) => (
                    <Styled.MinimapElement
                        key={`column-${index}`}
                        style={{
                            position: 'absolute',
                            background: column.backgroundColor,
                            left: `${(column.left / 5000) * 200}px`,
                            top: `${(column.top / 5000) * 200}px`,
                            width: `${(column.width / 5000) * 200}px`,
                            height: `${(column.height / 5000) * 200}px`
                        }}
                    />
                ))}

                {/* Race Track Elements */}
                {raceElements.map((element, index) => (
                    <Styled.MinimapElement
                        key={`race-${index}`}
                        style={{
                            position: 'absolute',
                            background: element.backgroundColor,
                            left: `${(element.left / 5000) * 200}px`,
                            top: `${(element.top / 5000) * 200}px`,
                            width: `${(element.width / 5000) * 200}px`,
                            height: `${(element.height / 5000) * 200}px`
                        }}
                    />
                ))}

                {/* Current player */}
                <Styled.MinimapElement
                    style={{
                        position: 'absolute',
                        width: '4px',
                        height: '4px',
                        background: 'red',
                        borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                        left: `${(position.x / 5000) * 200}px`,
                        top: `${(position.y / 5000) * 200}px`
                    }}
                />

                {/* Other players - only show in non-serverless mode */}
                {!IS_SERVERLESS && Array.from(players.entries()).map(([id, player]) => {
                    if (id === horseId) return null;
                    return (
                        <Styled.MinimapElement
                            key={id}
                            style={{
                                position: 'absolute',
                                width: '4px',
                                height: '4px',
                                background: 'red',
                                borderRadius: '50%',
                                transform: 'translate(-50%, -50%)',
                                left: `${(player.position.x / 5000) * 200}px`,
                                top: `${(player.position.y / 5000) * 200}px`
                            }}
                        />
                    );
                })}

                <Styled.ViewportIndicator
                    x={viewportOffset.x}
                    y={viewportOffset.y}
                    width={viewportDimensions.width}
                    height={viewportDimensions.height}
                    scale={scale}
                />
            </Styled.Minimap>
        </Styled.Container>
    );
};
