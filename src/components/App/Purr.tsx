import * as Styled from '../Purr/style'
import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { BrowserRouter as Router, Link, useLocation } from 'react-router-dom'
import { Contract } from 'web3-eth-contract'
import Metamask from 'components/Metamask'
import Balance from '../Purr/Balance'
import Claim from '../Purr/Claim'
import Diamond from '../Purr/Diamond'
import CryptoKitties from '../../contracts/CryptoKitties'
import Contracts from '../../contracts/Purr'
import Logo from '../Purr/Logo'
import { AuthProps } from '../../types/auth'
import { getContract } from '../../utils'
import { AbiFragment } from 'web3'
import { getAssetPath } from '../../utils/assetPath'
import { useSectionLayout } from '../Purr/hooks/useSectionLayout'

// CryptoKitties contracts:
const cryptokitties: Contract<AbiFragment[]> = getContract(CryptoKitties.Core.abi, CryptoKitties.Core.addr)
const purr: Contract<AbiFragment[]> = getContract(Contracts.Purr.abi, Contracts.Purr.addr)
const purrClaim: Contract<AbiFragment[]> = getContract(Contracts.PurrClaim.abi, Contracts.PurrClaim.addr)
const { VITE_APP_ENDPOINT } = import.meta.env

const AppView: React.FC<AuthProps> = ({ handleSignIn, handleSignOut, loggedIn, token, BASE_URL }) => {
    const claimRef = useRef<HTMLElement>(null);
    const { setSectionRef, sectionOffsets, recalculate } = useSectionLayout();
    
    const setClaimRef = (ref: HTMLElement | null) => {
        setSectionRef(5)(ref);
        (claimRef as React.MutableRefObject<HTMLElement | null>).current = ref;
    };

    const [purrClaimBalance, setPurrClaimBalance] = useState<string | undefined>(undefined)
    const [balance, setBalance] = useState<string | undefined>(undefined)
    const [muted, setMuted] = useState(true)

    const getPurrClaimBalance = async () => {
        try {
            if (loggedIn) {
                const balanceOf = await purr.methods.balanceOf(Contracts.PurrClaim.addr).call();
                if (balanceOf !== undefined && balanceOf !== null) {
                    setPurrClaimBalance(balanceOf.toString())
                }
            } else {
                const { data: { balance } } = await axios.get(`${VITE_APP_ENDPOINT}purr/balances/${Contracts.PurrClaim.addr}`)
                return setPurrClaimBalance(balance.toString())
            }
        } catch (e) {
            console.log(e)
            return setPurrClaimBalance('0')
        }
    }

    const getUserBalance = async () => {
        try {
            const balanceOf = await purr.methods.balanceOf(loggedIn).call()
            balanceOf && setBalance(balanceOf.toString())
        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        if (loggedIn) {
            getUserBalance()
        }
        getPurrClaimBalance()
    }, [loggedIn])

    const getLink = (linkText: string) => {
        const links: Record<string, string> = {
            'Doodles': 'https://www.doodles.app/',
            'CryptoKitties website': 'https://cryptokitties.co',
            'Kitty.International': 'https://x.com/kittyintl',
            'Dapper Labs': 'https://www.dapperlabs.com/'
        }
        return (
            <a href={links[linkText]} target={'_blank'}>{linkText}</a>
        )
    }

    const scrollToTarget = (targetRef: React.RefObject<HTMLElement>) => {
        if (targetRef.current) {
            targetRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }

    const updateBalances = () => {
        setPurrClaimBalance(undefined)
        setBalance(undefined)
        console.log('i happened')
        if (loggedIn) {
            getUserBalance()
        }
        getPurrClaimBalance()
    }

    // Trigger recalculation when content changes
    useEffect(() => {
        recalculate()
    }, [purrClaimBalance, balance, loggedIn, recalculate])

    return (
        <Router basename={BASE_URL.startsWith('./') ? '/' : BASE_URL}>
            <ScrollToTop />
            <Styled.Background />
            <Styled.Furlin />
            
            {/* Hero Section */}
            <Styled.HeroSection
                ref={setSectionRef(0)}
                offset={sectionOffsets[0] || 0}
                zIndex={1}
            >
                <Logo color={'#FFF'} zIndex={1} />
                <div className='claim'>
                    <h2><Diamond />{'DAY1 / DIAMOND CLAIM'}<Diamond /></h2>
                    <Link to={'/'} onClick={e => {
                        e.preventDefault()
                        scrollToTarget(claimRef)
                    }}>claim now</Link>
                </div>
            </Styled.HeroSection>

            {/* Video Section */}
            <Styled.VideoSection
                ref={setSectionRef(1)}
                offset={sectionOffsets[1] || 0}
                backgroundColor="#FFF"
                zIndex={2}
            >
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
            </Styled.VideoSection>

            {/* Content Section */}
            <Styled.ContentSection
                ref={setSectionRef(2)}
                offset={sectionOffsets[2] || 0}
                backgroundColor="rgba(0,0,0,0.9)"
                zIndex={5}
                minHeight="100vh"
            >
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
            </Styled.ContentSection>

            {/* Video with Text Section */}
            <Styled.VideoTextSection
                ref={setSectionRef(3)}
                offset={sectionOffsets[3] || 0}
                backgroundColor="#000"
                zIndex={5}
            >
                <Styled.VideoContainer>
                    <Styled.VideoBackground2
                        autoPlay
                        loop
                        muted={muted}
                        playsInline
                        src={getAssetPath('purrLaunch.mp4')}
                    />
                    <Styled.MuteButton onClick={() => setMuted(!muted)}>
                        {muted ? '🔇 Unmute' : '🔊 Mute'}
                    </Styled.MuteButton>
                </Styled.VideoContainer>
                <div>
                    <h2>Live from Kitty City</h2>
                    <p>The first <b>$PURR</b> claim - <Link to={'/'} onClick={e => {
                        e.preventDefault()
                        scrollToTarget(claimRef)
                    }}>Day1 / Diamonds</Link> - is now live with <b>$PURR 250,000</b> allocated for eligible claims. <b>$PURR</b> claimants will be given exclusive access to a multiplayer Unreal Engine experience "Kitty City" launching soon.</p>
                    <p>Whether hanging out with other collectors, taking part in competitions, visiting the 8th Anniversary CryptoKitties Exhibition or - wait - is that kitty race track?</p>
                </div>
            </Styled.VideoTextSection>

            {/* White Paper Section */}
            <Styled.WhitePaperSection
                ref={setSectionRef(4)}
                offset={sectionOffsets[4] || 0}
                backgroundColor="#F6F6F6"
                color="#000"
                zIndex={5}
            >
                <h2>WHITE PA-$PURR</h2>
                <p>The <Link to={'https://etherscan.io/address/0x74E9C7f23f11B72b8A7340E11Fe72D93D91fAe8e'} target={'_blank'}><b>$PURR</b> contract</Link> was released on 21st June 2025 with an initial supply equivalent to the <Link to={'https://etherscan.io/token/0x06012c8cf97bead5deae237070f9587f8e7a266d#readContract#F8'} target={'_blank'}>totalSupply()</Link> of CryptoKitties - 2,025,654 - at time / block of launch.
                The contract includes a <Link to={'https://etherscan.io/address/0x74E9C7f23f11B72b8A7340E11Fe72D93D91fAe8e#writeContract#F2'} target={'_blank'}>{'purr()'}</Link> method that can be called by anyone and adds to the <b>$PURR</b> supply on a 1:1 basis with any new CryptoKitties that have been born since the last time this method was called.
                This supply can be halted though: either temporarily if the contract owner calls the <Link to={'https://etherscan.io/address/0x74E9C7f23f11B72b8A7340E11Fe72D93D91fAe8e#writeContract#F5'} target={'_blank'}>{'togglePaws()'}</Link> method and forever if the owner calls the <Link to={'https://etherscan.io/address/0x74E9C7f23f11B72b8A7340E11Fe72D93D91fAe8e#writeContract#F4'} target={'_blank'}>{'stopPurringForever()'}</Link> method.
                However if these methods aren't called (and all CryptoKitties are born one day...) then the maximum potential supply of <b>$PURR</b> would therefore be equal to the maximum potential supply of CryptoKitties: 4,294,967,295.</p>
                <p>In addition to the standard range of ERC20 functionality the contract also includes a <Link to={'https://etherscan.io/address/0x74E9C7f23f11B72b8A7340E11Fe72D93D91fAe8e#readContract#F9'} target={'_blank'}>purrs method</Link> that returns a hz "purring" frequency - so the blockchain actually purrs now! - and is pseudo random so can potentially be used as a game play seed - or maybe just to power a purring machine you might be making... we'll let you decide.</p>
                <p>All <b>$PURR</b> will be distributed via a series of claim contracts and will work in a variety of ways - e.g. the first claim - <Link to={'/'} onClick={e => {
                        e.preventDefault()
                        scrollToTarget(claimRef)
                    }}>Day1 / Diamond</Link> - rewards kitty owners who own either <Link to={'https://www.cryptokitties.co/search?include=sale,sire,other&search=id:1-3365&orderDirection=desc&orderBy=age'} target={'_blank'}>Day1 kitties</Link> (CryptoKitties born on the UTC date the contract launched: 23rd November 2017) or <Link to={'https://www.cryptokitties.co/search?include=sale,sire,other&search=mewtation:diamond&orderDirection=desc&orderBy=age'} target='_blank'>Diamond kitties</Link> - as awarded by <Link to={'https://www.dapperlabs.com/'} target={'_blank'}>Dapper Labs</Link> - that were the first to discover a new (visible) cattribute. Each claim is on a once per kitty / per claim contract basis (regardless of owner) and includes various multipliers e.g. <Link to={'https://www.cryptokitties.co/search?include=sale,sire,other&search=id:1-100&orderDirection=desc&orderBy=age'} target={'_blank'}>Founders</Link> (the first 100 kitties) and <Link to={'https://www.cryptokitties.co/search?include=sale,sire,other&search=type:exclusive&orderDirection=desc&orderBy=age'} target={'_blank'}>Exclusives</Link> qualify for x10 (cumulative) multipliers.</p>
                <p>Puzzles will play a big part in <b>$PURR</b> claims and the <Link to={'https://etherscan.io/address/0x0822465a4Ab614bcC53Efc4AA426729bF5D4C65f'} target={'_blank'}>first claim contract</Link> includes a puzzle (and significant prize) that needs a mystery kitty (or, to be precise, the mystery kitty's owner) to <Link to={'https://etherscan.io/address/0x0822465a4Ab614bcC53Efc4AA426729bF5D4C65f#writeContract#F2'} target={'_blank'}>open a portal</Link> that will allow the owners of Exclusive kitties not born on Day1 to also be included in the <Link to={'/'} onClick={e => {
                        e.preventDefault()
                        scrollToTarget(claimRef)
                    }}>Day1 / Diamond</Link> claim round.
                For those interested in a further technical dig - such as how the claim contract uses merkle trees to identify e.g. Diamond kitties - the <Link to={'https://github.com/halfasecond/geneva'} target={'_blank'}>code for the contracts (and this website)</Link> is open source and built - with love - by...</p>
                <img src={getAssetPath('kittyIntSig.png')} alt={'Kitty International'} />
            </Styled.WhitePaperSection>

            {/* Claim Section */}
            <Styled.ClaimSection
                ref={setClaimRef}
                offset={sectionOffsets[5] || 0}
                zIndex={1}
            >
                <Claim walletAddress={loggedIn}  {...{ cryptokitties, purrClaim, balance, purrClaimBalance, handleSignIn, updateBalances }} />
            </Styled.ClaimSection>

            {/* Explore Section */}
            <Styled.ExploreSection
                ref={setSectionRef(6)}
                offset={sectionOffsets[6] || 0}
                backgroundColor="#F6F6F6"
                color="#000"
                zIndex={5}
            >
                <h2>MORE TO EXPLORE</h2>
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
            </Styled.ExploreSection>

            {/* Final Section */}
            <Styled.FinalSection
                ref={setSectionRef(7)}
                offset={sectionOffsets[7] || 0}
                zIndex={1}
            >
                <Logo color={'#FFF'} zIndex={1} />
                <h4>New Claim Rounds Dropping Soon</h4>
            </Styled.FinalSection>

            <Styled.MetamaskContainer>
                <Metamask {...{ loggedIn, handleSignIn, handleSignOut, token, BASE_URL }} tokenId={undefined} />
            </Styled.MetamaskContainer>
            {loggedIn && (
                <Balance {...{ balance, purr, walletAddress: loggedIn, updateBalance: getUserBalance }} />
            )}
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
