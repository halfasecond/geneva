import * as Styled from '../Purr/style'
import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Link, useLocation } from 'react-router-dom'
// import { Contract } from 'web3-eth-contract'
// import CryptoKitties from '../../contracts/CryptoKitties'
// import Contracts from '../../contracts/Purr'
import Logo from '../Purr/Logo'
import { AuthProps } from '../../types/auth'
// import { getContract } from '../../utils'
// import { AbiFragment } from 'web3'
import { getAssetPath } from '../../utils/assetPath'

// CryptoKitties contracts:
// const cryptokitties: Contract<AbiFragment[]> = getContract(CryptoKitties.Core.abi, CryptoKitties.Core.addr)
//const purr: Contract<AbiFragment[]> = getContract(Contracts.Purr.abi, Contracts.Purr.addr)
// const purrClaim: Contract<AbiFragment[]> = getContract(Contracts.PurrClaim.abi, Contracts.PurrClaim.addr)

const AppView: React.FC<AuthProps> = ({ handleSignIn, handleSignOut, loggedIn: walletAddress, BASE_URL }) => {
    // const [purrClaimBalance, setPurrClaimBalance] = useState<string | undefined>(undefined)
    // const [purrBalance, setPurrBalance] = useState<string | undefined>(undefined)

    // useEffect(() => {
    //     const getContractBalance = async () => {
    //         const balanceOfPurrClaimContract = await purr.methods.balanceOf(Contracts.PurrClaim.addr).call()
    //         const balanceOf = await purr.methods.balanceOf(walletAddress).call()
    //         if (balanceOf && balanceOfPurrClaimContract) {
    //             setPurrClaimBalance(balanceOfPurrClaimContract.toString())
    //             setPurrBalance(balanceOf.toString())
    //         }
    //     }
    //     if (walletAddress) {
    //         getContractBalance()
    //     }
    // }, [walletAddress])

    const getLink = (linkText: string) => {
        const links = {
            'Doodles': 'https://www.doodles.app/',
            'CryptoKitties website': 'https://cryptokitties.co',
            'Kitty.International': 'https://x.com/kittyintl',
            'Dapper Labs': 'https://www.dapperlabs.com/'
        }
        return (
            <a href={links[linkText]} target={'_blank'}>{linkText}</a>
        )
    }

    return (
        <Router basename={BASE_URL}>
            <ScrollToTop />
            <Styled.Background />
            <Styled.Furlin />
            <Logo color={'#FFF'} zIndex={1} />
            <Styled.Main />
            <Styled.Main>
                <Styled.VideoBackground
                    autoPlay
                    loop
                    muted
                    playsInline
                    src={getAssetPath('mabel.mp4')}
                />
                <h3>Murmurare est amare... 🐾</h3>
                <Styled.Grid>
                    <div>
                        <h2>Consumer & Retail</h2>
                    </div>
                    <div>
                        <h2>Elegance & Desire</h2>
                    </div>
                    <div>
                        <h2>Entertainment</h2>
                    </div>
                    <div>
                        <h2>Innovation</h2>
                    </div>
                </Styled.Grid>

            </Styled.Main>
            <Styled.Main>
                <h2>What is $PURR?</h2>
                <p><b>$PURR</b> - the intersection of web3 and entertainment</p>
                <p><b>$PURR</b> - the intersection of web3 and consumer retail experience</p>
                <p><b>$PURR</b> - the intersection of web3 and innovation</p>
                <p><b>$PURR</b> - the intersection of web3 and fun</p>
                <Styled.ImageGrid>
                    <img src={getAssetPath('kittyInternational.jpg')} alt={'Kitty International'} />
                    <img src={getAssetPath('poopie.png')} alt={'Poopie Cat'} />
                    <img src={getAssetPath('dapper-wallet.png')} alt={'Dapper Labs'} />
                    <img src={getAssetPath('cryptokitties.svg')} alt={'CryptoKitties'} />
                </Styled.ImageGrid>

                <p>Launched in 2017, {getLink('Kitty.International')} has been actively developing Apps and Dapps with a focus on real world user cases, gamification, entertainment.... and cats!</p>
                <p>In 2021, shortly before launching {getLink('Doodles')}, Jordan Castro hired Kitty.International to work on the {getLink('CryptoKitties website')} and we have been providing our digital feline services to {getLink('Dapper Labs')} ever since.</p>
            </Styled.Main>
            <Styled.Main>
                <Styled.VideoBackground2
                    autoPlay
                    loop
                    muted
                    playsInline
                    src={getAssetPath('purr-hackathon.mp4')}
                />
                <div>
                    <h2>Meet the Swarm</h2>
                    <p>Our team recently competed at the EthGlobal Agentic A.I. hackathon and (our entry) the Geneva system has been crucial in the developement of <b>$PURR</b>.</p>
                    <p><b>$PURR</b> holders are able to interact directly with our A.I. agents and are invited, at all levels, to actively help us shape the future of the <b>$PURR</b> ecosystem. Can A.I empower smaller teams to ship to the feature hungry web3 landscape in a more cost / time effective manner? We think so and we hope you will stick around to find out...</p>
                </div>

            </Styled.Main>
            <Styled.Main>
                <h2>Story so far</h2>
                <Styled.ImageGrid2>
                    <div>
                        <img src={getAssetPath('kitty-news.jpg')} alt={'kitty.news'} />
                        <p><Link to={'https://kitty.news'}>www.kitty.news</Link></p>
                        <p>Launched in April 2018, kitty.news provides comprehensive data about the history of CryptoKitties in addition to popular floors, recent sales, articles about the game and specialist search tools not available on the ck website.</p>
                    </div>
                    <div>
                        <img src={getAssetPath('kitty-family.jpg')} alt={'kitty.family'} />
                        <p><Link to={'https://kitty.family'}>www.kitty.family</Link></p>
                        <p>kitty.family originally launched in January 2018 as a tool to show people their CryptoKitties ancestry on the eth blockchain but, over the years, has evolved into a web3 social media site with a chat room exclusive to kitty owners</p>
                    </div>
                    <div>
                        <img src={getAssetPath('kitties-tv.jpg')} alt={'kitties.tv'} />
                        <p><Link to={'https://kitties.tv'}>www.kitties.tv</Link></p>
                        <p>kitties.tv was released in 2024 and is a live stream exclusive to cryptokitties owners. yes - you read that correctly: secure web3 enabled live tv streaming using node-media-server... and cats...</p>
                    </div>
                </Styled.ImageGrid2>
            </Styled.Main>
            <Styled.Main>
                <h2>Coming soon</h2>
            </Styled.Main>
        </Router>
    )
}

const ScrollToTop: React.FC = () => {
    const { pathname } = useLocation()
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [pathname])
    return null
}

export default AppView
