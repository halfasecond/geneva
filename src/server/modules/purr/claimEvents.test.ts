import { describe, expect, it } from 'vitest'
import { GILDED_CLAIM, isKittyClaimEvent, kittyClaimFields } from './claimEvents'

describe('kitty claim events', () => {
    it('treats claim 1 and gilded claims as kitty claims', () => {
        expect(isKittyClaimEvent('Claim')).toBe(true)
        expect(isKittyClaimEvent(GILDED_CLAIM)).toBe(true)
        expect(isKittyClaimEvent('GrandmasterClaim')).toBe(false)
        expect(isKittyClaimEvent('Transfer')).toBe(false)
    })

    it('reads the gilded claimer, kitty, and amount', () => {
        expect(kittyClaimFields({
            event: GILDED_CLAIM,
            returnValues: {
                claimer: '0xABC',
                kittyId: 3012n,
                amount: 100000000000000000000n,
            },
        })).toEqual({
            tokenId: 3012,
            address: '0xabc',
            amount: '100000000000000000000',
        })
    })
})
