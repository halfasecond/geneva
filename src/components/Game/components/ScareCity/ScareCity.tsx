import * as Styled from './ScareCity.style';

interface NFT {
    tokenId: number;
    background: string;
    bodyAccessory: string;
    bodyColor: string;
    headAccessory: string;
    hoofColor: string;
    mane: string;
    maneColor: string;
    pattern: string;
    patternColor: string;
    tail: string;
    utility: string;
    owner: string;
}

interface ScareCityProps {
    nfts: NFT[];
    player?: NFT;
    block: number;
    gameData: any;
}

const attributeTypes = [
    'background', 'bodyAccessory', 'bodyColor', 'headAccessory',
    'hoofColor', 'mane', 'maneColor', 'pattern', 'patternColor',
    'tail', 'utility'
];

// Process NFTs to get attribute counts
const getAttributeCounts = (nfts: NFT[]) => {
    const counts: Record<string, { value: string; amount: number }[]> = {};
    
    // Get all possible attribute types
    // Count occurrences of each value for each attribute type
    attributeTypes.forEach(type => {
        const valueCounts = new Map<string, number>();
        nfts.forEach(nft => {
            if (!(nft.owner === '0x0000000000000000000000000000000000000000')) {
                const value = nft[type as keyof NFT] as string;
                valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
            }
        });

        counts[type] = Array.from(valueCounts.entries()).map(([value, amount]) => (
            {
                value,
                amount
            }
        ));
    });

    return counts;
};

export const ScareCity: React.FC<ScareCityProps> = ({ nfts, player, gameData, block }) => {
    if (!gameData?.gameStart) return null;
    const attributeCounts = getAttributeCounts(nfts);

    return (
        <Styled.Container>
            <Styled.Header>
                <h2>Scare City<span>Check if you're rare but don't get a scare!</span></h2>
                <p>Run past the windows of all the skyscrapers but don't get spooked by a spooky ghost of death!</p>
                <p>Game finishes in {block && gameData.gameStart + gameData.gameLength - block?.blocknumber} blocks</p>
            </Styled.Header>

            <Styled.Buildings>
                {attributeTypes.map((type) => (
                    <Styled.Building key={type}>
                        <h4>{type.replace(/([A-Z])/g, ' $1').trim()}</h4>
                        <ul>
                            {attributeCounts[type]
                                .sort((a, b) => a.amount - b.amount)
                                .map((attr, i) => {
                                    const isDiscounted = gameData[type]?.discounted?.includes(attr.value);
                                    const isFound = gameData[type]?.foundBy && gameData[type]?.answer === attr.value;
                                    const percentage = ((attr.amount / nfts.length) * 100).toFixed(2);
                                    
                                    return (
                                        <li 
                                            key={i}
                                            style={{
                                                textDecoration: isDiscounted ? 'line-through' : 
                                                               isFound ? 'underline' : 'none'
                                            }}
                                        >
                                            {attr.value} ({attr.amount}) {percentage}%
                                        </li>
                                    );
                                })}
                        </ul>
                        <Styled.Door 
                            canscan={true}
                            ismatch={gameData[type]?.foundBy && 
                                   gameData[type]?.answer === player?.[type as keyof NFT]}
                        >
                            <div />
                        </Styled.Door>
                    </Styled.Building>
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