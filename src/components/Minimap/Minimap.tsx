import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { MinimapElement, MinimapDot, ViewportIndicator, MinimapBuilding, StyledResults } from './MinimapElement';
import { Position } from '../../server/types';
import { paths, rivers, raceElements, pond, issuesColumns } from '../../components/Game/components/Environment';
import { WORLD_WIDTH, WORLD_HEIGHT, MINIMAP_WIDTH, MINIMAP_HEIGHT } from '../../utils/coordinates';
import { Actor } from '../../server/types/actor';
import { CLOCK_DIMENSIONS } from '../Game/components/Clock/constants';
import { getAssetPath } from 'src/utils/assetPath';

const pulse = keyframes`
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
`;

const Container = styled.div`
    position: fixed;
    bottom: 90px;
    right: 34px;
    width: ${MINIMAP_WIDTH}px;
    height: ${MINIMAP_HEIGHT}px;
    aspect-ratio: ${WORLD_WIDTH} / ${WORLD_HEIGHT};
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
    actors: Actor[];
    nfts: any[];
    block?: { blocknumber: number };
    scareCityDimensions?: Record<string, {
        width: number;
        height: number;
        left: number;
        top: number;
    }>;
    scareCityState?: {
        attributes: Record<string, { foundBy: string | null }>;
        [key: string]: any;
    };
    probablyWoodDimensions?: Record<string, {
        width: number;
        height: number;
        left: number;
        top: number;
    }>;
}

export const Minimap: React.FC<MinimapProps> = ({
    viewportOffset,
    viewportDimensions,
    scale,
    actors,
    nfts,
    block,
    scareCityDimensions,
    scareCityState,
    probablyWoodDimensions
}) => {
    const [isPulsing, setIsPulsing] = useState(false);

    // Handle block changes
    useEffect(() => {
        if (block?.blocknumber) {
            setIsPulsing(true);
            const timer = setTimeout(() => setIsPulsing(false), 500);
            return () => clearTimeout(timer);
        }
    }, [block?.blocknumber]);

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

                {/* Clock */}
                <MinimapElement
                    worldRect={CLOCK_DIMENSIONS}
                    backgroundColor="#EEE"
                    opacity={isPulsing ? 1 : 0.6}
                />

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

                {/* ScareCity Buildings */}
                {scareCityDimensions && scareCityState && Object.entries(scareCityDimensions).map(([type, dimensions]) => {
                    if (type === 'results') {
                        return (
                            <MinimapElement
                                key="results"
                                worldRect={{
                                    left: dimensions.left,
                                    top: dimensions.top,
                                    width: dimensions.width,
                                    height: dimensions.height
                                }}
                                backgroundColor="rgba(0, 0, 0, 0.8)"
                                opacity={0.6}
                                borderRadius="2px"
                            />
                        );
                    }
                    return (
                        <MinimapBuilding
                            key={`building-${type}`}
                            worldRect={{
                                left: dimensions.left,
                                top: dimensions.top,
                                width: dimensions.width,
                                height: dimensions.height
                            }}
                            isFound={!!scareCityState?.attributes?.[type]?.foundBy}
                        />
                    );
                })}

                {/* Probably Wood */}
                {probablyWoodDimensions && Object.entries(probablyWoodDimensions).map(([type, dimensions]) => (
                    <MinimapElement
                        key={`probablyWood-${type}`}
                        worldRect={{
                            left: dimensions.left,
                            top: dimensions.top,
                            width: dimensions.width,
                            height: dimensions.height
                        }}
                        backgroundImage={type.includes('forest') ? getAssetPath('svg/forest.svg') : getAssetPath('svg/31db13b10188de1afd6cff09cf65a0ae.svg')} // Green for forests, brown for bear
                        opacity={0.7}
                    />
                ))}

                {/* Only show player in play mode */}
                {actors.map(actor => {
                    if (actor.type === 'player') {
                        return (
                            <MinimapDot
                                key={actor.id}
                                x={actor.position.x}
                                y={actor.position.y}
                                svg={nfts.find(nft => nft.tokenId === actor.id)?.svg}
                                direction={actor.position.direction}
                            />
                        );
                    }
                    return null;
                })}
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
