
import * as Styled from './LostAndFound.style'
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
    nfts: any[];
}

const LostAndFound: React.FC<Props> = ({ left, top, onElementDimensions, nfts }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const item0Ref = useRef<HTMLDivElement>(null);
    const measurementDone = useRef(false);
    const [items, setItems] = useState<number[]>([]);

    useEffect(() => {
        const uniqueUtilities = [...new Set(nfts.map(nft => nft.utility))];
        const _items = [] as number[]
        uniqueUtilities.forEach(utility => utility && utility !== 'none' && (
            _items.push(nfts.find(nft => nft.utility === utility).tokenId)
        ))
        setItems(_items)
    }, [])

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
            <div>
                <h2 ref={item0Ref}>Lost and Found</h2>
                {items.map((item, index) => {
                    const { svg, background, utility } = nfts.find(({ tokenId }) => tokenId === item)
                    return (
                        <Styled.Item
                            key={index}
                            style={{
                                backgroundColor: bgColors[background],
                                backgroundImage: `url(${svg})`,
                                
                            }}
                            {...{ utility }}
                        />
                    )
                })}
            </div>


        </Styled.Div>
    )
}

export default LostAndFound
