import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Styled from './CreateAuction.style'
import Bot from '../Bot'
import Contracts from '../App/contracts'
import BN from 'big.js'
import { toWei } from 'web3-utils'
import { unPadAndFormatPrice, formatDate } from '../../utils/format'
import { Bot as BotType } from '../Bot/bot.types'
import { Auction as AuctionType } from '../../types/auction'

const { VITE_APP_BLOCKEXPLORER } = import.meta.env

interface Props {
    bot: BotType,
    createAuction: (from: string, tokenId: number, startPrice: string, endPrice: string, duration: string) => any;
    approve: (from: string, address: string, tokenId: number) => void;
    getApproved: (tokenId: number) => void;
    loggedIn: string,
    onComplete: () => void;
}

const CreateAuction: React.FC<Props> = ({ bot, createAuction, approve, getApproved, loggedIn, onComplete }) => {
    const [form, setForm] = useState({
        startPrice: '',
        endPrice: '',
        duration: '',
    })
    const [loading, setLoading] = useState(true)
    const [formValid, setFormValid] = useState(false)
    const [approvedForToken, setApprovedForToken] = useState<undefined | any>(undefined)
    const [auction, setAuction] = useState<undefined | AuctionType>(undefined)

    const handleCreateAuction = async (from: string) => {
        try {
            setLoading(true)
            const auction: AuctionType = await createAuction(from, bot.tokenId, form.startPrice, form.endPrice, form.duration)
            setAuction(auction)
        } catch (e) {
            console.log(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        handleGetApproved()
    }, [])

    const handleGetApproved = async () => {
        if (!loading) {
            setLoading(true)
        }
        try {
            const auctionContractIsApprovedForToken = await getApproved(bot.tokenId)
            setApprovedForToken(auctionContractIsApprovedForToken)
        } catch (e) {
            console.log(e)
        } finally {
            setLoading(false)
        }
    }

    const handleSetApprove = async (from: string) => {
        setLoading(true)
        try {
            await approve(from, Contracts.flowbots.auction.addr, bot.tokenId)
            handleGetApproved()
        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        setLoading(false)
        try {
            if (BN(form.startPrice).eq(BN(form.endPrice)) && BN(form.endPrice).gt(BN('0'))) {
                return setFormValid(true)
            }
            if (BN(form.startPrice).gt(BN('0')) && BN(form.endPrice).gt(BN('0')) && BN(form.duration).gt(BN('0'))) {
                return setFormValid(true)
            }
            return setFormValid(false)
        } catch (e) {
            return setFormValid(false)
        }
    }, [form])

    const isDurationDisabled = () => {
        try {
            if (BN(toWei(form.startPrice, 'ether')).gt(BN('0')) && BN(toWei(form.endPrice, 'ether')).gt(BN('0')) && !(form.startPrice === form.endPrice)) {
                return false
            }
            return true
        } catch (e) {
            return true
        }
    }

    const formatAuctionPrice = (_auction: AuctionType) => {
        const { events: { SaleCreated: { returnValues: { startPrice, endPrice } } } } = _auction
        let formattedPrice = unPadAndFormatPrice(startPrice.toString())
        if (startPrice === endPrice) {
            return formattedPrice
        }
        return formattedPrice = formattedPrice + ` - ${unPadAndFormatPrice(endPrice.toString())}`
    }

    const formatAuctionEnds = (_auction: AuctionType) => {
        const { events: { SaleCreated: { returnValues: { endTime } } } } = _auction
        const time = Number(endTime.toString() + '000')
        return formatDate(time)
    }

    return (
        <Styled.Div>
            <h2>{`Sell Flowbot #${bot.tokenId}`}</h2>
            <div>
                <Bot {...{ bot }} lines={true} />
            </div>
            {!(auction === undefined) ? (
                <>
                    <Styled.Form onSubmit={e => {
                        e.preventDefault()
                        onComplete()
                    }}>
                        <h3>Auction Created</h3>
                        <blockquote className={'information'}>
                            {formatAuctionPrice(auction).split('-').length > 1 ? (
                                <>
                                    <p>auction: {formatAuctionPrice(auction)}</p>
                                    <p>ends: {formatAuctionEnds(auction)}</p>
                                </>
                            ) : (
                                <p>price: {formatAuctionPrice(auction)}</p>
                            )}
                            <p>txHash: <Link to={`${VITE_APP_BLOCKEXPLORER}/tx/${auction.transactionHash}`} target={'_blank'}>{auction.transactionHash.slice(0,24)}...</Link></p>
                        </blockquote>
                        <div>
                            <input type={'submit'} value={`🤖 close window 🤖`} disabled={loading} />
                        </div>
                    </Styled.Form>
                </>
                
            ) : (
                approvedForToken && approvedForToken.toLowerCase() === Contracts.flowbots.auction.addr.toLowerCase() ? (
                    <Styled.Form onSubmit={e => {
                        e.preventDefault()
                        handleCreateAuction(loggedIn)
                    }}>
                        <h3>Create auction</h3>
                        <blockquote className={'information'}>To create a 'buy now' sale set an equal start and end price. If your start and end price are different you will also need to set an auction duration.</blockquote>
                        <div>
                            <div>
                                <label htmlFor='startPrice'>start price</label>
                                <input id='startPrice' type={'text'} placeholder={'Ξ'} value={form.startPrice} disabled={loading} onChange={
                                    e => setForm(prevState => ({ ...prevState, startPrice: e.target.value }))
                                } />
                            </div>
                            <div>
                                <label htmlFor='endPrice'>end price</label>
                                <input id={'endPrice'} type={'text'} placeholder={'Ξ'} value={form.endPrice} disabled={loading} onChange={
                                    e => setForm(prevState => ({ ...prevState, endPrice: e.target.value }))
                                } />
                            </div>
                        </div>
                        
                        <div>
                            <div>
                                <label htmlFor='duration'>duration</label>
                                <input id={'duration'} type={'text'} placeholder={'seconds'} value={form.duration} disabled={loading || isDurationDisabled()} onChange={
                                    e => setForm(prevState => ({ ...prevState, duration: e.target.value }))
                                } />
                            </div>
                        </div>
                        <div>
                            <input type={'submit'} value={'🤖 create sale 🤖'} disabled={(loading || !formValid)} />
                        </div>
                    </Styled.Form>
                ) : (
                    approvedForToken === undefined ? (
                        <img src={'/loading.svg'} />
                    ) : (
                        <Styled.Form onSubmit={e => {
                            e.preventDefault()
                            handleSetApprove(loggedIn)
                        }}> 
                            <h3>Approve for auction</h3>
                            <blockquote className={'information'}>Please approve the flowbots auction contract to create an auction for Flowbot #{bot.tokenId}:</blockquote>
                            <div>
                                <input type={'submit'} value={`🤖 approve #${bot.tokenId} for sale 🤖`} disabled={loading} />
                            </div>
                        </Styled.Form>
                    )
                )
            )}
        </Styled.Div>
    )
}

export default CreateAuction