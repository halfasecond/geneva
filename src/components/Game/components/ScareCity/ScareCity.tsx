import { AttributeType } from './AttributeType';
import * as Styled from './ScareCity.style';

const attributeTypes = [
    'background', 'bodyAccessory', 'bodyColor', 'headAccessory',
    'hoofColor', 'mane', 'maneColor', 'pattern', 'patternColor',
    'tail', 'utility'
];

// Process NFTs to get attribute counts
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

export const ScareCity = ({ nfts, player, gameData, block, scanTrait, left, top }) => {
    if (!gameData?.gameStart) return null;
    return (
        <Styled.Container style={{ left, top }}>
            <Styled.Header>
                <h2>Scare City<span>Check if you're rare but don't get a scare!</span></h2>
                <p>Stand in the doorway of all the skyscrapers but don't get spooked by a spooky ghost of death!</p>
                <p>Next game starts in {block && gameData.gameStart + gameData.gameLength - block.blocknumber} blocks</p>
            </Styled.Header>

            <Styled.Buildings>
                {Object.keys(gameData.attributes).map((type) => {
                    const nft = nfts.find(({ tokenId }) => tokenId === player.id)
                    player = {...player, ...nft }
                    return (
                        <AttributeType
                            key={type}
                            attributes={getAttributeCounts(nfts, type)[type]}
                            traitType={type}
                            player={player}
                            offset={{ left, top }}
                            gameData={gameData.attributes[type]}
                            scanTrait={scanTrait}
                        />
                    )
                })}
            </Styled.Buildings>

            <Styled.Results>
                <h4>Results</h4>
                <ul>
                    <li>
                        Spooked: {attributeTypes.filter(type => gameData.attributes[type]?.foundBy).length} - 
                        {((attributeTypes.filter(type => gameData.attributes[type]?.foundBy).length / 11) * 100).toFixed(2)}%
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