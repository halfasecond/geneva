
import * as Styled from './Golf.style'
import { useEffect, useRef, useState } from 'react';
import { bgColors } from 'src/style/config';

interface Dimensions {
    width: number;
    height: number;
    left: number;
    top: number;
}

interface Props {
    left: number;
    top: number;
    onElementDimensions?: (dimensions: Record<string, Dimensions>) => void;
}

const Golf: React.FC<Props> = ({ left, top, onElementDimensions }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const item0Ref = useRef<HTMLDivElement>(null);
    const measurementDone = useRef(false);

    // Measure elements after they're rendered
    useEffect(() => {
        if (containerRef.current && item0Ref.current && !measurementDone.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const item0Rect = item0Ref.current.getBoundingClientRect();

            const dimensions: Record<string, Dimensions> = {
                item0: {
                    width: item0Rect.width,
                    height: item0Rect.height,
                    left: left + (item0Rect.left - containerRect.left),
                    top: top + (item0Rect.top - containerRect.top)
                },
            };

            onElementDimensions?.(dimensions);
            measurementDone.current = true;
        }
    }, [left, top, onElementDimensions]);

    return (
        <Styled.Div ref={containerRef} style={{ left, top }}>
            <h2 ref={item0Ref}>Golf</h2>
        </Styled.Div>
    )
}

export default Golf
