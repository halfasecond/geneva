import * as Styled from './ProbablyWood.style'
import { useEffect, useRef } from 'react';

interface ProbablyWoodDimensions {
    width: number;
    height: number;
    left: number;
    top: number;
}

interface ProbablyWoodProps {
    left: number;
    top: number;
    onElementDimensions?: (dimensions: Record<string, ProbablyWoodDimensions>) => void;
}

const ProbablyWood: React.FC<ProbablyWoodProps> = ({ left, top, onElementDimensions }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const forest1Ref = useRef<HTMLDivElement>(null);
    const forest2Ref = useRef<HTMLDivElement>(null);
    const bearRef = useRef<HTMLDivElement>(null);
    const measurementDone = useRef(false);

    // Measure elements after they're rendered
    useEffect(() => {
        if (containerRef.current && forest1Ref.current && forest2Ref.current && bearRef.current && !measurementDone.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const forest1Rect = forest1Ref.current.getBoundingClientRect();
            const forest2Rect = forest2Ref.current.getBoundingClientRect();
            const bearRect = bearRef.current.getBoundingClientRect();

            const dimensions: Record<string, ProbablyWoodDimensions> = {
                forest1: {
                    width: forest1Rect.width,
                    height: forest1Rect.height,
                    left: left + (forest1Rect.left - containerRect.left),
                    top: top + (forest1Rect.top - containerRect.top)
                },
                forest2: {
                    width: forest2Rect.width,
                    height: forest2Rect.height,
                    left: left + (forest2Rect.left - containerRect.left),
                    top: top + (forest2Rect.top - containerRect.top)
                },
                bear: {
                    width: bearRect.width,
                    height: bearRect.height,
                    left: left + (bearRect.left - containerRect.left),
                    top: top + (bearRect.top - containerRect.top)
                }
            };

            onElementDimensions?.(dimensions);
            measurementDone.current = true;
        }
    }, [left, top, onElementDimensions]);

    return (
        <Styled.Div ref={containerRef} style={{ left, top }}>
            <div>
                <h2>Probably Wood</h2>
                <Styled.Forest ref={forest1Ref} />
                <Styled.Forest ref={forest2Ref} className="second-forest" />
                <Styled.Bear ref={bearRef} />
                <p>{'Sometimes, if you look closely, you can catch a glimpse of Kitty International\'s Two Bit Bear'}</p>
            </div>
        </Styled.Div>
    )
}

export default ProbablyWood

// entities.forest = {
//     left: 3500, top: 1000, width: 500, height: 500, zIndex: 2, position: 'absolute', opacity: 0.8,
//     backgroundImage: `url(${forest})`, backgroundSize: 'contain',
//     renderer: <Forest />
//   }
//   entities.forest2 = {
//     left: 410, top: 50, width: 400, height: 400, zIndex: 2, position: 'absolute', opacity: 0.8,
//     backgroundImage: `url(${forest})`, backgroundSize: 'contain',
//     renderer: <Forest />
//   }

//   entities.forestTitle = {
//     left: 410, top: -20, width: 400, height: 400, zIndex: 2, position: 'absolute', opacity: 0.6,
//     renderer: ({ left, top, width, height, zIndex, position, opacity }) => 
//       <h2 style={{ left, top, width, height, zIndex, position, opacity }}>{'Probably Wood'}</h2>
//   }

//   entities.FarokhAokitheHappyBrownBear = {
//     left: 280, top: 100, width: 400, height: 400, zIndex: 1, position: 'absolute',
//     backgroundImage: `url(${farouk})`, backgroundSize: 'contain',
//     renderer: ({ left, top, width, height, zIndex, position, backgroundImage, backgroundSize }) =>
//       <div style={{ left, top, width, height, zIndex, position, backgroundImage, backgroundSize }}>
//         <div style={{ marginTop: 360, marginLeft: 200, position, width: 400 }}>
//           {'If you look closely sometimes you can get a glimpse of Kitty International\'s Two Bit Bear'}
//         </div>
//       </div>
//   }
