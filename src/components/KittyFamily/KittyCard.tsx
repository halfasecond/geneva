import { Link } from 'react-router-dom'
import Jewels from './Jewels'
import { kittyImageSrc, KITTY_IMAGE_FALLBACK } from './kittyImage'
import { getCooldown } from './kittyUtils'
import type { Kitty } from './types'

type KittyCardSize = 'hero' | 'parent' | 'grandparent' | 'ancestor'
type BranchSide = 'left' | 'right'
type PairIndex = 0 | 1

const SLOT_CLASSES: Record<KittyCardSize, string> = {
    hero: 'kf-kitty-slot-hero',
    parent: 'kf-kitty-slot-parent',
    grandparent: 'kf-kitty-slot-grandparent',
    ancestor: 'kf-kitty-slot-ancestor',
}

interface KittyCardProps {
    kitty?: Kitty
    size?: KittyCardSize
    branch?: BranchSide
    pairIndex?: PairIndex
}

const KittyCard = ({ kitty, size = 'parent', branch, pairIndex }: KittyCardProps) => {
    const branchClass = branch ? `kf-kitty-branch-${branch}` : ''
    const pairClass = pairIndex !== undefined ? `kf-kitty-pair-${pairIndex}` : ''

    if (!kitty) {
        return (
            <div
                className={`${SLOT_CLASSES[size]} kf-kitty-card kf-kitty-card--${size} ${branchClass} ${pairClass}`}
                aria-hidden
            />
        )
    }

    const showShadow = !kitty.is_exclusive && !kitty.is_fancy && !kitty.is_special_edition
    const isTinyBox = kitty.g36 === 19
    const jewelSize = size === 'hero' ? 'lg' : size === 'ancestor' ? 'sm' : 'md'

    return (
        <div
            className={`${SLOT_CLASSES[size]} kf-kitty-card kf-kitty-card--${size} ${branchClass} ${pairClass}`}
        >
            <div className="relative w-full">
                <div
                    className={`kf-kitty-image kf-kitty-image--${size} ${
                        showShadow ? `kf-kitty-shadow${isTinyBox ? ' kf-kitty-shadow-tinybox' : ''}` : ''
                    }`}
                >
                    <Link to={`/kitty/${kitty.tokenId}`} className="block">
                        <img
                            src={kittyImageSrc(kitty)}
                            alt={`CryptoKitty #${kitty.tokenId}`}
                            className="relative z-[1] block w-full"
                            loading="lazy"
                            onError={({ currentTarget }) => {
                                currentTarget.onerror = null
                                currentTarget.src = KITTY_IMAGE_FALLBACK
                            }}
                        />
                    </Link>
                </div>

                <div className="kf-kitty-info">
                        <Jewels kitty={kitty} displayType="mewtations" size={jewelSize} />
                        <div className="kf-kitty-id-row">
                            <Link to={`/kitty/${kitty.tokenId}`} className="font-bold text-[#333]">
                                #{kitty.tokenId}
                            </Link>
                            <img
                                src="/kittyFamily/icons/inspect.svg"
                                alt=""
                                className="kf-kitty-inspect hidden md:block"
                            />
                        </div>
                        <div className="kf-kitty-meta kf-kitty-meta-combined">
                            Gen{kitty.gen} - {getCooldown(kitty.cooldownIndex)}
                        </div>
                        <div className="kf-kitty-meta kf-kitty-meta-gen">Gen{kitty.gen}</div>
                        <div className="kf-kitty-meta kf-kitty-meta-cd">
                            {getCooldown(kitty.cooldownIndex)}
                        </div>
                        <Jewels kitty={kitty} displayType="family-jewels" size={jewelSize} />
                </div>
            </div>
        </div>
    )
}

export default KittyCard