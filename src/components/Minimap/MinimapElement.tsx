import React from 'react';
import styled from 'styled-components';
import { Rect, CoordinateTransformer } from '../../utils/coordinates';
import ghost from '/svg/horse/Ghost.svg'
import { getSVG } from '../../utils/getImage';

const StyledElement = styled.div`
    position: absolute;
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
            className={className}
            style={{
                left: `${minimapRect.left}px`,
                top: `${minimapRect.top}px`,
                width: `${Math.max(minimapRect.width, 1)}px`,
                height: `${Math.max(minimapRect.height, 1)}px`,
                backgroundColor: backgroundColor || 'rgba(238, 238, 238, 0.5)',
                opacity: opacity || 1,
                borderRadius: borderRadius || '0'
            }}
        />
    );
};

const StyledDot = styled.div`
    position: absolute;
    width: 8px;
    height: 8px;
    z-index: 2;  /* Ensure player dots are above viewport indicator */
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));  /* Add shadow for depth */

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
`;

interface MinimapDotProps {
    x: number;
    y: number;
    size?: number;
    svg?: string | null;
    direction?: 'left' | 'right';
    className?: string;
}

export const MinimapDot: React.FC<MinimapDotProps> = ({ 
    x, 
    y, 
    svg = null, 
    direction = 'right', 
    className 
}) => {
    const pos = CoordinateTransformer.worldToMinimap({ x, y });

    return (
        <StyledDot
            className={className}
            style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: `translate(-50%, -50%) scaleX(${direction === 'left' ? -1 : 1})`
            }}
        >
            {svg && <img src={getSVG(svg)} alt="" />}
        </StyledDot>
    );
};

const StyledViewport = styled.div`
    position: absolute;
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

    return (
        <StyledViewport
            style={{
                left: `${viewportRect.left}px`,
                top: `${viewportRect.top}px`,
                width: `${Math.max(viewportRect.width, 1)}px`,
                height: `${Math.max(viewportRect.height, 1)}px`
            }}
        />
    );
};

export const StyledResults = styled(StyledElement)`
    background-color: rgba(0, 0, 0, 0.8);
    border-radius: 2px;
    opacity: 0.6;
`;

interface BuildingProps {
    isFound: string;
}

const StyledBuilding = styled.div<BuildingProps>`
    position: absolute;
    background-color: #dadee9;
    box-sizing: border-box;
    border-radius: 2px;
    opacity: 0.6;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 6px;
        height: 6px;
        background-color: ${props => props.isFound === 'true' ? '#FFF' : 'transparent'};
        background-image:  ${props => props.isFound === 'true' ? `url(${ghost})` : 'none'};
        animation:  ${props => props.isFound === 'true' ? 'flashImage .25s infinite' : 'none'};
        animation-iteration-count: 4;
        background-size: 350% auto;
        background-position: 105% 210%;
        border-radius: 1px;
    }

    @keyframes flashImage {
        0%, 100% {
          background-image: url(${ghost});
        }
        50% {
          background-image: none;
        }
      }
`;

interface MinimapBuildingProps {
    worldRect: Rect;
    isFound: boolean;
}

export const MinimapBuilding: React.FC<MinimapBuildingProps> = ({ worldRect, isFound }) => {
    const minimapRect = CoordinateTransformer.worldRectToMinimap(worldRect);

    return (
        <StyledBuilding
            style={{
                left: `${minimapRect.left}px`,
                top: `${minimapRect.top}px`,
                width: `${Math.max(minimapRect.width, 1)}px`,
                height: `${Math.max(minimapRect.height, 1)}px`,
            }}
            isFound={isFound ? 'true' : 'false'}
        />
    );
};
