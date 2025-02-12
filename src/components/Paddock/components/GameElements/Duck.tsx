import React from 'react';
import styled from 'styled-components';
import { getAssetPath } from '../../../../utils/assetPath';
import { useGameSpaceVisibility } from '../../hooks/useGameSpaceVisibility';
import { useDuckAnimation } from '../../hooks/useDuckAnimation';
import { Z_LAYERS } from '../../../../config/zIndex';

interface DuckProps {
    left: number;
    top: number;
    width?: number;
    pondWidth: number;
}

const DuckImage = styled.img`
    position: absolute;
    height: auto;
    pointer-events: none;
    z-index: ${Z_LAYERS.CHARACTERS};
`;

const Duck: React.FC<DuckProps> = ({ 
    left, 
    top, 
    width = 120,
    pondWidth
}) => {
    const { elementRef, isVisible } = useGameSpaceVisibility({
        viewportOffset: { x: left, y: top },
        viewportDimensions: { width: pondWidth, height: width }
    });

    const { duckRef, style } = useDuckAnimation({
        isVisible,
        left,
        pondWidth,
        width
    });

    return (
        <div ref={elementRef} style={{ position: 'absolute', top }}>
            <DuckImage
                ref={duckRef}
                src={getAssetPath('horse/Duck.svg')}
                alt="Duck"
                style={{
                    ...style,
                    width: `${width}px`,
                    transform: `translate3d(${left}px, 0, 0) scaleX(1)`
                }}
            />
        </div>
    );
};

export default Duck;