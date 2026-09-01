// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import KittyModalArt from './KittyModalArt'
import closeSrc from 'kittyFamily/svg/close.svg'
import KittyGenes from 'kittyFamily/components/KittyGenes'
import { cooldowns, handleGetBirthday } from 'kittyFamily/utils'
import { API } from 'kittyFamily/api'
import { EYE_COLORS } from 'kittyFamily/style/config'
import * as Styled from './KittyModal.style'

const SIRE = '0xc7af99fe5513eb6710e6d5f44f9989da40f27f26'
const TABS = ['bio', 'genes', 'activity']

const formatEth = (price) => {
    try {
        const wei = String(price || '0').replace(/^0+/, '') || '0'
        if (!/^\d+$/.test(wei)) return ''
        const padded = wei.padStart(18, '0')
        let whole = padded.slice(0, -18).replace(/^0+/, '') || '0'
        const frac18 = padded.slice(-18)
        const head = frac18.slice(0, 8)
        const roundUp = frac18[8] >= '5'
        let fracInt = BigInt(head) + (roundUp ? 1n : 0n)
        if (fracInt === 100000000n) {
            whole = String(BigInt(whole) + 1n)
            fracInt = 0n
        }
        const frac = fracInt.toString().padStart(8, '0').replace(/0+$/, '')
        return frac ? `${whole}.${frac}` : whole
    } catch {
        return ''
    }
}

const formatWhen = (ts) => {
    if (!ts) return ''
    const ms = Number(ts) < 1e12 ? Number(ts) * 1000 : Number(ts)
    const d = new Date(ms)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const ownerAddr = (kitty, profile) => {
    if (typeof kitty?.owner === 'string' && kitty.owner.startsWith('0x')) return kitty.owner
    return profile?.owner?.address || kitty?.owner?.address || ''
}

const ownerLabel = (kitty, profile) => {
    const nick = profile?.owner?.nickname
    const addr = ownerAddr(kitty, profile)
    if (nick) return nick
    if (addr) return addr
    return ''
}

const eventName = (event) => {
    if (event.event === 'AuctionSuccessful' || (event.event === 'Transfer' && event.value && String(event.from).toLowerCase() !== SIRE)) {
        return 'Sale'
    }
    return event.event
}

const Modal = ({ kitty, hats, handlePurchase, onClose, currentKittyId, priceSymbol = 'Ξ' }) => {
    const [tab, setTab] = useState('bio')
    const [bio, setBio] = useState(undefined)
    const [profile, setProfile] = useState(undefined)
    const [events, setEvents] = useState([])
    const modalRef = useRef(null)

    useEffect(() => {
        if (kitty?.tokenId === undefined || kitty?.tokenId === null) return
        axios.get(`https://api.cryptokitties.co/v3/kitties/${kitty.tokenId}`)
            .then(({ data }) => {
                setBio(data.bio)
                setProfile(data)
            })
            .catch((error) => console.error('Error fetching CryptoKitties data:', error))
        axios.get(`${API}/cryptokitties/events?search=id:${kitty.tokenId}`)
            .then(({ data }) => setEvents([...(data.events || [])].reverse()))
            .catch((error) => console.error('Error fetching kitty activity:', error))
    }, [kitty?.tokenId])

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose()
        }
        const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
        document.addEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'hidden'
        document.body.style.paddingRight = `${scrollBarWidth}px`
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'auto'
            document.body.style.paddingRight = '0px'
        }
    }, [onClose])

    const getPBCattributes = (_kitty) => {
        let pb = 0
        ;[0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44].forEach((i) => {
            if (_kitty[`g${i}pb`]) pb++
        })
        return pb
    }

    const cooldown = cooldowns[kitty.status?.cooldown_index] || cooldowns[kitty.cooldownIndex]
    const wash = EYE_COLORS[kitty.color] || EYE_COLORS[profile?.color] || '#f3f1ee'
    const addr = ownerAddr(kitty, profile)
    const sales = events.filter((event) => event.value)
    let avg = 'n-a'
    if (sales.length) {
        let total = 0n
        for (const event of sales) {
            const wei = String(event.value).replace(/^0+/, '') || '0'
            if (/^\d+$/.test(wei)) total += BigInt(wei)
        }
        avg = `${priceSymbol}${formatEth((total / BigInt(sales.length)).toString())}`
    }
    const history = events.filter((event) => !['AuctionSuccessful', 'AuctionCreated'].includes(event.event))
    const fancy = profile?.is_fancy || kitty.is_fancy
    const bornAt = profile?.birthday || profile?.created_at || kitty.created_at || kitty.birthday
    const born = bornAt ? handleGetBirthday(bornAt) : ''
    const geneKitty = {
        ...kitty,
        ...(profile || {}),
        genes: profile?.genes || kitty.genes,
        enhanced_cattributes: profile?.enhanced_cattributes || kitty.enhanced_cattributes || [],
        id: profile?.id || kitty.tokenId || kitty.id,
        tokenId: kitty.tokenId ?? profile?.id,
        is_fancy: profile?.is_fancy ?? kitty.is_fancy,
        is_exclusive: profile?.is_exclusive ?? kitty.is_exclusive,
        is_special_edition: profile?.is_special_edition ?? kitty.is_special_edition,
        is_prestige: profile?.is_prestige ?? kitty.is_prestige,
        fancy_type: profile?.fancy_type || kitty.fancy_type,
        prestige_type: profile?.prestige_type || kitty.prestige_type,
    }

    return (
        <Styled.Modal
            ref={modalRef}
            onClick={(event) => event.target === event.currentTarget && onClose()}
        >
            <div className={'kitty-detail'}>
                <img className={'close'} src={closeSrc} alt="" onClick={onClose} />
                <div className={`card-art ${kitty.color || ''}`} style={{ backgroundColor: wash }}>
                    <KittyModalArt
                        kitty={{
                            ...kitty,
                            tokenId: kitty.tokenId ?? kitty.id,
                            id: kitty.tokenId ?? kitty.id,
                            enhanced_cattributes: kitty.enhanced_cattributes?.length
                                ? kitty.enhanced_cattributes
                                : (geneKitty.enhanced_cattributes || []),
                        }}
                        hats={hats}
                        handlePurchase={handlePurchase}
                        showPrice={Boolean(handlePurchase)}
                    />
                </div>
                <div className={'card-body'}>
                    <h2>
                        <span>#{kitty.tokenId}</span>
                        {kitty.name ? kitty.name : profile?.name || ''}
                    </h2>
                    <h3>
                        Gen{kitty.gen}
                        {cooldown ? ` · ${cooldown}` : ''}
                        {getPBCattributes(kitty) > 0 ? ` · PB×${getPBCattributes(kitty)}` : ''}
                    </h3>
                    <div className={'tabs'} role={'tablist'}>
                        {TABS.map((id) => (
                            <button
                                key={id}
                                type={'button'}
                                role={'tab'}
                                className={tab === id ? 'on' : ''}
                                aria-selected={tab === id}
                                onClick={() => setTab(id)}
                            >
                                {id}
                            </button>
                        ))}
                    </div>
                    {tab === 'bio' && (
                        <div className={'panel'}>
                            {fancy && (
                                <p className={'stats'}>
                                    {profile?.fancy_type || kitty.fancy_type}
                                    {profile?.fancy_ranking ? ` · ${profile.fancy_ranking} of ${profile.fancy_limit}` : ''}
                                    {profile?.variation ? ` · ${profile.variation}` : ''}
                                </p>
                            )}
                            {bio
                                ? <div className={'bio'} dangerouslySetInnerHTML={{ __html: bio }} />
                                : <p className={'stats'}>No bio yet.</p>}
                            {addr && (
                                <p className={'owner'}>
                                    owner: <Link to={`/profile/${addr}`}><b>{ownerLabel(kitty, profile) || addr}</b></Link>
                                </p>
                            )}
                            {born && born !== 'Invalid date' && (
                                <p className={'born'}>born: {born}</p>
                            )}
                            <p className={'stats'}>
                                Owners {kitty.owners?.length || 0}
                                {kitty.offspring ? ` · Offspring ${kitty.offspring}` : ''}
                                {kitty.partners ? ` · Partners ${kitty.partners}` : ''}
                            </p>
                            <p className={'stats'}>Average <b>{avg}</b></p>
                        </div>
                    )}
                    {tab === 'genes' && (
                        <div className={'panel'}>
                            {geneKitty.genes && (
                                <div className={'genes'}>
                                    <code>{geneKitty.genes}</code>
                                </div>
                            )}
                            <KittyGenes kitty={geneKitty} />
                        </div>
                    )}
                    {tab === 'activity' && (
                        <div className={'panel'}>
                            <ul className={'history'}>
                                {history.map((event, i) => (
                                    <li key={`${event.transactionHash}-${event.logIndex}-${i}`}>
                                        <a href={`https://etherscan.io/tx/${event.transactionHash}`} target={'_blank'} rel={'noreferrer'}>
                                            {eventName(event)}
                                            {event.value ? ` · ${priceSymbol}${formatEth(String(event.value).replace(/^0+/, '') || '0')}` : ''}
                                            {event.timestamp ? ` · ${formatWhen(event.timestamp)}` : ''}
                                        </a>
                                        {event.event === 'Transfer' && (
                                            <span>
                                                <a href={`https://etherscan.io/address/${event.from}`} target={'_blank'} rel={'noreferrer'}>{String(event.from).slice(0, 10)}…</a>
                                                {' → '}
                                                <a href={`https://etherscan.io/address/${event.to}`} target={'_blank'} rel={'noreferrer'}>{String(event.to).slice(0, 10)}…</a>
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </Styled.Modal>
    )
}

export default Modal
