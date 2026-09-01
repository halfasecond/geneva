// @ts-nocheck
import { Fragment, useState } from 'react'
import PriceC2A from 'kittyFamily/components/PriceC2A'
import Jewels from 'kittyFamily/components/Jewels'
import meta from 'kittyFamily/components/KittyHats/meta'
import { isTinyBoxCattribute } from 'kittyFamily/utils'
import * as Styled from './KittyModalArt.style'

const CK_IMG = 'https://img.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/'
const kittyArt = (kitty) =>
    kitty?.image_url ||
    kitty?.image_url_cdn ||
    `${CK_IMG}${kitty?.tokenId === 0 ? '--' : kitty?.tokenId}.png`

const originId = (c) => Number(c.kittyId)
const kittyId = (kitty) => Number(kitty.tokenId ?? kitty.id)

const KittyModalArt = ({ kitty, hats = [], handlePurchase, showPrice = false }) => {
    const [purchasing, setPurchasing] = useState(false)
    const worn = Array.isArray(kitty?.hats) ? kitty.hats : []
    const uniqueHats = worn.length > 0
        ? Object.values(worn.reduce((uniqueItems, hat) => ((uniqueItems[hat.itemName] = hat), uniqueItems), {}))
        : []
    if (hats && hats.length) uniqueHats.push(hats[0])

    const fancy = kitty.is_exclusive || kitty.is_fancy || kitty.is_special_edition
    const color = kitty.color || ''
    const traits = kitty.enhanced_cattributes || []
    const id = kittyId(kitty)

    const buy = async (tokenId, price) => {
        if (!handlePurchase) return
        setPurchasing(true)
        try {
            await handlePurchase(tokenId, price)
        } finally {
            setPurchasing(false)
        }
    }

    return (
        <Styled.Stage>
            <Styled.Art className={`${color}${fancy ? '' : ' shadow'}${isTinyBoxCattribute(kitty) ? ' tinybox' : ''}`}>
                <img
                    src={kittyArt(kitty)}
                    alt={'Cryptokitty ' + (kitty.tokenId || kitty.id)}
                    onError={({ currentTarget }) => {
                        currentTarget.onerror = null
                        currentTarget.src = `${CK_IMG}103.png`
                    }}
                />
                {uniqueHats.map((hat, i) => {
                    const _meta = meta.find((m) => m.contract.toLowerCase() === `Item${hat.itemName}`.toLowerCase())
                    return hat.itemName.split('Dada').length === 1
                        ? <img key={i} src={`/images/kitty-hats/asset/${_meta.assetUrl}.svg`} alt={hat.itemName} className={`kitty-hat ${_meta.assetUrl}`} />
                        : <Fragment key={i}>
                            <img src={'/images/kitty-hats/asset/easel.svg'} alt={'easel'} className={'kitty-hat easel'} />
                            <img src={`/images/kitty-hats/asset/${_meta.assetUrl}.png`} alt={hat.itemName} className={'kitty-hat dada'} />
                        </Fragment>
                })}
            </Styled.Art>
            {showPrice && (kitty.sale || kitty.sire) && (kitty.currentPrice || kitty.auction?.current_price) && (
                <Styled.Top>
                    <PriceC2A
                        price={kitty.currentPrice || kitty.auction?.current_price}
                        handleClick={(price) => buy(kitty.tokenId, price)}
                        loading={purchasing}
                        sale={kitty.sale}
                    />
                </Styled.Top>
            )}
            {traits.length > 0 && (
                <Styled.Mewtations>
                    {traits.filter((c) => originId(c) === id && c.position === 1).map((d, i) =>
                        <Styled.Diamond key={i} />
                    )}
                    {traits.filter((c) => originId(c) === id && c.position >= 2 && c.position <= 10).map((d, i) =>
                        <img src={'/images/icons/gilded.svg'} alt={'Gilded'} key={i} />
                    )}
                    {traits.filter((c) => originId(c) === id && c.position >= 11 && c.position <= 100).map((d, i) =>
                        <img src={'/images/icons/amethyst.svg'} alt={'Amethyst'} key={i} />
                    )}
                    {traits.filter((c) => originId(c) === id && c.position >= 101 && c.position <= 500).map((d, i) =>
                        <img src={'/images/icons/lapis.svg'} alt={'Lapis'} key={i} />
                    )}
                </Styled.Mewtations>
            )}
            {traits.length > 0 && (
                <Styled.FamilyJewels>
                    <Jewels {...{ kitty }} displayType={'family-jewels'} />
                </Styled.FamilyJewels>
            )}
        </Styled.Stage>
    )
}

export default KittyModalArt
