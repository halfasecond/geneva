// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Kitty from 'kittyFamily/components/Kitty'
import closeSrc from 'kittyFamily/svg/close.svg'
import KittyGenes from 'kittyFamily/components/KittyGenes'
import Jewels from 'kittyFamily/components/Jewels2'
import { cooldowns } from 'kittyFamily/utils'
import { API } from 'kittyFamily/api'
import { EYE_COLORS } from 'kittyFamily/style/config'
import * as Styled from './KittyModal.style'

const SIRE = '0xc7af99fe5513eb6710e6d5f44f9989da40f27f26'
const TABS = ['bio', 'genes', 'activity']

const formatEth = (price) => {
    const wei = String(price || '0').replace(/^0+/, '') || '0'
    if (!/^\d+$/.test(wei)) return ''
    const padded = wei.padStart(18, '0')
    const whole = padded.slice(0, -18).replace(/^0+/, '') || '0'
    const frac = padded.slice(-18).replace(/0+$/, '')
    return frac ? `${whole}.${frac}` : whole
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

    const getMewtationsAmount = (_kitty, slot, level) => _kitty[`sl${slot}m${level}`]

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

    return (
        <Styled.Modal
            ref={modalRef}
            onClick={(event) => event.target === event.currentTarget && onClose()}
        >
            <div className={'kitty-detail'}>
                <img className={'close'} src={closeSrc} alt="" onClick={onClose} />
                <div className={`card-art ${kitty.color || ''}`} style={{ backgroundColor: wash }}>
                    <Kitty
                        {...{ kitty, hats, handlePurchase }}
                        showInfo={false}
                        showPrice={Boolean(handlePurchase)}
                        c2aPosition={'top'}
                        getInfo={() => undefined}
                    />
                </div>
                <div className={'card-body'}>
                    <Jewels {...{ kitty }} displayType={'mewtations'} />
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
                                ? <p className={'bio'} dangerouslySetInnerHTML={{ __html: bio }} />
                                : <p className={'stats'}>No bio yet.</p>}
                            {addr && (
                                <p className={'owner'}>
                                    <Link to={`/profile/${addr}`}>{ownerLabel(kitty, profile) || addr}</Link>
                                </p>
                            )}
                        </div>
                    )}
                    {tab === 'genes' && (
                        <div className={'panel'}>
                            <div className={'genes'}>
                                <code>{kitty.genes}</code>
                            </div>
                            <KittyGenes {...{ kitty }} showBinaryGenes={true} defaultOpen={false} />
                        </div>
                    )}
                    {tab === 'activity' && (
                        <div className={'panel'}>
                            <Jewels {...{ kitty }} displayType={'family-jewels'} />
                            {(getMewtationsAmount(kitty, '0', '0') > 0 || getMewtationsAmount(kitty, '0', '1') > 0) && (
                                <p className={'stats'}>
                                    {getMewtationsAmount(kitty, '0', '0') > 0 && `Base ${getMewtationsAmount(kitty, '0', '0')}`}
                                    {getMewtationsAmount(kitty, '0', '1') > 0 && ` · M1 ${getMewtationsAmount(kitty, '0', '1')}`}
                                    {getMewtationsAmount(kitty, '0', '2') > 0 && ` · M2 ${getMewtationsAmount(kitty, '0', '2')}`}
                                    {getMewtationsAmount(kitty, '0', '3') > 0 && ` · M3 ${getMewtationsAmount(kitty, '0', '3')}`}
                                    {getMewtationsAmount(kitty, '0', '4') > 0 && ` · M4 ${getMewtationsAmount(kitty, '0', '4')}`}
                                </p>
                            )}
                            <p className={'stats'}>
                                Owners {kitty.owners?.length || 0}
                                {kitty.offspring ? ` · Offspring ${kitty.offspring}` : ''}
                                {kitty.partners ? ` · Partners ${kitty.partners}` : ''}
                            </p>
                            <p className={'stats'}>Average {avg}</p>
                            {kitty.offspring > 0 && kitty.offspringIds && (
                                <p className={'offspring'}>
                                    {kitty.offspringIds.map((k, i) => (
                                        k.toString() === currentKittyId
                                            ? <Link key={i} to={''} onClick={(e) => { e.preventDefault(); onClose(); }}>#{k}</Link>
                                            : <Link key={i} to={`/kitty/${k}`}>#{k}</Link>
                                    ))}
                                </p>
                            )}
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
