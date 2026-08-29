// @ts-nocheck
import React, { useEffect, useState } from 'react'
import KittyHatsGrid from 'kittyFamily/components/KittyHats'
import * as Styled from './KittyHats.style'

const KittyHats = ({ hats: _hats, allHatEvents, loggedIn, searchables, web3, handleHatPurchase, handleHatPurchaseAndApply, handleSignIn }) => {
    const [menuIndex, setMenuIndex] = useState(-1)
    const [hats, setHats] = useState([])
    const [menuItems, setMenuItems] = useState(undefined)

    useEffect(() => {
        if (_hats) {
            if (menuIndex >= 0) {
                setHats(_hats.filter(({ itemType }) => itemType === menuItems[menuIndex]))
            } else {
                setHats(_hats)
            }
            if (menuItems === undefined) {
                setMenuItems([...new Set(_hats.map(hat => hat.itemType))])
            } 
        }
    }, [menuIndex, _hats])

    return (
        <Styled.Div>
            <img src={'/images/kitty-hats/logo.png'} alt={'Kitty Hats'} />
            <h2>Kitty Hats</h2>
            <p>{'What could be better than a cat with a hat? Maybe a cat with an OG a.f. Kitty Hat from 2018? 🙀'}</p>
            <p>{'There are 2 options - either buy the Kitty Hat and apply onto a CryptoKitty you own - or buy the hat and apply it later'}</p>
            <p>{'A CryptoKitty can have more than one hat. If you then remove the hat it is gone forever!'}</p>
            <h3>Hat Types:</h3>
            <ul>{menuItems && menuItems.map((item, i) => 
                <li 
                    key={i}
                    className={i === menuIndex ? 'selected' : undefined}
                    onClick={() => setMenuIndex(i)}
                    role={'button'}
                >{item.replace('(','').replace(')', '')} ({_hats.filter(({ itemType }) => itemType === item).length})</li>
            )}</ul>
            <KittyHatsGrid 
                {...{ hats, allHatEvents, loggedIn, searchables, web3, handleSignIn }} 
                handlePurchase={handleHatPurchase}
                handlePurchaseAndApply={handleHatPurchaseAndApply} 
            />
        </Styled.Div>
    )
}

export default KittyHats
