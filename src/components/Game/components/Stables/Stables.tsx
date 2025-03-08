import { useEffect } from 'react'
import * as Styled from './Stables.style'
import { getAssetPath } from 'src/utils/assetPath'
import { A } from 'ollama/dist/shared/ollama.f6b57f53'

const stables = ['shitty', 'less shitty', 'ok', 'nice', 'plush', 'luxury']
const emojis = ['💩', '🏚️', '🏠', '🏡', '🌆', '🏰']
const upgradeCost = ['...', 10, 1000, 100000, 10000000, 10000000000]

const Stables: React.FC<{ player: any }> = ({ nfts, player }) => {
    useEffect(() => {
        console.log(player)
    }, [])
    return (
        <Styled.Div>
            <p><img src={getAssetPath('/svg/hay.svg')} /> <b>$HAY: {player.hay}</b></p>
            <p><span>{emojis[player.game.stable]}</span>{`You have a ${stables[player.game.stable]} stable`}</p>
            <h2>Upgrade your stable</h2>
            <ul>
                {stables.map((stable, i) => {
                    return (
                        <li 
                            key={i} 
                            style={{ 
                                opacity: i === player.game.stable ? .5 : 1,
                                cursor: i === player.game.stable ? 'default' : 'pointer'
                            }}
                            role={'button'}
                            onClick={() => {
                                if (player.hay < upgradeCost[i]) {
                                    alert(`🧑🏽‍🌾 you do not have enough $HAY to buy a ${stables[i]} stable 🧑🏽‍🌾`)
                                }
                            }}
                        >
                            <span>{emojis[i]} {stable}</span>
                            {i === 0 ? (
                                <span>{upgradeCost[i]}</span>
                            ) : (
                                <span>$HAY {upgradeCost[i].toLocaleString()}</span>
                            )}
                        </li>
                    )
                })}
            </ul>
            <h2>Your main horse at the moment</h2>
            <Styled.Grid>
                {nfts.filter(nft => nft.tokenId === player.id).map((nft, i) => {
                    return (
                        <Styled.Horse tokenId={nft.tokenId} key={i}>
                            <img 
                                src={nft.svg}
                                alt={`Chained Horse #${nft.tokenId}`} 
                            />
                        </Styled.Horse>
                    )
                })}
            </Styled.Grid>
            <h2>Your horses</h2>
            <Styled.Grid>
                {nfts.filter(nft => 
                    nft.owner.toLowerCase() === player.walletAddress.toLowerCase() &&
                    nft.tokenId !== player.id
                ).map((nft, i) => {
                    return (
                        <Styled.Horse tokenId={nft.tokenId} key={i}>
                            <img 
                                src={nft.svg}
                                alt={`Chained Horse #${nft.tokenId}`} 
                            />
                        </Styled.Horse>
                    )
                })}
            </Styled.Grid>
        </Styled.Div>
    )
}

export default Stables