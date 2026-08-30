import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { API } from 'kittyNews/api'
import Modal from 'kittyNews/components/Modal'
import FamilyJewels from 'kittyNews/components/FamilyJewels'
import { handleGetCoolDown, formatDateTime, unPadAndFormatPrice, genes } from 'kittyNews/utils'
import BN from 'big.js'
import Contracts from 'kittyNews/utils/contracts/cryptokitties'
import { utils } from 'web3'
import * as Styled from './Pfp.style'

const IMG_CDN = 'https://img.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/'
const imgId = (tokenId: number) => (tokenId === 0 ? '--' : tokenId)

interface Props {
    kitty: any
    value: string | undefined,
    eventType: string | 'eth',
}

const Pfp: React.FC<Props> = ({ kitty: _kitty, value, eventType }) => {
    const [modal, setModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [kitty, setKitty] = useState<any | undefined>(undefined)

    const handleClick = (e: any) => {
        e.preventDefault()
        setModal(true)
    }

    const isTinyBoxCattribute = () => _kitty.g36 === 19
    const className = genes[_kitty.g8].ec

    useEffect(() => {
        const getKitty = async () => {
            setLoading(true)
            try {
                const { data } = await axios.get(`https://api.cryptokitties.co/v3/kitties/${_kitty.tokenId}`)
                const { data: { events, total } } = await axios.get(`${API}/cryptokitties/events?search=id:${_kitty.tokenId}`)
                setKitty({ ..._kitty, ...data, activity: { events: [...events.reverse()], total } })
            } catch (e) {
                console.log(e)
            } finally {
                setLoading(false)
            }
        }
        if (modal) {
            getKitty()
        }
    }, [modal])

    const showShadow = () => kitty && (kitty.is_fancy || kitty.is_special_edition || kitty.is_exclusive) ? '' : ' shadow'
    const getEventName = (event: any) => {
        if (event.event === 'AuctionSuccessful' || (event.event === 'Transfer' && event.value && event.from !== Contracts.Sire.addr)) {
            return 'Sale'
        }
        return event.event
    }

    const formatPrice = (price: string) => {
        let _price = parseFloat(unPadAndFormatPrice(price)).toFixed(3)
        return parseFloat(_price).toString()
    }

    const getSymbol = () => eventType === 'PurrClaim' ? '$PURR ' : 'Ξ'

    const getAveragePrice = (events: any) => {
        let priceTotal = new BN('0')
        const saleEvents = events.filter((event: any) => event.value)
        saleEvents.map((event: any) => {
            priceTotal = priceTotal.add(new BN(event.value.replace(/^0+/, '')))
        })
        const price = saleEvents.length > 0
            ? `${getSymbol()}${parseFloat(parseFloat(utils.fromWei(parseInt(priceTotal.div(new BN(saleEvents.length)).toString()).toString(), 'ether')).toFixed(4)).toString()}`
            : `n-a`
        return price
    }

    return (
        <>
            {modal && (
                <Modal onClose={() => setModal(false)} {...{ className }}>
                    <Styled.Div className={'kitty-info'}>
                        {loading || kitty === undefined ? (
                            <img src={'/images/loading.svg'} alt={''} className={'loading'} />
                        ) : (
                            <>
                                <Styled.ImageContainer 
                                    className={`kitty-image ${showShadow()}${isTinyBoxCattribute() ? ' tinybox' : ''}`}
                                >
                                    <img
                                        src={`${IMG_CDN}${imgId(kitty.tokenId)}.png`}
                                        alt={`CryptoKitty #${kitty.tokenId}`}
                                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                            const target = e.currentTarget;
                                            target.onerror = null; // Reset the onerror to prevent looping
                                            target.src = `${IMG_CDN}${imgId(kitty.tokenId)}.svg`;
                                        }}
                                    />
                                </Styled.ImageContainer>
                                <Styled.AwardContainer style={{ marginTop: '-12px', minHeight: '30px' }}>
                                    <FamilyJewels enhanced_cattributes={kitty.enhanced_cattributes} tokenId={kitty.tokenId} displayType={'mewtations'} />
                                </Styled.AwardContainer>
                                <h2><Link to={`http://cryptokitties.co/kitty/${kitty.tokenId}`} target={`_blank`}>#{kitty.tokenId}</Link></h2>
                                {kitty.is_fancy ? (
                                    <Styled.AwardContainer>
                                        <Styled.Badge>
                                            <div><img src={'/images/icons/fancy.svg'} alt={'Fancy'} /></div>
                                            <div>
                                                <p>{kitty.fancy_type}</p>
                                                <span>{kitty.fancy_ranking} of {kitty.fancy_limit}</span>
                                            </div>
                                        </Styled.Badge>
                                        {kitty.variation && (
                                            <Styled.Badge>
                                                <div><img src={'/images/icons/fancyvariant.svg'} alt={'Fancy Variant'} /></div>
                                                <div>
                                                    <p>{kitty.variation}</p>
                                                    <span>{kitty.variation_ranking} of {kitty.variation_limit}</span>
                                                </div>
                                            </Styled.Badge>
                                        )}
                                    </Styled.AwardContainer>
                                ) : (
                                    <Styled.AwardContainer>
                                        <FamilyJewels enhanced_cattributes={kitty.enhanced_cattributes} tokenId={kitty.tokenId} displayType={'family-jewels'} />
                                    </Styled.AwardContainer>
                                )}
                                <p>{`Gen${kitty.gen} - ${handleGetCoolDown(kitty.cooldownIndex)}`}</p>
                                <p>Owner: <Link 
                                        to={`https://cryptokitties.co/profile/${kitty.owner.address}`}
                                        target='_blank'
                                    >{kitty.owner.nickname ? kitty.owner.nickname : `${kitty.owner.address.slice(0,20)}...`}</Link>
                                </p>
                                <p>Owners: {kitty.owners.length} - Offspring: {kitty.offspring} {kitty.offspring > 0 && (
                                    <>{` - Partners: ${kitty.partners}`}</>
                                )}</p>
                                <p>Average price: {getAveragePrice(kitty.activity.events)}</p>
                                <h3>Kitty Genes</h3>
                                <code>{kitty.genes}</code>
                                
                                <h3>Kitty History</h3>
                                {kitty.activity.events.map((event: any, i: number) => {
                                    let className = '';
                                    if (i === 0) className += 'first'
                                    if (i === kitty.activity.events.length - 1) className += (className ? ' ' : '') + 'last'
                                    return !(['AuctionSuccessful','AuctionCreated'].includes(event.event)) && (
                                        <Styled.Event key={i} {...{ className }}>
                                            <h3>
                                                {event.value ? (
                                                    <Link
                                                        to={`https://etherscan.io/tx/${event.transactionHash}`}
                                                        target={'_blank'}
                                                    >{`${getEventName(event)} - ${getSymbol()}${formatPrice(event.value)} - ${formatDateTime(event.timestamp)}`}</Link>
                                                ) : (
                                                    <Link
                                                        to={`https://etherscan.io/tx/${event.transactionHash}`}
                                                        target={'_blank'}
                                                    >{`${getEventName(event)} - ${formatDateTime(event.timestamp)}`}</Link>
                                                )}
                                                
                                            </h3>
                                            {event.event === 'Transfer' && (
                                                <div>
                                                    <Link
                                                        to={`https://etherscan.io/address/${event.from}`}
                                                        target={'_blank'}
                                                    >{event.from.slice(0, 20)}...</Link>
                                                    {' => '}
                                                    <Link
                                                        to={`https://etherscan.io/address/${event.to}`}
                                                        target={'_blank'}
                                                    >{event.to.slice(0, 20)}...</Link><br />
                                                </div>
                                            )}
                                            {event.event === 'Birth' && (
                                                <div className={'birth'}>hatchedBy: {kitty.hatcher && (
                                                    kitty.hatcher.nickname ? (
                                                        kitty.hatcher.nickname
                                                    ) : (
                                                        kitty.hatcher.address
                                                    ))}</div>
                                            )}
                                        </Styled.Event>
                                    )
                                })}
                            </>
                        )}
                    </Styled.Div>
                </Modal>
            )}
            <Styled.Div className={'kitty-pfp'}>
                <div {...{ className }}>
                    <img
                        src={`${IMG_CDN}${imgId(_kitty.tokenId)}.png`}
                        alt={`CryptoKitty #${_kitty.tokenId}`}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            const target = e.currentTarget;
                            target.onerror = null; // Reset the onerror to prevent looping
                            target.src = `${IMG_CDN}${imgId(_kitty.tokenId)}.svg`;
                        }}
                        onClick={() => setModal(true)}
                        role={'button'}
                    />
                </div>
                <p><Link to={`/kitty/${_kitty.tokenId}`} onClick={handleClick}>#{_kitty.tokenId}</Link></p>
                <p>Gen{_kitty.gen}</p>
                {value && (
                    <p>{getSymbol()}{formatPrice(value)}</p>
                )}
            </Styled.Div>
        </>

    )
}

export default Pfp