import { useEffect, useRef } from 'react';
import { AttributeType } from './AttributeType';
import { getAssetPath } from 'src/utils/assetPath';
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

const getAttributeCounts = (nfts: any[], type: string) => {
    const counts: Record<string, { value: string; amount: number }[]> = {};
    // Count occurrences of each value for each attribute type
    const values = nfts.map(nft => nft[type]).filter(Boolean);
    const uniqueValues = [...new Set(values)];
    counts[type] = uniqueValues.map(value => ({
        value,
        amount: values.filter(v => v === value).length
    }))
    return counts;
};


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
const resultsRef = useRef<HTMLDivElement>(null);
    const dimensionsRef = useRef<Record<string, BuildingDimensions>>({});
    const measurementDone = useRef(false);

    // Measure all buildings after they're rendered
    useEffect(() => {
        if (buildingsRef.current && resultsRef.current && !measurementDone.current) {
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
            });

            // Find the rightmost building
            let lastBuildingRight = 0;
            Object.values(newDimensions).forEach(dim => {
                const buildingRight = dim.left + dim.width;
                if (buildingRight > lastBuildingRight) {
                    lastBuildingRight = buildingRight;
                }
            });

            // Add Results dimensions after the last building
            const resultsRect = resultsRef.current.getBoundingClientRect();
            newDimensions.results = {
                width: 600, // Fixed from styles
                height: resultsRect.height,
                left: lastBuildingRight + 80, // Add margin after last building
                top: SCARECITY_OFFSET.top
            };

            dimensionsRef.current = newDimensions;
            onBuildingDimensions?.(newDimensions);
            measurementDone.current = true;
        }
    }, [attributeTypes]);

    if (!gameData?.gameStart) return null;

    return (
        <Styled.Container>
            <Styled.Header>
                <Styled.Ghost />
                <h2>Scare City<span>Check if you're rare but don't get a scare!</span></h2>
                <p>Run past the windows of all the skyscrapers but don't get spooked by a spooky ghost of death!</p>
                {gameData.lastGame && (<p>
                    <> 
                        Last Game: 👻 Spooked {attributeTypes.filter(type => gameData.lastGame[type]?.foundBy).length} - {((attributeTypes.filter(type => gameData.lastGame[type]?.foundBy).length / 11) * 100).toFixed(2)}%
                        - 🥷🏼 Not scared: {gameData.lastGame.ghosts?.length || 0} - 🚜 Paid out: $HAY {gameData.lastGame.totalPaidOut}
                    </>
                </p>)}
                <p>Current Game: finishes in {block && gameData.gameStart + gameData.gameLength - block.blocknumber} block{block && gameData.gameStart + gameData.gameLength - block.blocknumber === 1 ? ' ' : 's '}
                    - 👻 Spooked {attributeTypes.filter(type => gameData.attributes[type]?.foundBy).length} - 🥷🏼 Not scared: {gameData.ghosts?.length || 0}
                </p>
            </Styled.Header>

            <Styled.Buildings ref={buildingsRef}>
            {Object.keys(gameData.attributes).map((type) => {
                    const nft = nfts.find(({ tokenId }) => tokenId === player.id)
                    player = {...player, ...nft }
                    return (
                        <AttributeType
                            key={type}
                            attributes={getAttributeCounts(nfts, type)[type]}
                            traitType={type}
                            player={player}
                            offset={SCARECITY_OFFSET}
                            gameData={gameData.attributes[type]}
                            scanTrait={scanTrait}
                        />
                    )
                })}

            </Styled.Buildings>

            <Styled.Results ref={resultsRef}>
                <Styled.Ghost />
                {gameData.lastGame && (
                    <> 
                        <h4>Last Game</h4>
                        <ul>
                            <li>
                                Spooked: {attributeTypes.filter(type => gameData.lastGame[type]?.foundBy).length} - {((attributeTypes.filter(type => gameData.lastGame[type]?.foundBy).length / 11) * 100).toFixed(2)}%
                            </li>
                            <li>🥷🏻 Not scared: {gameData.lastGame.ghosts?.length || 0}</li>
                            <li>🚜 Paid out: <b>$HAY {gameData.lastGame.totalPaidOut}</b></li>
                        </ul>
                    </>
                )}
                
                <h4>Current Game: ends in {block && gameData.gameStart + gameData.gameLength - block.blocknumber} block{block && gameData.gameStart + gameData.gameLength - block.blocknumber === 1 ? '' : 's'}</h4>
                <ul>
                    <li>
                        👻 Spooked: {attributeTypes.filter(type => gameData.attributes[type]?.foundBy).length} - {((attributeTypes.filter(type => gameData.attributes[type]?.foundBy).length / 11) * 100).toFixed(2)}%
                    </li>
                    <li>🥷🏻 Not scared: {gameData.ghosts?.length || 0}</li>
                </ul>

                <h4>How the scores work</h4>
                <ul>
                    <li>👻 Fully Spooked: 5 x <b>$HAY</b></li>
                    <li>🥷🏻 Not scared: amount x <b>$HAY</b></li>
                    <li>🐎 All rewards have a "not scared" + 1 horse multiplier</li>
                    <li>🚜 <b>$HAY</b> is paid out in accordance with trait rarity</li>
                </ul>
            </Styled.Results>
        </Styled.Container>
    );
};
