// @ts-nocheck
import React, { useEffect, useRef, useCallback } from 'react'
import * as Styled from './Paddock.style'
import { useMovement } from './hooks/useMovement'
import { useZoom } from './hooks/useZoom'
import { useGameServer } from './hooks/useGameServer'
import { Position } from '../../server/types'

interface PaddockProps {
    horseId: string
    initialPosition?: Position
}

export const Paddock: React.FC<PaddockProps> = ({ 
    horseId,
    initialPosition = { x: 200, y: 200, direction: 'right' as const }
}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [viewportDimensions, setViewportDimensions] = React.useState({
        width: window.innerWidth,
        height: window.innerHeight
    })
    const [dimensionsReady, setDimensionsReady] = React.useState(false)

    // Initialize game server connection
    const { connected, players, updatePosition } = useGameServer({
        horseId,
        initialPosition
    })

    // Initialize movement with current viewport dimensions
    const { position, viewportOffset } = useMovement({
        viewportWidth: viewportDimensions.width,
        viewportHeight: viewportDimensions.height,
        scale: 1,
        initialPosition,
        onPositionChange: useCallback((pos: Position) => {
            if (connected) {
                updatePosition(pos)
            }
        }, [connected, updatePosition])
    })

    // Initialize zoom control
    const { scale, zoomOrigin } = useZoom({
        minScale: 0.2,
        maxScale: 1.5,
        position,
        viewportOffset,
        viewportDimensions
    })

    // Update viewport dimensions on resize and initial mount
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current
                if (clientWidth > 0 && clientHeight > 0) {
                    setViewportDimensions({
                        width: clientWidth,
                        height: clientHeight
                    })
                    setDimensionsReady(true)
                }
            }
        }

        // Initial update
        updateDimensions()
        
        // Update on resize
        window.addEventListener('resize', updateDimensions)
        return () => window.removeEventListener('resize', updateDimensions)
    }, [])

    if (!dimensionsReady) {
        return <Styled.Container ref={containerRef} />
    }

    return (
        <Styled.Container ref={containerRef}>
            <Styled.GameSpace 
                style={{
                    transform: `scale(${scale}) translate(${-viewportOffset.x}px, ${-viewportOffset.y}px)`,
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`
                }}
            >
                {/* Current player */}
                <Styled.Horse
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        transform: `scaleX(${position.direction === 'right' ? 1 : -1})`
                    }}
                >
                    <img src={`/horse/${horseId}.svg`} alt={`#${horseId}`} />
                </Styled.Horse>

                {/* Other players */}
                {Array.from(players.entries()).map(([id, player]) => {
                    if (id === horseId) return null // Skip current player
                    return (
                        <Styled.Horse
                            style={{
                                left: `${player.position.x}px`,
                                top: `${player.position.y}px`,
                                transform: `scaleX(${player.position.direction === 'right' ? 1 : -1})`
                            }}
                        >
                            <img src={`/horse/${id}.svg`} alt={`Horse ${id}`} />
                        </Styled.Horse>
                    )
                })}
            </Styled.GameSpace>

            {/* Minimap */}
            <Styled.Minimap>
                {/* Current player */}
                <Styled.MinimapHorse
                    style={{
                        left: `${(position.x / 5000) * 200}px`,
                        top: `${(position.y / 5000) * 200}px`,
                    }}
                />

                {/* Other players */}
                {Array.from(players.entries()).map(([id, player]) => {
                    if (id === horseId) return null
                    return (
                        <Styled.MinimapHorse
                            key={id}
                            x={player.position.x}
                            y={player.position.y}
                        />
                    )
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
    )
}
