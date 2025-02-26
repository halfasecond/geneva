import React, { useEffect, useRef, useState } from 'react';
import * as Styled from './ScareCity.style'
import { HORSE_SIZE } from '../../Game';

interface AttributeTypeProps {
    attributes: Array<{ value: string; amount: number }>;
    traitType: string;
    player: any;
    gameData: any;
    scanTrait: (data: { 
        scanType: string;
        scanResult: string;
        tokenId: number;
    }) => void;
    offset: { left: number, top: number };
}

interface DoorProps {
    canscan: boolean;
    ismatch: boolean;
}

export const AttributeType: React.FC<AttributeTypeProps> = ({ 
    attributes,
    traitType,
    player,
    gameData,
    offset,
    scanTrait
}) => {
    const [canscan, setCanscan] = useState(false);
    const scanningAreaRef = useRef<HTMLDivElement>(null);
    const buildingRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (player && scanningAreaRef.current) {
            const saRect = scanningAreaRef.current.getBoundingClientRect();
            const parentRect = scanningAreaRef.current.parentElement!.parentElement!.getBoundingClientRect();
            // Calculate player's position relative to the parent element
            const adjustedPlayerLeft = player.position.x - (offset.left - parentRect.left);
            const adjustedPlayerTop = player.position.y - (offset.top - parentRect.top);

            // Check if adjusted player is within the scanning area
            const isPlayerWithinScanningArea =
                adjustedPlayerLeft >= saRect.left &&
                adjustedPlayerLeft + HORSE_SIZE <= saRect.left + saRect.width &&
                adjustedPlayerTop >= saRect.top - 30 &&
                adjustedPlayerTop + HORSE_SIZE <= saRect.top + saRect.height + 30;

            if (isPlayerWithinScanningArea !== canscan) {
                setCanscan(isPlayerWithinScanningArea);
            }
        }
    }, [player.position]);

    useEffect(() => {
        if (canscan && !gameData.discounters.includes(player.owner) && !gameData.foundBy) {
            scanTrait({ 
                scanType: traitType, 
                scanResult: player[traitType], 
                tokenId: player.id
            })
        }
    }, [canscan]);

    return (
        <Styled.Building ref={buildingRef}>
            <h4>{traitType.replace(/([A-Z])/g, ' $1').trim()}</h4>
            <ul>
                {attributes
                    .sort((a, b) => a.amount - b.amount)
                    .map((trait, i) => {
                        const textDecoration = 
                            (gameData.discounted && gameData.discounted.includes(trait.value)) || 
                            (gameData.foundBy && gameData.answer !== trait.value) 
                                ? 'line-through' 
                                : gameData.answer === trait.value && gameData.foundBy 
                                    ? 'underline' 
                                    : 'none';
                        const fontWeight = textDecoration === 'underline' ? 'bold' : 'normal' 
                        const percentage = ((trait.amount / attributes.reduce((sum, a) => sum + a.amount, 0)) * 100).toFixed(2);
                        
                        return (
                            <li key={i} style={{ textDecoration, fontWeight }}>
                                {trait.value} ({trait.amount}) {percentage}%
                            </li>
                        );
                    })}
            </ul>
            <Styled.Door
                ref={scanningAreaRef}
                canscan={canscan}
                ismatch={gameData.answer === player[traitType] && gameData.foundBy}
            >
                <div />
            </Styled.Door>
        </Styled.Building>
    );
};
