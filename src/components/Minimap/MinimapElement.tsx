import React from 'react';
import styled from 'styled-components';
import { Rect, CoordinateTransformer } from '../../utils/coordinates';
import { getAssetPath } from '../../utils/assetPath';

const StyledElement = styled.div<{
    minimapRect: Rect;
    backgroundColor?: string;
    opacity?: number;
    borderRadius?: string;
}>`
    position: absolute;
    left: ${props => props.minimapRect.left}px;
    top: ${props => props.minimapRect.top}px;
    width: ${props => Math.max(props.minimapRect.width, 1)}px;
    height: ${props => Math.max(props.minimapRect.height, 1)}px;
    background-color: ${props => props.backgroundColor || 'rgba(238, 238, 238, 0.5)'};
    opacity: ${props => props.opacity || 1};
    border-radius: ${props => props.borderRadius || '0'};
    box-sizing: border-box;  /* Include border in size calculations */
`;

export const MinimapElement: React.FC<{
    worldRect: Rect;
    backgroundColor?: string;
    opacity?: number;
    borderRadius?: string;
    className?: string;
}> = ({ worldRect, backgroundColor, opacity, borderRadius, className }) => {
    const minimapRect = CoordinateTransformer.worldRectToMinimap(worldRect);

    return (
        <StyledElement
            minimapRect={minimapRect}
            backgroundColor={backgroundColor}
            opacity={opacity}
            borderRadius={borderRadius}
            className={className}
        />
    );
};

const StyledDot = styled.div<{
    x: number;
    y: number;
    direction?: 'left' | 'right';
}>`
    position: absolute;
    left: ${props => props.x}px;
    top: ${props => props.y}px;
    width: 8px;
    height: 8px;
    transform: translate(-50%, -50%) scaleX(${props => props.direction === 'left' ? -1 : 1});
    z-index: 2;  /* Ensure player dots are above viewport indicator */
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));  /* Add shadow for depth */

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
`;

export const MinimapDot: React.FC<{
    x: number;
    y: number;
    size?: number;
    horseId: string;
    direction?: 'left' | 'right';
    className?: string;
}> = ({ x, y, horseId, direction = 'right', className }) => {
    const pos = CoordinateTransformer.worldToMinimap({ x, y });

    return (
        <StyledDot
            x={pos.x}
            y={pos.y}
            direction={direction}
            className={className}
        >
            <img src={getAssetPath(`horse/${horseId}.svg`)} alt={`Horse ${horseId}`} />
        </StyledDot>
    );
};

const StyledViewport = styled.div<{
    minimapRect: Rect;
}>`
    position: absolute;
    left: ${props => props.minimapRect.left}px;
    top: ${props => props.minimapRect.top}px;
    width: ${props => Math.max(props.minimapRect.width, 1)}px;
    height: ${props => Math.max(props.minimapRect.height, 1)}px;
    border: 3px dotted white;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);  /* Add dark outline for contrast */
    background: transparent;
    transition: all 0.1s ease-out;
    z-index: 1;
    pointer-events: none;
    box-sizing: border-box;
`;

export const ViewportIndicator: React.FC<{
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
}> = ({ x, y, width, height, scale }) => {
    const viewportRect = CoordinateTransformer.getViewportRect(
        { x, y },
        { width, height },
        scale
    );

    return <StyledViewport minimapRect={viewportRect} />;
};