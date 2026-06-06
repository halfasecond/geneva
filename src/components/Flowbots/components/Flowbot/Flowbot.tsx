import { Link, useParams, useNavigate } from 'react-router-dom'
import React, { useEffect, useState, Fragment } from 'react'
import axios from 'axios'
import traits from '../../utils/traits'
import Bot from '../Bot'
import Countdown from '../Countdown'
import CreateAuction from '../CreateAuction'
import Modal from '../Modal'
import { unPadAndFormatPrice } from '../../utils/format'
import { Bot as BotType } from '../Bot/bot.types'
import Contracts from '../App/contracts'
import { utils } from 'web3'
import BN from 'big.js'
import * as Styled from './Flowbot.style'

const { VITE_APP_ENDPOINT, VITE_APP_BLOCKEXPLORER } = import.meta.env;
const { toWei } = utils

interface Props {
    activeAuction?: number;
    loggedIn: string | undefined;
    countdown: number;
    buyNow: (from: string, tokenId: number, value: string) => void;
    bid: (from: string, tokenId: number, value: string) => void;
    approve: (from: string, address: string, tokenId: number) => void;
    getApproved: (tokenId: number) => void;
    cancelAuction: (from: string, tokenId: number) => void;
    createAuction: (from: string, tokenId: number, startPrice: string, endPrice: string, duration: string) => any,
    endAuction: (from: string) => void;
    handleSignIn: () => void;
}

const Flowbot: React.FC<Props> = ({ activeAuction, loggedIn, countdown, buyNow, bid, endAuction, approve, getApproved, createAuction, cancelAuction, handleSignIn }) => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [bot, setBot] = useState<BotType | undefined>(undefined)
    const [loading, setLoading] = useState<boolean>(false)
    const [userBid, setUserBid] = useState<string>('')
    const [userIncreaseBid, setUserIncreaseBid] = useState<string>('')
    const [bidAcceptable, setBidAcceptable] = useState<boolean>(false)
    const [modal, setModal] = useState<null | React.ReactNode>(null)

    const { arms, head, panel, legs, grill, body } = traits

    useEffect(() => {
        try {
            if (bot && bot.bids && bot.bids.length > 0) {
                if (BN(toWei(userBid, 'ether')).gt(BN(bot.bids[bot.bids.length - 1].amount))) {
                    return setBidAcceptable(true)
                }
            } else {
                if (BN(toWei(userBid, 'ether')).gt(BN('100000000000'))) {
                    return setBidAcceptable(true)
                }
            }
            return setBidAcceptable(false)
        } catch (e) {
            return setBidAcceptable(false)
        }
    }, [userBid, bot])

    useEffect(() => {
        try {
            if (bot && bot.bids && bot.bids.length > 0) {
                const existingBid = bot.bids.find(({ bidder }) => bidder === loggedIn?.toLowerCase())
                const newBid = existingBid && existingBid.amount ? BN(toWei(userIncreaseBid, 'ether')).plus(BN(existingBid.amount)) : undefined
                if (newBid && newBid.gt(BN(bot.bids[bot.bids.length - 1].amount))) {
                    return setBidAcceptable(true)
                }
            } 
            return setBidAcceptable(false)
        } catch (e) {
            return setBidAcceptable(false)
        }
    }, [userIncreaseBid, bot])

    const getBot = async (tokenId: number) => {
        const { data: { data } } = await axios.get(`${VITE_APP_ENDPOINT}/nfts?tokenId=${tokenId}`)
        setBot(data[0])
    }

    useEffect(() => {
        const tokenId = Number(id)
        if (activeAuction !== undefined) {
            if (isNaN(tokenId) || tokenId < 1 || tokenId > activeAuction) {
                navigate('/error')
            } else {
                getBot(tokenId)
            }
        }
    }, [id, activeAuction, navigate])

    const handlePurchase = async () => {
        if (loggedIn && bot) {
            setLoading(true)
            try {
                await buyNow(loggedIn, bot.tokenId, bot.currentPrice.replace(/^0+/, ''))
                await getBot(bot.tokenId)
            } catch (e) {
                console.log(e)
            } finally {
                setLoading(false)
            }
        } else {
            handleSignIn()
        }
    }

    const handleIncreaseBid = async () => {
        if (loggedIn && bot && bidAcceptable) {
            setLoading(true)
            try {
                await bid(loggedIn, bot.tokenId, toWei(userIncreaseBid, 'ether'))
                await getBot(bot.tokenId)
            } catch (e) {
                console.log(e)
            } finally {
                setLoading(false)
                setUserIncreaseBid('')
            }
        }
    }

    const handleBid = async () => {
        if (loggedIn && bot && bidAcceptable) {
            setLoading(true)
            try {
                await bid(loggedIn, bot.tokenId, toWei(userBid, 'ether'))
                await getBot(bot.tokenId)
            } catch (e) {
                console.log(e)
            } finally {
                setLoading(false)
                setUserBid('')
            }
        }
    }

    const handleEndAuction = async () => {
        if (loggedIn && bot) {
            setLoading(true)
            try {
                await endAuction(loggedIn)
                await getBot(bot.tokenId)
            } catch (e) {
                console.log(e)
            } finally {
                setLoading(false)
            }
        }
    }

    const handleCreateAuction = async (from: string, tokenId: number, startPrice: string, endPrice: string, duration: string) => {
        setLoading(true)
        try {
            const auction = await createAuction(from, tokenId, startPrice, endPrice, duration)
            await getBot(tokenId)
            return auction
        } catch (e) {
            console.log(e)
        } finally {
            setLoading(false)
        }
    }

    const handleCancelAuction = async (from: string, tokenId: number) => {
        setLoading(true)
        try {
            const cancel = await cancelAuction(from, tokenId)
            await getBot(tokenId)
            return cancel
        } catch (e) {
            console.log(e)
        } finally {
            setLoading(false)
        }
    }

    const isEqual = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

    return (
        <>
            {modal && modal}
            <Styled.Banner>
                {bot && <Bot {...{ bot }} lines={true} />}
                {bot && activeAuction && bot.tokenId < activeAuction && (
                    <Link to={`/flowbot/${bot.tokenId + 1}`} className={'arrow-forward'}>
                        <img src={'/arrow.svg'} alt={'previous bot'} />
                    </Link>
                )}
                {bot && bot.tokenId > 1 && (
                    <Link to={`/flowbot/${bot.tokenId - 1}`} className={'arrow-back'}>
                        <img src={'/arrow.svg'} alt={'previous bot'} />
                    </Link>
                )}
                {bot && (
                    activeAuction !== bot.tokenId ? (
                        <div className={'c2a'} style={{ opacity: loading ? '0.4' : '1' }}>
                            {bot.forSale ? (
                                loggedIn && isEqual(bot.owner, loggedIn) ? (
                                    <span style={{ opacity: '0.4' }}>{unPadAndFormatPrice(bot.currentPrice)}</span>
                                ) : (
                                    <span onClick={() => !loading && handlePurchase()}>{unPadAndFormatPrice(bot.currentPrice)}</span>
                                )
                            ) : (
                                loggedIn && isEqual(bot.owner, loggedIn) ? (
                                    <span onClick={e => {
                                        e.stopPropagation()
                                        setModal(
                                            <Modal onClose={() => setModal(null)}>
                                                <CreateAuction {...{ bot, loggedIn, approve, getApproved }} onComplete={() => setModal(null)} createAuction={handleCreateAuction} />
                                            </Modal>
                                        )
                                    }}>sell</span>
                                ) : (
                                    <span>make offer</span>
                                )
                            )}
                        </div>
                    ) : (
                        <div className={'c2a'} style={{ opacity: loading ? '0.4' : '1' }}>
                            {bot.bids && bot.bids.length ? (
                                countdown > 0 ? (
                                    <span>Highest bid: {unPadAndFormatPrice(bot.bids[bot.bids.length - 1].amount)}</span>
                                ) : (
                                    <span>Winning bid: {unPadAndFormatPrice(bot.bids[bot.bids.length - 1].amount)}</span>
                                )
                            ) : (
                                countdown > 0 ? (
                                    <span>Bidding open</span>
                                ) : (
                                    <span>Bidding closed</span>
                                )
                            )}
                        </div>
                    )
                )}
            </Styled.Banner>
            {bot && (
                <Styled.Div>
                    <h2>Flowbot #{bot.tokenId}</h2>
                    {activeAuction === bot.tokenId && countdown > 0 && (
                        <>
                            <h3>Bidding open:</h3>
                            <table style={{ opacity: loading ? '0.4' : 1 }}>
                                <thead>
                                    <tr>
                                        <td>bid</td>
                                        <td>bidder</td>
                                        <td>txHash</td>
                                        <td>timestamp</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bot.bids && [...bot.bids].reverse().map(({ bidder, amount, txHash, timestamp }, i) => 
                                        <tr key={i}>
                                            <td>{unPadAndFormatPrice(amount)}</td>
                                            <td>{bidder}</td>
                                            <td><Link to={`${VITE_APP_BLOCKEXPLORER}${txHash}`}>{txHash}</Link></td>
                                            <td>{timestamp}</td>
                                        </tr>
                                    )}
                                    {!bot.bids.length && (
                                        <tr>
                                            <td colSpan={4}><i>There are currently no bids for this Flowbot</i></td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {bot.bids.find(({ bidder }) => bidder === loggedIn?.toLowerCase()) === undefined ? (
                                <Styled.Form onSubmit={e => {
                                    e.preventDefault()
                                    handleBid()
                                }}>
                                    <div>
                                        <input type={'text'} value={`Ξ${userBid}`} onChange={e => setUserBid(e.target.value.replace('Ξ',''))} placeholder={'Ξ'} />
                                        <input type={'submit'} disabled={!bidAcceptable || loading} value={'submit bid'} />
                                    </div>
                                </Styled.Form>
                            ) : (
                                <Styled.Form onSubmit={e => {
                                    e.preventDefault()
                                    handleIncreaseBid()
                                }}>
                                    <div>
                                        <input type={'text'} disabled={loading} value={`Ξ${userIncreaseBid}`} onChange={e => setUserIncreaseBid(e.target.value.replace('Ξ',''))} placeholder={'Ξ'} />
                                        <input type={'submit'} disabled={!bidAcceptable || loading} value={'increase bid'} />
                                    </div>
                                </Styled.Form>
                            )}
                            <h3>Bidding ends:</h3>
                            <Countdown {...{ countdown }} />
                            <blockquote className={'flex-column information'}>
                                <h3>Bidding Information</h3>
                                <p>All bids must be greater than the current highest bid by at least the minimum increment: currently Ξ0.001. 
                                If your bid is eventually unsuccessful your funds will be returned in addition to a cut of the eventual flowbot sale. 
                                You can also increase any existing bids but note that any increase will be added to your existing bid.</p>
                            </blockquote>
                        </>
                        
                    )}
                    {activeAuction === bot.tokenId && countdown === 0 && bot.bids.length > 0 && bot.bids[bot.bids.length - 1].bidder === loggedIn?.toLowerCase() && (
                        <Styled.Form onSubmit={e => {
                            e.preventDefault()
                            handleEndAuction()
                        }}>
                            <div>
                                <input type={'submit'} value={'🤖 Claim your Flowbot 🤖'} disabled={loading} />
                            </div>
                        </Styled.Form>
                    )}
                    {activeAuction === bot.tokenId && countdown === 0 && bot.bids && !bot.bids.length && loggedIn && (
                        <Styled.Form onSubmit={e => {
                            e.preventDefault()
                            handleEndAuction()
                        }}>
                            <div>
                                <input type={'submit'} value={'🤖 Start Next Auction 🤖'} disabled={loading} />
                            </div>
                        </Styled.Form>
                    )}
                    <h3>Specifications:</h3>
                    <ul>
                        <div>
                            <li><span>Utility</span><span>{arms[bot.arms]}</span></li>
                            <li><span>Top Speed</span><span>{grill[bot.grill]}</span></li>
                            <li><span>Current State</span><span>{head[bot.head]}</span></li>
                            <li><span>Body</span><span>{body[bot.body]}</span></li>
                        </div>
                        <div>
                            <li><span>Feature</span><span>{panel[bot.panel]}</span></li>
                            <li><span>Legs</span><span>{legs[bot.legs]}</span></li>
                            <li><span>Power</span><span>{bot.power}%</span></li>
                            <li><span>Luck</span><span>{bot.luck}</span></li>
                        </div>
                    </ul>
                    {bot.awards.length > 0 && (
                        <>
                            <h3>Special Features:</h3>
                            <blockquote>
                                {bot.awards.map((award: string, i: number) => {
                                    return <Fragment key={i}><img src={`/${award.toLowerCase()}.svg`} />{award}</Fragment>
                                })}
                            </blockquote>
                        </>
                    )}
                    <h3>Owner:</h3>
                    <blockquote>{bot.owner === Contracts.flowbots.auction.addr ? 'Factory Manager' : bot.owner}</blockquote>
                    {bot.forSale && loggedIn && isEqual(bot.owner, loggedIn) &&  (
                        <>
                            <h3>Bot Auction</h3>
                            <Styled.Form onSubmit={e => {
                                e.preventDefault()
                                handleCancelAuction(loggedIn, bot.tokenId)
                            }}>
                                <div>
                                    <input type={'submit'} value={'🤖 Cancel Sale 🤖'} disabled={loading} />
                                </div>
                            </Styled.Form>
                        </>
                    )}
                </Styled.Div>
            )}
        </>

    )
}

export default Flowbot