import { useState } from 'react'
import { Link } from 'react-router-dom'
import KittyModal from 'kittyFamily/components/KittyModal'
import { genes } from 'kittyNews/utils'
import * as Styled from './Pfp.style'

const IMG_CDN = 'https://img.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/'
const imgId = (tokenId: number) => (tokenId === 0 ? '--' : tokenId)

interface Props {
    kitty: any
    value: string | undefined,
    eventType: string | 'eth',
}

const formatPrice = (price: string) => {
    const wei = String(price || '0').replace(/^0+/, '') || '0'
    if (!/^\d+$/.test(wei)) return ''
    const padded = wei.padStart(18, '0')
    const whole = padded.slice(0, -18).replace(/^0+/, '') || '0'
    const frac = padded.slice(-18).replace(/0+$/, '')
    const eth = frac ? `${whole}.${frac}` : whole
    const n = Number(eth)
    if (!Number.isFinite(n)) return eth
    return n.toFixed(3).replace(/\.?0+$/, '')
}

const Pfp: React.FC<Props> = ({ kitty: _kitty, value, eventType }) => {
    const [modal, setModal] = useState(false)
    if (!_kitty) return null
    const className = genes[_kitty.g8]?.ec || _kitty.color
    const getSymbol = () => eventType === 'PurrClaim' ? '$PURR ' : 'Ξ'

    const handleClick = (e: any) => {
        e.preventDefault()
        setModal(true)
    }

    return (
        <>
            {modal && (
                <KittyModal
                    kitty={_kitty}
                    hats={_kitty.hats}
                    onClose={() => setModal(false)}
                    priceSymbol={eventType === 'PurrClaim' ? '$PURR ' : 'Ξ'}
                />
            )}
            <Styled.Div className={'kitty-pfp'}>
                <div className={className || undefined}>
                    <img
                        src={`${IMG_CDN}${imgId(_kitty.tokenId)}.png`}
                        alt={`CryptoKitty #${_kitty.tokenId}`}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            const target = e.currentTarget
                            target.onerror = null
                            target.src = `${IMG_CDN}${imgId(_kitty.tokenId)}.svg`
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
