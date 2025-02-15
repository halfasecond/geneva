import React from 'react';
import styled from 'styled-components';
import { MinimapElement, MinimapDot, ViewportIndicator } from './MinimapElement';
import { Position } from '../../server/types';
import { paths, rivers } from '../../components/Paddock/components/Environment';
import { raceElements, pond, issuesColumns } from '../../components/Bridleway/set';
import { WORLD_WIDTH, WORLD_HEIGHT, MINIMAP_WIDTH, MINIMAP_HEIGHT } from '../../utils/coordinates';
import { LivePlayer } from '../../server/modules/chained-horse/socket/state/players';

const Container = styled.div`
    position: fixed;
    bottom: 90px;
    right: 34px;
    width: ${MINIMAP_WIDTH}px;
    height: ${MINIMAP_HEIGHT}px;
    background: rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    overflow: hidden;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const MinimapContent = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
`;

interface MinimapProps {
    viewportOffset: { x: number; y: number };
    viewportDimensions: { width: number; height: number };
    scale: number;
    currentPosition: Position;
    otherPlayers?: Map<string, LivePlayer>;
    isServerless?: boolean;
    horseId: string;
}

export const Minimap: React.FC<MinimapProps> = ({
    viewportOffset,
    viewportDimensions,
    scale,
    currentPosition,
    otherPlayers,
    isServerless = false,
    horseId
}) => {
    return (
        <Container>
            <MinimapContent>
                {/* Beach area */}
                <MinimapElement
                    worldRect={{
                        left: 0,
                        top: WORLD_HEIGHT - 800,
                        width: WORLD_WIDTH,
                        height: 800
                    }}
                    backgroundColor="#f4e4bc"
                    opacity={0.5}
                />

                {/* Bridleway paths and rivers */}
                {[...paths, ...rivers].map((segment, index) => (
                    <MinimapElement
                        key={`segment-${index}`}
                        worldRect={{
                            left: segment.left,
                            top: segment.top,
                            width: segment.width,
                            height: segment.height
                        }}
                        backgroundColor={segment.backgroundColor === '#37d7ff' 
                            ? segment.backgroundColor 
                            : 'rgba(238, 238, 238, 0.5)'}
                    />
                ))}

                {/* Ponds */}
                <MinimapElement
                    worldRect={{
                        left: pond.left,
                        top: pond.top,
                        width: pond.width,
                        height: pond.height
                    }}
                    backgroundColor={pond.backgroundColor}
                />
                <MinimapElement
                    worldRect={{
                        left: 40,
                        top: 2580,
                        width: 500,
                        height: 340
                    }}
                    backgroundColor={pond.backgroundColor}
                />

                {/* Farm */}
                <MinimapElement
                    worldRect={{
                        left: 1190 - 50,
                        top: 940 - 50,
                        width: 100 * 2,
                        height: 100 * 2
                    }}
                    backgroundColor="#754c29"
                    opacity={0.6}
                />

                {/* Issues Field Columns */}
                {issuesColumns.map((column, index) => (
                    <MinimapElement
                        key={`column-${index}`}
                        worldRect={{
                            left: column.left,
                            top: column.top,
                            width: column.width,
                            height: column.height
                        }}
                        backgroundColor={column.backgroundColor}
                    />
                ))}

                {/* Race Track Elements */}
                {raceElements.map((element, index) => (
                    <MinimapElement
                        key={`race-${index}`}
                        worldRect={{
                            left: element.left,
                            top: element.top,
                            width: element.width,
                            height: element.height
                        }}
                        backgroundColor={element.backgroundColor}
                    />
                ))}

                {/* Current player */}
                <MinimapDot
                    x={currentPosition.x}
                    y={currentPosition.y}
                    horseId={horseId}
                    direction={currentPosition.direction}
                />

                {/* Other players - only show in non-serverless mode */}
                {!isServerless && otherPlayers && Array.from(otherPlayers.entries()).map(([id, player]) => {
                    if (id === currentPosition.toString()) return null;
                    return (
                        <MinimapDot
                            key={id}
                            x={player.x}
                            y={player.y}
                            horseId={player.avatarHorseId.toString()}
                            direction={player.direction}
                        />
                    );
                })}

                {/* Viewport indicator */}
                <ViewportIndicator
                    x={viewportOffset.x}
                    y={viewportOffset.y}
                    width={viewportDimensions.width}
                    height={viewportDimensions.height}
                    scale={scale}
                />
            </MinimapContent>
        </Container>
    );
};
