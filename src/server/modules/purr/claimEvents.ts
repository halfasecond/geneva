export const PURR_CLAIM2 = '0x04ab1ffc02083acbd528ad782d564e2b19680edf'
export const PURR_CLAIM2_DEPLOYED = 26214835
export const GILDED_CLAIM = 'GildedClaim'
export const CLAIM = 'Claim'

export const isKittyClaimEvent = (name: string) => name === CLAIM || name === GILDED_CLAIM

export const kittyClaimFields = (event: {
    event?: string
    returnValues?: Record<string, unknown>
}) => {
    if (!isKittyClaimEvent(event.event || '')) return null
    const claimer = event.returnValues?.claimer
    const kittyId = event.returnValues?.kittyId
    const amount = event.returnValues?.amount
    if (claimer == null || kittyId == null || amount == null) return null
    const tokenId = Number(kittyId)
    if (!Number.isInteger(tokenId)) return null
    return {
        tokenId,
        address: String(claimer).toLowerCase(),
        amount: String(amount),
    }
}
