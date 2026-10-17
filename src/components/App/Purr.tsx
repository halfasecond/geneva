import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { BrowserRouter as Router, Link, useLocation } from 'react-router-dom'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'
import Metamask from 'components/Metamask'
import Balance from '../Purr/Balance'
import Claim from '../Purr/Claim'
import Claim2 from '../Purr/Claim2'
import Diamond from '../Purr/Diamond'
import CryptoKitties from '../../contracts/CryptoKitties'
import Contracts from '../../contracts/Purr'
import Logo from '../Purr/Logo'
import { AuthProps } from '../../types/auth'
import { getContract } from '../../utils'
import { getAssetPath } from '../../utils/assetPath'
import gildedGem from '../../kittyFamily/svg/gilded.svg'

const cryptokitties: Contract<AbiFragment[]> = getContract(CryptoKitties.Core.abi, CryptoKitties.Core.addr)
const purr: Contract<AbiFragment[]> = getContract(Contracts.Purr.abi, Contracts.Purr.addr)
const purrClaim: Contract<AbiFragment[]> = getContract(Contracts.PurrClaim.abi, Contracts.PurrClaim.addr)
const purrClaim2 = Contracts.PurrClaim2
    ? getContract(Contracts.PurrClaim2.abi, Contracts.PurrClaim2.addr)
    : undefined
const { VITE_APP_ENDPOINT } = import.meta.env

const EXTERNAL_LINKS: Record<string, string> = {
    'Doodles': 'https://www.doodles.app/',
    'CryptoKitties website': 'https://cryptokitties.co',
    'Kitty.International': 'https://x.com/kittyintl',
    'Dapper Labs': 'https://www.dapperlabs.com/',
}

const ExternalLink = ({ children, href, className = 'purr-link' }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} target="_blank" rel="noreferrer" className={className}>{children}</a>
)

const PurrLink = ({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: (e: React.MouseEvent) => void }) => (
    <Link to={to} onClick={onClick} className="purr-link">{children}</Link>
)

const HeroClaim = ({
    icon,
    title,
    detail,
    onClick,
}: {
    icon: React.ReactNode
    title: string
    detail: string
    onClick: (e: React.MouseEvent) => void
}) => (
    <button
        type="button"
        onClick={onClick}
        className="purr-card group w-full px-6 py-8 md:py-9 text-center
            hover:border-white/40 transition-colors duration-200"
    >
        <div className="flex justify-center mb-5">{icon}</div>
        <h2 className="font-display text-sm md:text-base tracking-wide leading-snug">{title}</h2>
        <p className="mt-2 mb-6 text-xs text-white/55 leading-relaxed">{detail}</p>
        <span className="purr-btn inline-block text-xs md:text-sm px-5 py-2.5">Claim now</span>
    </button>
)

const AppView: React.FC<AuthProps> = ({ handleSignIn, handleSignOut, loggedIn, token, BASE_URL }) => {
    const claimsSectionRef = useRef<HTMLElement>(null)
    const [purrClaimBalance, setPurrClaimBalance] = useState<string | undefined>(undefined)
    const [purrClaim2Balance, setPurrClaim2Balance] = useState<string | undefined>(undefined)
    const [balance, setBalance] = useState<string | undefined>(undefined)

    const scrollToClaims = (e: React.MouseEvent) => {
        e.preventDefault()
        claimsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const getPurrClaimBalance = async () => {
        try {
            const { data: { balance } } = await axios.get(`${VITE_APP_ENDPOINT}purr/balances/${Contracts.PurrClaim.addr}`)
            setPurrClaimBalance(balance.toString())
        } catch (e) {
            console.log(e)
            setPurrClaimBalance('0')
        }
    }

    const getPurrClaim2Balance = async () => {
        if (!Contracts.PurrClaim2) {
            setPurrClaim2Balance('0')
            return
        }
        try {
            const balanceOf = await purr.methods.balanceOf(Contracts.PurrClaim2.addr).call()
            setPurrClaim2Balance(balanceOf ? balanceOf.toString() : '0')
        } catch (e) {
            console.log(e)
            setPurrClaim2Balance('0')
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
        getPurrClaim2Balance()
    }, [loggedIn])

    const updateBalances = () => {
        setPurrClaimBalance(undefined)
        setPurrClaim2Balance(undefined)
        setBalance(undefined)
        if (loggedIn) getUserBalance()
        getPurrClaimBalance()
        getPurrClaim2Balance()
    }

    return (
        <Router basename={BASE_URL.startsWith('./') ? '/' : BASE_URL}>
            <ScrollToTop />
            <div className="purr-app isolate min-h-screen text-white overflow-x-hidden">
                {/* Fixed backgrounds — z-0 inside isolate; negative z-index was rendering behind <body> */}
                <div className="purr-bg-layer purr-bg-pattern" aria-hidden />
                <div className="purr-bg-layer purr-bg-furlin" aria-hidden />

                <div className="purr-content">
                {/* Hero */}
                <section className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-24 pb-24 md:pb-16">
                    <header className="absolute top-0 inset-x-0 flex items-center justify-between px-5 md:px-8 py-4
                        text-[10px] md:text-xs tracking-[0.22em] uppercase text-white/55">
                        <a
                            href="https://kitty.international"
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-purr-pink transition-colors"
                        >
                            Kitty.International
                        </a>
                        <nav className="flex items-center gap-5 md:gap-8">
                            <a
                                href="https://etherscan.io/address/0x74E9C7f23f11B72b8A7340E11Fe72D93D91fAe8e"
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-white transition-colors"
                            >
                                Contract
                            </a>
                            <button
                                type="button"
                                onClick={scrollToClaims}
                                className="bg-transparent border-0 p-0 text-inherit tracking-[0.22em] uppercase
                                    cursor-pointer hover:text-white transition-colors"
                            >
                                Claims
                            </button>
                        </nav>
                    </header>
                    <Logo />
                    <div className="mt-14 md:mt-20 w-full max-w-xl sm:max-w-2xl flex flex-col items-center px-2">
                        <span className="block w-24 h-px bg-gradient-to-r from-transparent via-[#e8d5a3]/70 to-transparent mb-6" />
                        <p className="text-center text-[13px] md:text-[15px] leading-[1.9] tracking-[0.06em] text-[#f0e6c8]
                            [text-shadow:0_0_28px_rgba(0,0,0,0.95),0_2px_16px_rgba(0,0,0,0.9)]">
                            <b className="text-white">$PURR</b> is an{' '}
                            <ExternalLink
                                href="https://etherscan.io/address/0x74E9C7f23f11B72b8A7340E11Fe72D93D91fAe8e"
                                className="border-b border-dotted border-[#e8d5a3]/60 hover:text-purr-pink hover:border-purr-pink transition-colors"
                            >
                                ERC-20
                            </ExternalLink>
                            {' '}on Ethereum, claimable only by CryptoKitties owners
                            and not, at this time, on exchanges.
                        </p>
                        <span className="block w-24 h-px bg-gradient-to-r from-transparent via-[#e8d5a3]/70 to-transparent mt-6" />
                    </div>
                    <div className="mt-8 md:mt-10 grid w-full max-w-xl sm:max-w-2xl grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                        <HeroClaim
                            icon={<Diamond className="w-10 h-10" />}
                            title="DAY1 / DIAMOND"
                            detail="Day1 kitties and Diamonds"
                            onClick={scrollToClaims}
                        />
                        <HeroClaim
                            icon={<img src={gildedGem} alt="" className="w-10 h-10" />}
                            title="GILDED / GRANDMASTER"
                            detail="Gilded kitties · Fancy #1 breeders"
                            onClick={scrollToClaims}
                        />
                    </div>
                </section>

                {/* Video intro */}
                <section className="purr-section bg-white text-neutral-800">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        src={getAssetPath('mabel.mp4')}
                        className="w-full md:w-1/2 md:mx-auto h-[50vh] object-cover mb-12"
                    />
                    <h3 className="font-script text-3xl md:text-4xl text-center text-neutral-700
                        drop-shadow-[2px_2px_3px_rgba(255,255,255,0.5)] mb-12">
                        Murmurare est amare... 🐾
                    </h3>
                    <div className="hidden md:grid grid-cols-2 gap-8 max-w-4xl mx-auto text-neutral-700">
                        {['Consumer & Retail', 'Elegance & Desire', 'Entertainment', 'Innovation'].map((label) => (
                            <h2 key={label} className="font-display text-lg text-center drop-shadow-sm">{label}</h2>
                        ))}
                    </div>
                </section>

                {/* What is $PURR */}
                <section className="purr-section bg-black/90 text-center">
                    <h2 className="font-display text-3xl mb-8 drop-shadow-[2px_2px_3px_rgba(255,255,255,0.4)]">
                        What is $PURR?
                    </h2>
                    <div className="max-w-3xl mx-auto space-y-4 mb-10">
                        {[
                            'the intersection of web3 and entertainment',
                            'the intersection of web3 and consumer retail experience',
                            'the intersection of web3 and innovation',
                            'the intersection of web3 and fun',
                        ].map((line) => (
                            <p key={line}><b>$PURR</b> - {line}</p>
                        ))}
                    </div>
                    <div className="flex justify-center gap-6 mb-10">
                        {[
                            { src: 'kittyInternational.jpg', alt: 'Kitty International' },
                            { src: 'poopie.png', alt: 'Poopie Cat' },
                            { src: 'dapper-wallet.png', alt: 'Dapper Labs' },
                            { src: 'cryptokitties.svg', alt: 'CryptoKitties' },
                        ].map(({ src, alt }) => (
                            <img
                                key={src}
                                src={getAssetPath(src)}
                                alt={alt}
                                className="w-14 h-14 md:w-20 md:h-20 rounded-full"
                            />
                        ))}
                    </div>
                    <p className="max-w-3xl mx-auto mb-4">
                        Launched in 2017, <ExternalLink href={EXTERNAL_LINKS['Kitty.International']}>Kitty.International</ExternalLink>
                        {' '}has been actively developing Apps and Dapps with a focus on real world user cases, gamification, entertainment.... and cats!
                    </p>
                    <p className="max-w-3xl mx-auto">
                        In 2021, shortly before launching <ExternalLink href={EXTERNAL_LINKS['Doodles']}>Doodles</ExternalLink>,
                        Jordan Castro hired Kitty.International to work on the{' '}
                        <ExternalLink href={EXTERNAL_LINKS['CryptoKitties website']}>CryptoKitties website</ExternalLink>
                        {' '}and we have been providing our digital feline services to{' '}
                        <ExternalLink href={EXTERNAL_LINKS['Dapper Labs']}>Dapper Labs</ExternalLink> ever since.
                    </p>
                </section>

                {/* White paper */}
                <section className="purr-section bg-purr-cream text-black">
                    <h2 className="font-display text-2xl md:text-4xl lg:text-5xl text-center mb-10">WHITE PA-$PURR</h2>
                    <div className="max-w-4xl mx-auto space-y-6 leading-8">
                        <p>
                            The <ExternalLink href="https://etherscan.io/address/0x74E9C7f23f11B72b8A7340E11Fe72D93D91fAe8e"><b>$PURR</b> contract</ExternalLink>
                            {' '}was released on 21st June 2025 with an initial supply equivalent to the{' '}
                            <ExternalLink href="https://etherscan.io/token/0x06012c8cf97bead5deae237070f9587f8e7a266d#readContract#F8">totalSupply()</ExternalLink>
                            {' '}of CryptoKitties - 2,025,654 - at time / block of launch.
                            The contract includes a{' '}
                            <ExternalLink href="https://etherscan.io/address/0x74E9C7f23f11B72b8A7340E11Fe72D93D91fAe8e#writeContract#F2">purr()</ExternalLink>
                            {' '}method that can be called by anyone and adds to the <b>$PURR</b> supply on a 1:1 basis
                            with any new CryptoKitties that have been born since the last time this method was called.
                            This supply can be halted though: either temporarily if the contract owner calls the{' '}
                            <ExternalLink href="https://etherscan.io/address/0x74E9C7f23f11B72b8A7340E11Fe72D93D91fAe8e#writeContract#F5">togglePaws()</ExternalLink>
                            {' '}method and forever if the owner calls the{' '}
                            <ExternalLink href="https://etherscan.io/address/0x74E9C7f23f11B72b8A7340E11Fe72D93D91fAe8e#writeContract#F4">stopPurringForever()</ExternalLink>
                            {' '}method.
                            However if these methods aren&apos;t called (and all CryptoKitties are born one day...)
                            then the maximum potential supply of <b>$PURR</b> would therefore be equal to the maximum
                            potential supply of CryptoKitties: 4,294,967,295.
                        </p>
                        <p>
                            In addition to the standard range of ERC20 functionality the contract also includes a{' '}
                            <ExternalLink href="https://etherscan.io/address/0x74E9C7f23f11B72b8A7340E11Fe72D93D91fAe8e#readContract#F9">purrs method</ExternalLink>
                            {' '}that returns a hz &quot;purring&quot; frequency - so the blockchain actually purrs now! -
                            and is pseudo random so can potentially be used as a game play seed - or maybe just to power
                            a purring machine you might be making... we&apos;ll let you decide.
                        </p>
                        <p>
                            All <b>$PURR</b> will be distributed via a series of claim contracts and will work in a variety
                            of ways - e.g. the first claim -{' '}
                            <PurrLink to="/" onClick={scrollToClaims}>Day1 / Diamond</PurrLink>
                            {' '}- rewards kitty owners who own either{' '}
                            <ExternalLink href="https://www.cryptokitties.co/search?include=sale,sire,other&search=id:1-3365&orderDirection=desc&orderBy=age">Day1 kitties</ExternalLink>
                            {' '}(CryptoKitties born on the UTC date the contract launched: 23rd November 2017) or{' '}
                            <ExternalLink href="https://www.cryptokitties.co/search?include=sale,sire,other&search=mewtation:diamond&orderDirection=desc&orderBy=age">Diamond kitties</ExternalLink>
                            {' '}- as awarded by <ExternalLink href="https://www.dapperlabs.com/">Dapper Labs</ExternalLink>
                            {' '}- that were the first to discover a new (visible) cattribute. Each claim is on a once per
                            kitty / per claim contract basis (regardless of owner) and includes various multipliers e.g.{' '}
                            <ExternalLink href="https://www.cryptokitties.co/search?include=sale,sire,other&search=id:1-100&orderDirection=desc&orderBy=age">Founders</ExternalLink>
                            {' '}(the first 100 kitties) and{' '}
                            <ExternalLink href="https://www.cryptokitties.co/search?include=sale,sire,other&search=type:exclusive&orderDirection=desc&orderBy=age">Exclusives</ExternalLink>
                            {' '}qualify for x10 (cumulative) multipliers.
                        </p>
                        <p>
                            The second claim -{' '}
                            <PurrLink to="/" onClick={scrollToClaims}>Gilded / Grandmaster</PurrLink>
                            {' '}- is a separate contract. Gilded kitties pay <b>$PURR 100</b> each to the current
                            owner, once per kitty. Grandmaster awards go to the hatcher of ranking-1 of each Fancy
                            type (shiny counts as that type&apos;s #1) - <b>$PURR 1000</b> once per hatcher address.
                        </p>
                        <p>
                            Puzzles will play a big part in <b>$PURR</b> claims and the{' '}
                            <ExternalLink href="https://etherscan.io/address/0x0822465a4Ab614bcC53Efc4AA426729bF5D4C65f">first claim contract</ExternalLink>
                            {' '}includes a puzzle (and significant prize) that needs a mystery kitty (or, to be precise,
                            the mystery kitty&apos;s owner) to{' '}
                            <ExternalLink href="https://etherscan.io/address/0x0822465a4Ab614bcC53Efc4AA426729bF5D4C65f#writeContract#F2">open a portal</ExternalLink>
                            {' '}that will allow the owners of Exclusive kitties not born on Day1 to also be included in the{' '}
                            <PurrLink to="/" onClick={scrollToClaims}>Day1 / Diamond</PurrLink>
                            {' '}claim round.
                            For those interested in a further technical dig - such as how the claim contract uses merkle
                            trees to identify e.g. Diamond kitties - the{' '}
                            <ExternalLink href="https://github.com/halfasecond/geneva">code for the contracts (and this website)</ExternalLink>
                            {' '}is open source and built - with love - by...
                        </p>
                    </div>
                    <img
                        src={getAssetPath('kittyIntSig.png')}
                        alt="Kitty International"
                        className="w-72 mt-16 mx-auto md:mr-[200px] md:ml-auto block"
                    />
                </section>

                {/* Claims */}
                <section ref={claimsSectionRef} className="purr-section">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8 max-w-7xl mx-auto items-stretch w-full">
                        <div className="min-w-0">
                            <Claim
                                walletAddress={loggedIn}
                                cryptokitties={cryptokitties}
                                purrClaim={purrClaim}
                                balance={balance}
                                purrClaimBalance={purrClaimBalance}
                                handleSignIn={handleSignIn}
                                updateBalances={updateBalances}
                            />
                        </div>
                        <div className="min-w-0">
                            <Claim2
                                walletAddress={loggedIn}
                                cryptokitties={cryptokitties}
                                purrClaim2={purrClaim2}
                                balance={balance}
                                purrClaim2Balance={purrClaim2Balance}
                                handleSignIn={handleSignIn}
                                updateBalances={updateBalances}
                            />
                        </div>
                    </div>
                </section>

                {/* Explore */}
                <section className="purr-section bg-purr-cream text-black">
                    <h2 className="font-display text-lg md:text-2xl lg:text-4xl text-center mb-12">
                        MORE TO EXPLORE WITH YOUR PAW
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
                        {[
                            {
                                img: 'kitty-news.jpg',
                                alt: 'kitty.news',
                                url: 'https://kitty.news',
                                desc: 'Launched in April 2018, kitty.news provides comprehensive data about the history of CryptoKitties in addition to popular floors, recent sales, articles about the game and specialist search tools not available on the ck website.',
                            },
                            {
                                img: 'kitty-family.jpg',
                                alt: 'kitty.family',
                                url: 'https://kitty.family',
                                desc: 'kitty.family originally launched in January 2018 as a tool to show people their CryptoKitties ancestry on the eth blockchain but, over the years, has evolved into a web3 social media site with a chat room exclusive to kitty owners',
                            },
                            {
                                img: 'kitties-tv.jpg',
                                alt: 'kitties.tv',
                                url: 'https://kitties.tv',
                                desc: 'kitties.tv was released in 2024 and is a live stream exclusive to cryptokitties owners. yes - you read that correctly: secure web3 enabled live tv streaming using node-media-server... and cats...',
                            },
                        ].map(({ img, alt, url, desc }) => (
                            <div key={url}>
                                <img
                                    src={getAssetPath(img)}
                                    alt={alt}
                                    className="w-full rounded border border-neutral-300 shadow-md mb-4"
                                />
                                <p className="text-xs font-bold mb-3">
                                    <a href={url} className="hover:text-purr-pink transition-colors">{url.replace('https://', 'www.')}</a>
                                </p>
                                <p className="text-xs leading-relaxed text-neutral-700">{desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <section className="relative min-h-screen flex flex-col items-center justify-center">
                    <Logo />
                    <h4 className="absolute bottom-12 left-0 right-0 font-display text-sm md:text-base text-center
                        drop-shadow-[2px_2px_3px_rgba(255,255,255,0.5)]">
                        New Claim Rounds Dropping Soon
                    </h4>
                </section>
                </div>

                {/* Wallet UI */}
                <div className="fixed bottom-5 left-5 z-[1000]">
                    <Metamask {...{ loggedIn, handleSignIn, handleSignOut, token, BASE_URL }} tokenId={undefined} />
                </div>
                {loggedIn && (
                    <Balance
                        balance={balance}
                        purr={purr}
                        walletAddress={loggedIn}
                        updateBalance={getUserBalance}
                    />
                )}
            </div>
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