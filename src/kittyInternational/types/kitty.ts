export interface Cattribute {
    description?: string
    kittyId?: number
    position?: number
}

export interface KittyHat {
    itemName: string
    tokenId?: number
}

export interface KittyRecord {
    tokenId: number
    id?: number
    name?: string
    gen?: number
    generation?: number
    cooldownIndex?: number
    color?: string
    created_at?: string
    image_url?: string
    image_url_cdn?: string
    currentPrice?: string
    sale?: boolean
    sire?: boolean
    status?: unknown
    hats?: KittyHat[]
    enhanced_cattributes?: Cattribute[]
}
