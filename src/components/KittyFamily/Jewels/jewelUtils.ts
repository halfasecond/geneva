import type { EnhancedCattribute, Kitty } from '../types'

export type JewelDisplayType = 'mewtations' | 'family-jewels'

export const resolveKittyId = (kitty: Kitty) => Number(kitty.id ?? kitty.tokenId)

const jewelTypeForPosition = (position: number) => {
    if (position === 1) return 'diamond'
    if (position <= 10) return 'gilded'
    if (position <= 100) return 'amethyst'
    if (position <= 500) return 'lapis'
    return null
}

export const getJewelGems = (kitty: Kitty, displayType: JewelDisplayType) => {
    const kittyId = resolveKittyId(kitty)
    const cattributes = kitty.enhanced_cattributes ?? []

    return cattributes.flatMap((cattribute) => {
        const cKittyId = Number(cattribute.kittyId)
        const isOwn = cKittyId === kittyId
        const matches =
            displayType === 'mewtations' ? isOwn : !isOwn

        if (!matches) return []

        const type = jewelTypeForPosition(Number(cattribute.position))
        if (!type) return []

        return [{ type, trait: cattribute.description }]
    })
}