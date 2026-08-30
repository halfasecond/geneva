// @ts-nocheck
import { useRef, useState, useEffect } from 'react'
import axios from 'axios'
import Kitty from 'kittyFamily/components/Kitty'
import PriceC2A from 'kittyFamily/components/PriceC2A'
import * as Styled from './KittyHats.style'
import { fromWei } from 'web3-utils'
import SearchBar from 'kittyFamily/components/SearchBar'
import backSrc from 'kittyFamily/svg/back.svg'
import closeSrc from 'kittyFamily/svg/close.svg'
import bug from 'kittyFamily/svg/bug.svg'
import Pagination from 'kittyFamily/components/Pagination'
import { isValidSearchTerm, searchTermWhitelist, makeApiUrl } from './utils'
import { API } from 'kittyFamily/api'

const KittyHats = ({ hats, loggedIn, searchables, handlePurchase: _purchase, handlePurchaseAndApply: _purchaseAndApply, handleSignIn }) => {
    const [modal, setModal] = useState(false)
    const [purchasing, setPurchasing] = useState(false)
    const [kitty, setKitty] = useState(undefined)
    const [hat, setHat] = useState(undefined)
    const modalOverlayRef = useRef(null)

    useEffect(() => {
        if (modal || kitty) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }
        return () => {
            document.body.style.overflow = 'auto'
        }
    }, [modal, kitty])

    const handleOverlayClick = (event) => modalOverlayRef.current && event.target === modalOverlayRef.current && closeModal()
    const handleKeyDown = (event) => event.key === 'Escape' && closeModal() // Attach a keydown event listener to close the modal on pressing the "Escape" key

    const closeModal = () => {
        setKitty(undefined)
        setHat(undefined)
    }

    useEffect(() => {
        document.addEventListener('click', handleOverlayClick)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('click', handleOverlayClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [setKitty, setHat])

    const handlePurchase = async (hat, item, value) => {
        setPurchasing(true)
        const purchase = await _purchase(item, value)
        if (purchase) {
            setModal(false)
            setPurchasing(false)
            setHat(hat)
        } else {
            setPurchasing(false)
        }
    }

    const handlePurchaseAndApply = async (kitty, item, value, hats) => {
        setPurchasing(true)
        const purchase = await _purchaseAndApply(kitty.tokenId, item, value)
        if (purchase) {
            setModal(false)
            setPurchasing(false)
            setKitty({ kitty, hats })
        } else {
            setPurchasing(false)
        }
    }

    return (
        <>
            {modal && <Modal hat={modal} onClose={() => setModal(false)} {...{ handlePurchase, handlePurchaseAndApply, handleSignIn, loggedIn, purchasing, searchables }} />}
            {hat && (
                <Styled.Modal3 ref={modalOverlayRef}>
                    <div>
                        <img className={'close'} src={closeSrc} alt="" onClick={() => setHat(undefined)} />
                        <h2>{'Congratulations'}</h2>
                        <p>Your new hat looks great!</p>
                        <div
                            style={{ backgroundImage: `url('https://img.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/252931.svg')` }}
                            onClick={() => undefined} role={'button'}
                        >
                            {hat.artistName && hat.artistName.includes('@Dada')
                                ?
                                <>
                                    <img src={`/images/kitty-hats/asset/easel.svg`} className={'kitty-hat easel'} />
                                    <img src={`/images/kitty-hats/asset/${hat.assetUrl}.png`} className={'kitty-hat dada'} />
                                </>
                                :
                                <img src={`/images/kitty-hats/asset/${hat.assetUrl}.svg`} />
                            }
                        </div>
                        <div>
                            <h3>🎩&nbsp;&nbsp;<a href={`https://etherscan.io/address/${hat.tokenAddress}`} target={'_blank'}>{hat.itemName}</a> {`(${hat.amount})`}</h3>
                            <h4><a href={`https://etherscan.io/address/${hat.artist}`} target={'_blank'}>{hat.artistName ? hat.artistName : hat.artist}</a></h4>
                        </div>
                    </div>
                </Styled.Modal3>
            )}
            {kitty && (
                <Styled.Modal2 ref={modalOverlayRef}>
                    <div>
                        <img className={'close'} src={closeSrc} alt="" onClick={() => setKitty(false)} />
                        <h2>{'Congratulations'}</h2>
                        <p>Your kitty's new hat looks great!</p>
                        <Kitty kitty={kitty.kitty} showMewts={true} hats={kitty.hats} bgColor={kitty.kitty.color} showInfo={false} showName={true} />
                    </div>
                    
                </Styled.Modal2>
            )}
            <Styled.Div>
                {hats && hats.map(({ amount, artist, artistName, assetUrl, contract, itemName, itemType, price, split, tokenAddress, totalFund, available }, i) => {
                    const isDisabled = contract === 'ItemBellaBalloon'
                    const minted = 0 //allHatEvents.filter(({ itemName }) => itemName === contract.replace('Item', '')).length
                    const soldOut = minted >= amount || available <= 0
                    return (
                        <div key={i} style={{ cursor: isDisabled || soldOut ? 'default' : 'pointer' }}>
                            <div
                                onClick={() => !isDisabled && !soldOut && setModal(hats[i])} role={'button'}
                                style={{ opacity: isDisabled || soldOut ? 0.4 : 1 }}
                            >
                                <img src={'https://img.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/252931.svg'} />
                                {artistName && artistName.includes('@Dada')
                                    ?
                                    <>
                                        <img src={`/images/kitty-hats/asset/easel.svg`} className={'kitty-hat easel'} />
                                        <img src={`/images/kitty-hats/asset/${assetUrl}.png`} className={'kitty-hat dada'} />
                                    </>
                                    :
                                    <img src={`/images/kitty-hats/asset/${assetUrl}.svg`} className={`kitty-hat ${assetUrl}`} />
                                }
                                <PriceC2A {...{ price }} handleClick={() => !isDisabled && !soldOut && setModal(hats[i])} />
                            </div>
                            {soldOut && <img src={'/images/soldOut.png'} alt={'Sold Out'} />}
                            {isDisabled && <img src={bug} className={'bug'} alt={'Bugged'} />}
                            <h3>🎩&nbsp;&nbsp;<a href={`https://etherscan.io/address/${tokenAddress}`} target={'_blank'}>{itemName}</a> </h3>
                            {!isDisabled && <h3>available: {available} {`(of ${amount})`}</h3>}
                            <h4><a href={`https://etherscan.io/address/${artist}`} target={'_blank'}>{artistName ? artistName : artist}</a></h4>
                        </div>
                    )
                })}
            </Styled.Div>
        </>
    )
}

const Modal = ({
    hat, hat: { address, amount, artist, artistName, assetUrl, contract, itemName, itemType, price, split, tokenAddress, totalFund },
    handlePurchase, handlePurchaseAndApply, handleSignIn, purchasing, searchables, loggedIn, onClose
}) => {
    hat.itemName = contract.replace('Item', '')
    const [selectKitties, setSelectKitties] = useState(false)
    const [total, setTotal] = useState(undefined)
    const [hats, setHats] = useState(undefined)
    const [selectedKitty, setSelectedKitty] = useState(false)
    const [results, setResults] = useState(undefined)
    const [search, setSearch] = useState({ include: { sale: true, sire: true, other: true }, page: 1, orderBy: 'age', orderDirection: 'asc', account: loggedIn, virgin: false })

    const modalOverlayRef = useRef(null)

    useEffect(() => {
        const getKitties = async () => {
            modalOverlayRef.current && modalOverlayRef.current.firstChild.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
            const { data: { kitties, total } } = await axios.get(`${API}/cryptokitties/nfts?${makeApiUrl(search)}`)
            const ids = kitties.map(({ tokenId }) => tokenId).join(',')
            axios.get(`https://api.cryptokitties.co/v3/kitties?search=id:${ids}&limit=20`).then(async ckResult => {
                const { data: { kitties: ckData } } = ckResult
                const _kitties = kitties.map(kitty => {
                    return { ...ckData.find(ck => ck.id === kitty.tokenId), ...kitty };
                })
                setResults(_kitties)
                setTotal(total)
            })
        }
        if (selectKitties && loggedIn) {
            getKitties()
        }
    }, [selectKitties, loggedIn, search])

    const handleOverlayClick = (event) => modalOverlayRef.current && event.target === modalOverlayRef.current && onClose()
    const handleKeyDown = (event) => event.key === 'Escape' && onClose() // Attach a keydown event listener to close the modal on pressing the "Escape" key

    const specialTerms = ['fancy', 'exclusive', 'specialedition', 'shinyfancy']
    const addTerm = (description, sType) => {
        const _search = { ...search }
        _search['page'] = 1
        if (sType) {
            if (specialTerms.includes(sType)) {
                specialTerms.forEach((type) => {
                    if (_search[type] && sType !== _search[type]) delete _search[type]
                })
                _search.type = sType
                _search[sType] = description
                _search['mewtation'] && delete _search['mewtation']
                _search['terms'] && delete _search['terms']
                addSearch(_search)
            } else {
                if (searchTermWhitelist.includes(sType)) {
                    _search[sType] = description
                    addSearch(_search)
                } else {
                }
            }
        } else {
            const searchable = searchables.find((s) => s.description === description)
            if (searchable) {
                _search.terms = _search.terms || []
                delete _search['type']
                specialTerms.forEach((type) => {
                    delete _search[type]
                })
                const sameTypeTerms = searchables
                    .filter(({ type }) => type === searchable.type)
                    .map((s) => s.description)
                _search.terms = _search.terms.filter((term) => !sameTypeTerms.includes(term))
                _search.terms.push(description)
            }
            addSearch(_search)
        }
    }

    const formatSearchInputDisplay = (_search) =>
        formatTags(_search)
            .map((s) => {
                if (s === 'terms') {
                    return search[s].join(' ');
                } else {
                    if (!(s === 'pto' || s === 'pfrom' || (s === 'type' && search[s] === 'normal'))) {
                        return [...specialTerms, 'purrstige'].includes(s) ? `${search[s]}` : `${s}:${search[s]}`;
                    }
                }
                return undefined;
            })
            .filter((item) => item !== undefined)
            .join(' ');

    const formatTags = (_search) =>
        Object.keys(search).filter(
            (s) =>
                (searchTermWhitelist.includes(s) &&
                    !['virgin'].includes(s) &&
                    !(['account'].includes(s) && _search[s] === loggedIn)) ||
                s === 'terms',
        )

    const handleSearchSubmit = (searchQuery) => {
        const _search = { ...search }
        _search.terms = []
        const searchTerms = searchQuery.trim().split(/\s+/)
        searchTerms.forEach((term) => {
            const searchable = searchables.find((s) => s.description === term)
            if (searchable) {
                const sameTypeTerms = searchables
                    .filter(({ type }) => type === searchable.type)
                    .map((s) => s.description)
                if (specialTerms.includes(searchable.type)) {
                    const termType = searchable.type
                    _search[termType] = term
                } else {
                    _search.terms = _search.terms.filter((term) => !sameTypeTerms.includes(term))
                    _search.terms.push(term)
                }
                specialTerms.forEach((type) => {
                    delete _search[type]
                })
            } else {
                const [termType, termValue] = term.split(':')
                if (isValidSearchTerm(termType)) {
                    if (specialTerms.includes(termType)) {
                        specialTerms.forEach((type) => {
                            if (_search[type] && termType !== _search[type]) delete _search[type]
                        })
                        _search.type = termType
                        _search[termType] = termValue
                        _search['mewtation'] && delete _search['mewtation']
                        _search['terms'] && delete _search['terms']
                    } else {
                        if (searchTermWhitelist.includes(termType)) {
                            _search[termType] = termValue
                        }
                    }
                }
            }
        })
        addSearch(_search)
    }

    const handleSearchClear = () => {
        const _search = {}
        _search.include = search.include
        _search.orderBy = search.orderBy
        _search.orderDirection = search.orderDirection
        _search.virgin = search.virgin
        _search.page = 1
        if (search.account === loggedIn) {
            _search.account = search.account
        }
        addSearch(_search)
    }

    const addSearch = (_search) => setSearch(_search)

    useEffect(() => {
        document.addEventListener('click', handleOverlayClick)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('click', handleOverlayClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose])

    return (
        <Styled.Modal ref={modalOverlayRef} wider={selectKitties && !selectedKitty}>
            <div>
                <img src={closeSrc} alt="" onClick={onClose} />
                {selectKitties && <img src={backSrc} alt="" onClick={() => (setSelectKitties(false), setSelectedKitty(false))} />}
                {selectKitties ? selectedKitty ?
                    (
                        <Styled.KittyWithHatPreview>
                            <Kitty kitty={selectedKitty} hats={[hat]} showMewts={true} showInfo={false} bgColor={selectedKitty.color} c2aPosition={'top'} />
                            <h3>Apply {hat.itemName} to Kitty #{selectedKitty.tokenId}</h3>
                            <img src={'/images/kitty-hats/logo.png'} alt={'Kitty Hats'} />
                            <button disabled={purchasing} onClick={() => handlePurchaseAndApply(selectedKitty, contract, price, [hat])}>Buy Item and Apply Ξ{fromWei(price, 'ether')}</button>
                            <ol>
                                <li><b>Buy Item and Apply</b> will add this Kitty Hat to this CryptoKitty</li>
                                <li>If you change your mind you can remove the hat but it will be lost forever... 🙀</li>
                            </ol>
                        </Styled.KittyWithHatPreview>
                    ) : (
                        <>
                            <Styled.Grid>
                                <header>
                                    <h3>Select a Kitty to wear the hat:</h3>

                                    <SearchBar
                                        suggestions={searchables}
                                        searchQuery={formatSearchInputDisplay(search)}
                                        onSearchSuggestionSelect={({ description }) => addTerm(description)}
                                        onSearchSubmit={handleSearchSubmit}
                                        onSearchClear={handleSearchClear}
                                        disabled={!search}
                                        {...{ location }}
                                    />
                                </header>
                                {results && results.map((kitty, i) =>
                                    <Kitty key={i} {...{ kitty }}
                                        hats={[hat]}
                                        c2aPosition={'top'}
                                        showMewts={true}
                                        showInfo={false} bgColor={kitty.color} getInfo={() => setSelectedKitty(kitty)}
                                    />
                                )}
                                {total && <Pagination
                                    showPages
                                    currentPage={search.page}
                                    totalPages={Math.ceil(total / 20)}
                                    maxPages={10}
                                    onChange={page => setSearch({ ...search, page })}
                                />}
                            </Styled.Grid>


                        </>
                    )
                    : (
                        <Styled.KittyHat>
                            <div>
                                <img src={'https://img.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/252931.svg'} />
                                {artistName && artistName.includes('@Dada')
                                    ?
                                        <>
                                            <img src={`/images/kitty-hats/asset/easel.svg`} className={'kitty-hat easel'} />
                                            <img src={`/images/kitty-hats/asset/${hat.assetUrl}.png`} className={'kitty-hat dada'} />
                                        </>
                                    :
                                        <img src={`/images/kitty-hats/asset/${hat.assetUrl}.svg`} />
                                }
                            </div>
                            <h3><a href={`https://etherscan.io/address/${tokenAddress}`} target={'_blank'}>{itemName}</a> {`(${amount})`}</h3>
                            <h4><a href={`https://etherscan.io/address/${artist}`} target={'_blank'}>{artistName}</a> - {itemType}</h4>
                            <div>
                                <div>
                                    <img src={'/images/kitty-hats/logo.png'} alt={'Kitty Hats'} />
                                    <button disabled={purchasing} onClick={() => handlePurchase(hat, contract, price)}>Buy Item Ξ{fromWei(price, 'ether')}</button>
                                </div>
                                <div>
                                    <img src={'/images/kitty-hats/logo.png'} alt={'Kitty Hats'} />
                                    <button disabled={purchasing} onClick={() => loggedIn ? setSelectKitties(true) : handleSignIn()}>Buy Item and Apply Ξ{fromWei(price, 'ether')}</button>
                                </div>
                            </div>
                            <p>There are 2 options for buying a Kitty Hat:</p>
                            <ol>
                                <li>1. <b>Buy Item</b> purchases the Kitty Hat - you can decide which kitty will wear it later</li>
                                <li>2.<b>Buy Item and Apply</b> requires you to select a CryptoKitty you own to wear the hat</li>
                                <li>You can remove the hat but it will be lost forever... 🙀</li>
                            </ol>
                        </Styled.KittyHat>
                    )}

            </div>
        </Styled.Modal>
    )
}

export default KittyHats