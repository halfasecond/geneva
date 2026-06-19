import type { VechNft } from '../../types/vech'

export const HANGAR_DEBUG_COUNTS = [0, 1, 2, 6, 12] as const
export type HangarDebugCount = (typeof HANGAR_DEBUG_COUNTS)[number]

const MOCK_HULL_IDS = [5466, 5759, 5102, 4821, 6012, 6133, 6201, 6344, 6400, 6555, 6701, 6888]

function parseAdminAddresses(): string[] {
    const raw = import.meta.env.VITE_APP_ADMIN
    if (!raw) return []
    const matches = String(raw).match(/0x[a-fA-F0-9]{40}/g)
    return matches ? matches.map((a) => a.toLowerCase()) : []
}

export function isHangarAdmin(address: string | undefined): boolean {
    if (!address) return false
    return parseAdminAddresses().includes(address.toLowerCase())
}

/** Hangar layout debug — admins only (VITE_APP_ADMIN). */
export function isHangarDebugEnabled(loggedIn?: string): boolean {
    return isHangarAdmin(loggedIn)
}

export function buildMockHangar(count: number, templates: VechNft[] = []): VechNft[] {
    if (count <= 0) return []

    const owner = templates[0]?.owner ?? '0x0000000000000000000000000000000000000000'

    return Array.from({ length: count }, (_, i) => {
        const shipId = MOCK_HULL_IDS[i % MOCK_HULL_IDS.length]
        const template = templates[i % templates.length]
        const tokenId = 9000 + i
        return {
            tokenId,
            shipId,
            owner,
            name: `Vech ${shipId}`,
            image: template?.image,
            animation_url: template?.animation_url,
        }
    })
}