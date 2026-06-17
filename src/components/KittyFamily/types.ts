export interface EnhancedCattribute {
    kittyId: number
    position: number
    description: string
}

export interface Kitty {
    id?: number
    tokenId: number
    gen: number
    matronId?: number
    sireId?: number
    name?: string
    image_url?: string
    image_url_cdn?: string
    color?: string
    status?: unknown
    cooldownIndex?: number
    owner?: string
    created_at?: string
    enhanced_cattributes?: EnhancedCattribute[]
    is_exclusive?: boolean
    is_fancy?: boolean
    is_special_edition?: boolean
    g36?: number
}

export interface FamilyResponse {
    kitties: Kitty[]
    total: number
}