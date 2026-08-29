import { Fragment, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Confetti from 'kittyInternational/components/Confetti'
import Jewels from 'kittyInternational/components/Jewels'
import PriceC2A from 'kittyInternational/components/PriceC2A'
import Portal from 'kittyInternational/components/Portal'
import meta from 'kittyInternational/components/KittyHats/meta'
import inspect from 'kittyInternational/svg/inspect.svg'
import closeSvg from 'kittyInternational/svg/close.svg'
import { handleGetAbbrBirthday, handleGetBirthday, handleGetCoolDown } from 'kittyInternational/utils'
import { KittyHat, KittyRecord } from 'kittyInternational/types/kitty'
import * as Styled from './Kitty.style'

const hatAsset = (hat: KittyHat) =>
    meta.find((m) => m.contract.toLowerCase() === `Item${hat.itemName}`.toLowerCase())

const uniqueHatsOf = (hats?: KittyHat[]) =>
    hats && hats.length > 0
        ? Object.values(hats.reduce<Record<string, KittyHat>>((unique, hat) => {
            unique[hat.itemName] = hat
            return unique
        }, {}))
        : []

const HatOverlay = ({ hats, onClick }: { hats: KittyHat[]; onClick?: () => void }) => (
    <>
        {hats.map((hat, i) => {
            const hatMeta = hatAsset(hat)
            if (!hatMeta) return null
            return hat.itemName.split('Dada').length === 1
                ? <img key={i} src={`https://kittyhats.co/img/asset/${hatMeta.assetUrl}.svg`} alt={hat.itemName} onClick={onClick} className={'kitty-hat'} />
                : <Fragment key={i}>
                    <img src={'https://kittyhats.co/img/asset/easel.svg'} alt={'easel'} onClick={onClick} className={'kitty-hat'} />
                    <img src={`https://kittyhats.co/img/asset/${hatMeta.assetUrl}.png`} alt={hat.itemName} onClick={onClick} className={'kitty-hat dada'} />
                </Fragment>
        })}
    </>
)

const Kitty = ({
    kitty,
    getInfo,
    handlePurchase,
    showMewts = false,
    showInfo = true,
    c2aPosition = 'top',
    showName = false,
    showBirthday,
}: {
    kitty: KittyRecord
    getInfo?: (tokenId: number) => void
    handlePurchase: (tokenId: number, price: string, sale: boolean) => Promise<boolean>
    hats?: KittyHat[]
    showMewts?: boolean
    showInfo?: boolean
    c2aPosition?: 'top' | 'bottom'
    showName?: boolean
    showBirthday?: boolean
}) => {
    const [purchasing, setPurchasing] = useState(false)
    const [purchased, setPurchased] = useState(false)
    const [modal, setModal] = useState(false)
    const uniqueHats = uniqueHatsOf(kitty.hats)
    const modalOverlayRef = useRef<HTMLDivElement>(null)
    const traits = kitty.enhanced_cattributes || []
    const id = kitty.id ?? kitty.tokenId

    const buy = async (tokenId: number, price: string, sale?: boolean) => {
        if (!sale) {
            console.log('siring coming soon')
            return
        }
        setPurchasing(true)
        try {
            const purchase = await handlePurchase(tokenId, price, sale)
            setPurchasing(false)
            if (purchase) {
                setPurchased(true)
                setModal(true)
            }
        } catch {
            setPurchasing(false)
        }
    }

    useEffect(() => {
        document.body.style.overflow = modal ? 'hidden' : 'auto'
        return () => {
            document.body.style.overflow = 'auto'
        }
    }, [modal])

    useEffect(() => {
        const handleOverlayClick = (event: MouseEvent) => {
            if (modalOverlayRef.current && event.target === modalOverlayRef.current) setModal(false)
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setModal(false)
        }
        document.addEventListener('click', handleOverlayClick)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('click', handleOverlayClick)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    const openInfo = () => getInfo?.(kitty.tokenId)

    return (
        <>
            {modal &&
                <Portal>
                    <Styled.Modal ref={modalOverlayRef}>
                        <div>
                            <img src={closeSvg} alt="" className="close" onClick={() => setModal(false)} />
                            <h2>Congratulations</h2>
                            <p>Your new kitty has arrived! If you would like a hat for your kitty you can <Link to={'https://kitty.family/kitty-hats-marketplace'}>find one here</Link></p>
                            <Styled.Container>
                                <Styled.ImageContainer className={kitty.color} style={{ cursor: getInfo ? 'pointer' : 'default' }}>
                                    <img
                                        src={kitty.image_url_cdn || kitty.image_url}
                                        alt={'Cryptokitty ' + kitty.tokenId}
                                        onClick={openInfo}
                                        onError={({ currentTarget }) => {
                                            currentTarget.onerror = null
                                            currentTarget.src = 'https://img.cn.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/103.png'
                                        }}
                                    />
                                    <HatOverlay hats={uniqueHats} onClick={openInfo} />
                                </Styled.ImageContainer>
                                <h3><img src={'/images/icons/normal.svg'} alt="" /><Link to={`/kitty/${kitty.tokenId}`}>#{kitty.tokenId}{kitty.name && ` - ${kitty.name}`}</Link></h3>
                                <h4>Gen{kitty.gen} - {handleGetCoolDown(kitty.cooldownIndex)}</h4>
                            </Styled.Container>
                        </div>
                    </Styled.Modal>
                    <Confetti />
                </Portal>
            }
            <Styled.Container style={{ opacity: purchased ? 0.6 : 1 }}>
                {kitty.image_url && (
                    <>
                        <Styled.ImageContainer className={kitty.color} style={{ cursor: getInfo ? 'pointer' : 'default' }}>
                            <img
                                src={kitty.image_url}
                                alt={'Cryptokitty ' + kitty.tokenId}
                                onClick={openInfo}
                                onError={({ currentTarget }) => {
                                    currentTarget.onerror = null
                                    currentTarget.src = 'https://img.cn.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/103.png'
                                }}
                            />
                            <HatOverlay hats={uniqueHats} onClick={openInfo} />
                            {kitty.currentPrice && !purchased && (
                                <div className={c2aPosition}>
                                    <PriceC2A
                                        price={kitty.currentPrice}
                                        handleClick={(price) => buy(kitty.tokenId, price, kitty.sale)}
                                        loading={purchasing}
                                        sale={kitty.sale}
                                    />
                                </div>
                            )}
                            {showMewts && (
                                <Styled.Mewtations>
                                    {traits.filter((c) => c.kittyId === kitty.tokenId && c.position === 1).map((_, i) =>
                                        <Styled.Diamond key={i} />
                                    )}
                                    {traits.filter((c) => c.kittyId === kitty.tokenId && (c.position ?? 0) >= 2 && (c.position ?? 0) <= 10).map((_, i) =>
                                        <img src={'/images/icons/gilded.svg'} alt={'Gilded'} key={i} />
                                    )}
                                    {traits.filter((c) => c.kittyId === kitty.tokenId && (c.position ?? 0) >= 11 && (c.position ?? 0) <= 100).map((_, i) =>
                                        <img src={'/images/icons/amethyst.svg'} alt={'Amethyst'} key={i} />
                                    )}
                                    {traits.filter((c) => c.kittyId === kitty.tokenId && (c.position ?? 0) >= 101 && (c.position ?? 0) <= 500).map((_, i) =>
                                        <img src={'/images/icons/lapis.svg'} alt={'Lapis'} key={i} />
                                    )}
                                </Styled.Mewtations>
                            )}
                        </Styled.ImageContainer>
                        {showInfo && kitty.status && (
                            <Styled.Div>
                                <Jewels {...{ kitty }} displayType={'mewtations'} />
                                <div>
                                    <div>
                                        <Link to={`/kitty/${id}`}>#{id}</Link>
                                    </div>
                                    <div>
                                        <img src={inspect} alt="" onClick={openInfo} />
                                    </div>
                                </div>
                                <div>Gen{kitty.gen} - {handleGetCoolDown(kitty.cooldownIndex)}</div>
                                <div>Gen{kitty.gen}</div>
                                <div>{handleGetCoolDown(kitty.cooldownIndex)}</div>
                                <div>{handleGetBirthday(kitty.created_at)}</div>
                                <div>{handleGetAbbrBirthday(kitty.created_at)}</div>
                                <Jewels {...{ kitty }} displayType={'family-jewels'} />
                            </Styled.Div>
                        )}
                        {showName && (
                            <>
                                <h3><img src={'/images/icons/normal.svg'} alt="" /><Link to={`/kitty/${kitty.tokenId}`}>#{kitty.tokenId}{kitty.name && ` - ${kitty.name}`}</Link></h3>
                                <h4>Gen{kitty.gen} - {handleGetCoolDown(kitty.cooldownIndex)}</h4>
                                {showBirthday && <p>Born: {handleGetBirthday(kitty.created_at)}</p>}
                            </>
                        )}
                    </>
                )}
            </Styled.Container>
        </>
    )
}

export default Kitty
