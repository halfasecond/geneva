import React, { useEffect, useRef, useCallback, useState } from "react";
import * as Styled from "./Paddock.style";
import { useMovement } from "./hooks/useMovement";
import { useZoom } from "./hooks/useZoom";
import { useGameServer } from "./hooks/useGameServer";
import { Position } from "../../server/types";
import IssuesField from "../IssuesField";
import { PathHighlight } from "../Bridleway";
import { paths } from "../Bridleway/set";
import { introMessages } from "../Bridleway/messages";
import Pond from "../Pond";
import Race from "../Race";

interface PaddockProps {
    horseId: string;
    initialPosition?: Position;
    introActive?: boolean;
}

// AI horses for the race
const AI_HORSES = [
    { tokenId: "30", position: { x: 580, y: 1800 } },  // Stall 1 (1530 + 270)
    { tokenId: "31", position: { x: 580, y: 1930 } }   // Stall 2 (1660 + 270)
];

export const Paddock: React.FC<PaddockProps> = ({ 
    horseId,
    // Position near the end of the last bridleway section for faster testing
    initialPosition = { x: 300, y: 2068, direction: "right" as const },
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
    const [isRacing, setIsRacing] = useState(false);
    const [forcedPosition, setForcedPosition] = useState<Position | undefined>();

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
            const finishPosition = { x: 1990, y: 2070, direction: 'right' as const };
            setForcedPosition(finishPosition);
            updatePosition(finishPosition);
        } else if (state === 'racing') {
            setIsRacing(true);  // Keep movement disabled during race
        } else if (state === 'finished') {
            // Clear forced position and re-enable movement
            setForcedPosition(undefined);
            setIsRacing(false);
        }
    }, [updatePosition]);

    // Initialize movement with current viewport dimensions
    const { position, viewportOffset } = useMovement({
        viewportWidth: viewportDimensions.width,
        viewportHeight: viewportDimensions.height,
        scale: 1,
        initialPosition,
        introActive: introActive,
        movementDisabled: isRacing,  // Disable movement during race
        onPositionChange: useCallback((pos: Position) => {
            if (connected) {
                updatePosition(pos);
            }
        }, [connected, updatePosition]),
        onMessageTrigger: introActive ? handleMessageTrigger : undefined,
        forcePosition: forcedPosition
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
                {/* Bridleway Path - only show when intro is active */}
                <PathHighlight active={introActive} />

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

                {/* Farm Pond */}
                <Pond left={1040} top={510} />

                {/* Race Track */}
                {introActive && (
                    <Race
                        playerHorse={{
                            tokenId: horseId,
                            position: { x: position.x, y: position.y }
                        }}
                        aiHorses={AI_HORSES}
                        onStateChange={handleRaceStateChange}
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

                {/* Other players */}
                {Array.from(players.entries()).map(([id, player]) => {
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
                {/* Bridleway paths on minimap - always visible */}
                {paths.map((path, index) => (
                    <Styled.MinimapPath
                        key={index}
                        left={path.left}
                        top={path.top}
                        width={path.width}
                        height={path.height}
                    />
                ))}

                {/* Current player */}
                <Styled.MinimapHorse
                    x={position.x}
                    y={position.y}
                />

                {/* Other players */}
                {Array.from(players.entries()).map(([id, player]) => {
                    if (id === horseId) return null;
                    return (
                        <Styled.MinimapHorse
                            key={id}
                            x={player.position.x}
                            y={player.position.y}
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
