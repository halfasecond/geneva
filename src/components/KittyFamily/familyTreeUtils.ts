import type { Kitty } from './types'

export type ParentType = 'matron' | 'sire'

export const getFocalKitty = (kitties: Kitty[], id: string | undefined): Kitty | undefined => {
    if (!id) return undefined
    return kitties.find(({ tokenId }) => tokenId.toString() === id)
}

export const getParent = (
    kitties: Kitty[],
    focal: Kitty | undefined,
    type: ParentType,
): Kitty | undefined => {
    if (!focal) return undefined
    const parentId = type === 'matron' ? focal.matronId : focal.sireId
    if (parentId == null) return undefined
    return kitties.find(({ tokenId }) => tokenId === parentId)
}

export const getAncestor = (kitties: Kitty[], ancestorId?: number): Kitty | undefined => {
    if (ancestorId == null) return undefined
    return kitties.find(({ tokenId }) => tokenId === ancestorId)
}