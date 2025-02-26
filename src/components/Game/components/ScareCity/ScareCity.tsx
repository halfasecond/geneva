import { useEffect, useRef } from 'react';
import { AttributeType } from './AttributeType';
import * as Styled from './ScareCity.style';

const SCARECITY_OFFSET = { left: 4000, top: 40 };

interface BuildingDimensions {
    width: number;
    height: number;
    left: number;
    top: number;
}

interface ScareCityProps {
    nfts: any[];
    player: any;
    gameData: any;
    block: any;
    attributeTypes: string[];
    onBuildingDimensions?: (dimensions: Record<string, BuildingDimensions>) => void;
    scanTrait: (data: { 
        scanType: string;
        scanResult: string;
        tokenId: number;
    }) => void;
}

export const ScareCity = ({ 
    nfts, 
    player, 
    gameData, 
    block,
    attributeTypes,
    onBuildingDimensions,
    scanTrait
}: ScareCityProps) => {
    const buildingsRef = useRef<HTMLDivElement>(null);
    const dimensionsRef = useRef<Record<string, BuildingDimensions>>({});
    const measurementDone = useRef(false);

    // Measure all buildings after they're rendered
    useEffect(() => {
        if (buildingsRef.current && !measurementDone.current) {
            const buildings = buildingsRef.current.children;
            const newDimensions: Record<string, BuildingDimensions> = {};

            Array.from(buildings).forEach((building, index) => {
                const rect = building.getBoundingClientRect();
                const parentRect = buildingsRef.current!.getBoundingClientRect();
                const type = attributeTypes[index];

                newDimensions[type] = {
                    width: rect.width,
                    height: rect.height,
                    left: rect.left - parentRect.left + SCARECITY_OFFSET.left,
                    top: rect.top - parentRect.top + SCARECITY_OFFSET.top
                };
                console.log(newDimensions[type])
            });

            dimensionsRef.current = newDimensions;
            onBuildingDimensions?.(newDimensions);
            measurementDone.current = true;
        }
    }, [attributeTypes]);

    if (!gameData?.gameStart) return null;

    // Process NFTs to get attribute counts
    const getAttributeCounts = (type: string) => {
        const values = nfts.map(nft => nft[type]).filter(Boolean);
        const uniqueValues = [...new Set(values)];
        return uniqueValues.map(value => ({
            value,
            amount: values.filter(v => v === value).length
        }));
    };

    return (
        <Styled.Container>
            <Styled.Header>
                <h2>Scare City<span>Check if you're rare but don't get a scare!</span></h2>
                <p>Stand in the doorway of all the skyscrapers but don't get spooked by a spooky ghost of death!</p>
                <p>Game finishes in {block && gameData.gameStart + gameData.gameLength - block.blocknumber} blocks</p>
            </Styled.Header>

            <Styled.Buildings ref={buildingsRef}>
                {attributeTypes.map((type) => (
                    <AttributeType
                        key={type}
                        attributes={getAttributeCounts(type)}
                        traitType={type}
                        player={player}
                        gameData={gameData[type] || { discounters: [], foundBy: null }}
                        offset={SCARECITY_OFFSET}
                        scanTrait={scanTrait}
                    />
                ))}
            </Styled.Buildings>

            <Styled.Results>
                <h4>Results</h4>
                <ul>
                    <li>
                        Spooked: {attributeTypes.filter(type => gameData[type]?.foundBy).length} - 
                        {((attributeTypes.filter(type => gameData[type]?.foundBy).length / 11) * 100).toFixed(2)}%
                    </li>
                    <li>Not scared: {gameData.ghosts?.length || 0}</li>
                </ul>

                <h4>How the scores work</h4>
                <ul>
                    <li>👻 Fully Spooked: 5 x <b>$HAY</b></li>
                    <li>🥷🏻 Not scared: amount x <b>$HAY</b></li>
                    <li>🐎 All rewards have a "not scared" + 1 horse multiplier</li>
                    <li>🚜 <b>$HAY</b> is paid out in accordance with trait rarity</li>
                </ul>

                <h4>Next game starts: {block && gameData.gameStart + gameData.gameLength - block.blocknumber} blocks</h4>
            </Styled.Results>
        </Styled.Container>
    );
};