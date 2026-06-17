import { Link } from 'react-router-dom'
import Jewels from '../Jewels/Jewels'
import { getAbbrBirthday, getBirthday, getCooldown, isTinyBoxCattribute } from '../kittyUtils'
import { kittyImageSrc, KITTY_IMAGE_FALLBACK } from '../kittyImage'
import type { Kitty as KittyType } from '../types'
import * as Styled from './Kitty.style'

interface KittyProps {
    kitty?: KittyType
    getInfo?: (id: number) => void
    /** Large gem overlay on the image (bottom-left). Off on family tree. */
    showMewts?: boolean
    showInfo?: boolean
    /** Drop shadow ellipse under the sprite. Off on family tree. */
    showShadow?: boolean
    bgColor?: string
}

const Kitty = ({
    kitty,
    getInfo,
    showMewts = true,
    showInfo = true,
    showShadow = true,
    bgColor,
}: KittyProps) => {
    if (!kitty) return null

    const id = Number(kitty.id ?? kitty.tokenId)
    const imageSrc = kittyImageSrc(kitty)
    const treeImage = !showMewts && !showShadow
    const eyeColorClass = bgColor ?? ''
    const shadowClass =
        showShadow && !(kitty.is_exclusive || kitty.is_fancy || kitty.is_special_edition)
            ? ' shadow'
            : ''
    const tinyboxClass = showShadow && isTinyBoxCattribute(kitty) ? ' tinybox' : ''
    const cattributes = kitty.enhanced_cattributes ?? []
    const showImageMewts = showMewts && cattributes.length > 0

    return (
        <Styled.Container>
            <Styled.ImageContainer
                $tree={treeImage}
                className={`${treeImage ? 'kf-tree-image ' : ''}${eyeColorClass}${shadowClass}${tinyboxClass}`}
                style={{ cursor: getInfo ? 'pointer' : 'default' }}
            >
                <img
                    src={imageSrc}
                    alt={`Cryptokitty ${id}`}
                    onClick={() => getInfo?.(id)}
                    onError={({ currentTarget }) => {
                        currentTarget.onerror = null
                        currentTarget.src = KITTY_IMAGE_FALLBACK
                    }}
                />
                {showImageMewts && cattributes.length > 0 && (
                    <>
                        <Styled.Mewtations>
                            {cattributes
                                .filter((c) => Number(c.kittyId) === id && c.position === 1)
                                .map((_, i) => (
                                    <Styled.Diamond key={`d-${i}`} />
                                ))}
                            {cattributes
                                .filter(
                                    (c) =>
                                        Number(c.kittyId) === id &&
                                        c.position >= 2 &&
                                        c.position <= 10,
                                )
                                .map((_, i) => (
                                    <img
                                        key={`g-${i}`}
                                        src="/kittyFamily/icons/gilded.svg"
                                        alt="Gilded"
                                    />
                                ))}
                            {cattributes
                                .filter(
                                    (c) =>
                                        Number(c.kittyId) === id &&
                                        c.position >= 11 &&
                                        c.position <= 100,
                                )
                                .map((_, i) => (
                                    <img
                                        key={`a-${i}`}
                                        src="/kittyFamily/icons/amethyst.svg"
                                        alt="Amethyst"
                                    />
                                ))}
                            {cattributes
                                .filter(
                                    (c) =>
                                        Number(c.kittyId) === id &&
                                        c.position >= 101 &&
                                        c.position <= 500,
                                )
                                .map((_, i) => (
                                    <img key={`l-${i}`} src="/kittyFamily/icons/lapis.svg" alt="Lapis" />
                                ))}
                        </Styled.Mewtations>
                        <Jewels kitty={kitty} displayType="family-jewels" hideEmpty />
                    </>
                )}
            </Styled.ImageContainer>

            {showInfo && kitty.status && (
                <>
                    <Styled.Div>
                        <Jewels kitty={kitty} displayType="mewtations" />
                        <div>
                            <div>
                                <Link to={`/kitty/${id}`}>#{id}</Link>
                            </div>
                            <div>
                                <img
                                    src="/kittyFamily/icons/inspect.svg"
                                    alt=""
                                    onClick={() => getInfo?.(id)}
                                />
                            </div>
                        </div>
                        <div>
                            Gen{kitty.gen} - {getCooldown(kitty.cooldownIndex)}
                        </div>
                        <div>Gen{kitty.gen}</div>
                        <div>{getCooldown(kitty.cooldownIndex)}</div>
                        <div>{getBirthday(kitty.created_at)}</div>
                        <div>{getAbbrBirthday(kitty.created_at)}</div>
                        <Jewels kitty={kitty} displayType="family-jewels" />
                    </Styled.Div>
                    {kitty.gen !== 0 && (
                        <span>
                            <b>|</b>
                        </span>
                    )}
                </>
            )}
        </Styled.Container>
    )
}

export default Kitty