// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Kitty from 'kittyFamily/components/Kitty'
import closeSrc from 'kittyFamily/svg/close.svg'
import searchSrc from 'kittyFamily/svg/search.svg'
import KittyGenes from 'kittyFamily/components/KittyGenes'
import Jewels from 'kittyFamily/components/Jewels2'
import { cooldowns } from 'kittyFamily/utils'
import * as Styled from './KittyModal.style'

const Modal = ({ kitty, hats, handlePurchase, onClose, currentKittyId }) => {

    const [showDetails, setShowDetails] = useState(false)
    const [offspring, setOffspring] = useState([])
    const [bio, setBio] = useState(undefined)
  
    useEffect(() => {
        axios.get(`https://api.cryptokitties.co/v3/kitties/${kitty.tokenId}`)
        .then(({ data: { bio }}) => {
          setBio(bio)
        }).catch(error => console.error('Error fetching CryptoKitties data:', error))
    }, [kitty])
      
    const modalRef = useRef(null)

    const handleOverlayClick = (event) => {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
            onClose()
        }
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            onClose()
        }
    }

    const handleScrollBar = (visible) => {
        if (visible) {
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${scrollBarWidth}px`;
        } else {
            document.body.style.overflow = 'auto';
            document.body.style.paddingRight = '0px';
        }
    }

    useEffect(() => {
        document.addEventListener('click', handleOverlayClick)
        document.addEventListener('keydown', handleKeyDown)
        handleScrollBar(true)

        return () => {
            document.removeEventListener('click', handleOverlayClick)
            document.removeEventListener('keydown', handleKeyDown)
            handleScrollBar(false)
        }
    }, [onClose])

    const getPBCattributes = (_kitty) => {
        let pb = 0;
        [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44].forEach(i => {
            if (_kitty[`g${i}pb`]) {
                pb++
            }
        })
        return pb
    }

    const getMewtationsAmount = (_kitty, slot, level) => _kitty[`sl${slot}m${level}`]

    return (
        <Styled.Modal ref={modalRef}>
            <div className={kitty.color}>
                <img src={closeSrc} alt="" onClick={onClose} />
                <div>
                    <Kitty {...{ kitty, hats, handlePurchase }} showInfo={false} c2aPosition='top' getInfo={() => undefined} />
                    <Jewels {...{ kitty }} displayType={'mewtations'} />
                    <h2>#{kitty.tokenId}{kitty.name && ` - ${kitty.name}`}</h2>
                    <h3>Gen{kitty.gen} - {cooldowns[kitty.status.cooldown_index]}</h3>
                    <Jewels {...{ kitty }} displayType={'family-jewels'} />
                    {bio && <p className={'bio'} dangerouslySetInnerHTML={{ __html: bio.replace(kitty.name, `<b>${kitty.name}</b>`) }} />}
                    <div className={'genes'}>
                        <code>{kitty.genes}</code>
                        <img src={searchSrc} alt="" role={'button'} onClick={() => setShowDetails(!showDetails)} />
                    </div>
                    {showDetails && <KittyGenes {...{ kitty }} showBinaryGenes={true} defaultOpen={false} />}
                    {getPBCattributes(kitty) > 0 && <h4>Pure Bred Cattributes: {getPBCattributes(kitty)}</h4>}
                    <h4>
                        <span>{getMewtationsAmount(kitty, '0', '0') > 0 && `Base: ${getMewtationsAmount(kitty, '0', '0')} `}</span>
                        <span>{getMewtationsAmount(kitty, '0', '1') > 0 && `M1: ${getMewtationsAmount(kitty, '0', '1')} `}</span>
                        <span>{getMewtationsAmount(kitty, '0', '2') > 0 && `M2: ${getMewtationsAmount(kitty, '0', '2')} `}</span>
                        <span>{getMewtationsAmount(kitty, '0', '3') > 0 && `M3: ${getMewtationsAmount(kitty, '0', '3')} `}</span>
                        <span>{getMewtationsAmount(kitty, '0', '4') > 0 && `M4: ${getMewtationsAmount(kitty, '0', '4')} `}</span>
                    </h4>
                    <h4>Owners: {kitty.owners.length} - Current Owner: <Link to={`/profile/${kitty.owner}`}>{kitty.owner}</Link></h4>
                    <h4>Offspring: {kitty.offspring}</h4>
                    {kitty.offspring > 0 && <p>{kitty.offspringIds.map((k, i) => (
                        k.toString() === currentKittyId
                            ? <Link key={i} to={``} onClick={e => {
                                e.preventDefault();
                                onClose();
                            }}>{`-#${k} `}</Link>
                            : <Link key={i} to={`/kitty/${k}`}>{`-#${k} `}</Link>
                    ))}</p>}
                </div>
            </div>
        </Styled.Modal> 
    )
}

export default Modal
