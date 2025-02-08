import React, { useEffect, useRef, useCallback } from "react";
import * as Styled from "./Paddock.style";
import { useMovement } from "./hooks/useMovement";
import { useZoom } from "./hooks/useZoom";
import { useGameServer } from "./hooks/useGameServer";
import { Position } from "../../server/types";
import IssuesField from "../IssuesField";
import { PathHighlight } from "../Bridleway";
import { paths } from "../Bridleway/set";
import { introMessages } from "../Bridleway/messages";

interface PaddockProps {
    horseId: string;
    initialPosition?: Position;
    introActive?: boolean;
}

export const Paddock: React.FC<PaddockProps> = ({ 
    horseId,
    initialPosition = { x: 60, y: 140, direction: "right" as const },
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

    // Initialize movement with current viewport dimensions
    const { position, viewportOffset } = useMovement({
        viewportWidth: viewportDimensions.width,
        viewportHeight: viewportDimensions.height,
        scale: 1,
        initialPosition,
        introActive,
        onPositionChange: useCallback((pos: Position) => {
            if (connected) {
                updatePosition(pos);
            }
        }, [connected, updatePosition]),
        onMessageTrigger: introActive ? handleMessageTrigger : undefined
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

                {/* Issues Field */}
                <Styled.IssuesFieldContainer scale={scale}>
                    <IssuesField />
                </Styled.IssuesFieldContainer>

                {/* Current player */}
                <Styled.Horse
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        transform: `scaleX(${position.direction === "right" ? 1 : -1})`
                    }}
                >
                    <img src={`/horse/${horseId}.svg`} alt={`#${horseId}`} />
                </Styled.Horse>

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
