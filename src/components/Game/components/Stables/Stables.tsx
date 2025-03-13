import * as Styled from './Stables.style'
import { upgrades, stables, emojis, getAorAn } from 'src/server/modules/chained-horse/config/stables'
import { getAssetPath } from 'src/utils/assetPath'

interface Props {
    nfts: any;
    player: any;
    upgradeStable: (stable: number) => void;
}

const Stables: React.FC<Props> = ({ nfts, player, upgradeStable }) => {
    return (
        <Styled.Div>
            <p><img src={getAssetPath('/svg/hay.svg')} /> <b>$HAY: {player.hay}</b></p>
            <p><span>{emojis[player.game.stable]}</span>{`You have ${getAorAn(stables[player.game.stable])} ${stables[player.game.stable]} stable`}</p>
            <h2>Upgrade your stable</h2>
            <ul>
                {stables.map((stable, i) => {
                    return (
                        <li 
                            key={i} 
                            style={{ 
                                opacity: i <= player.game.stable ? .5 : 1,
                                cursor: i <= player.game.stable ? 'default' : 'pointer'
                            }}
                            role={'button'}
                            onClick={() => {
                                if (i <= player.game.stable) return
                                if (player.hay < upgrades[i]) {
                                    alert(`🧑🏽‍🌾 you do not have enough $HAY to buy a ${stables[i]} stable 🧑🏽‍🌾`)
                                } else {
                                    upgradeStable(i)
                                }
                            }}
                        >
                            <span>{emojis[i]} {stable}</span>
                            {i === 0 ? (
                                <span>{upgrades[i]}</span>
                            ) : (
                                <span>$HAY {upgrades[i].toLocaleString()}</span>
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