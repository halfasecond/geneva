import { useReducer, useEffect, useCallback } from 'react'
import { isAddress } from 'web3-validator'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'
import gildedIds from './gilded.json'
import grandmasterAddresses from './grandmasters.json'

const gildedSet = new Set((gildedIds as number[]).map(String))
const grandmasters = new Set((grandmasterAddresses as string[]).map((addr) => addr.toLowerCase()))

export const GILDED_REWARD = 100
export const GRANDMASTER_REWARD = 1000

export const isGildedKitty = (kittyId: number): boolean => gildedSet.has(String(kittyId))
export const isGrandmasterAddress = (addr: string | undefined): boolean =>
    !!addr && grandmasters.has(addr.toLowerCase())

// Proofs are ~1.7MB — load the chunk only when a gilded kitty is checked / claimed.
export const getGildedProof = async (kittyId: number): Promise<string[]> => {
    const mod = await import('./gilded-proofs.json')
    const proofs = ((mod as { default?: Record<string, string[]> }).default ?? mod) as Record<string, string[]>
    return proofs[String(kittyId)] ?? []
}

interface Claim2State {
    kittyId: string
    loading: boolean
    kittyEligible: boolean
    merkleProof: string[]
    claimed: boolean
    kittyOwner: string | null
    claiming: boolean
    claimTX: { transactionHash?: string } | undefined
    errorMessage: string
    isGrandmaster: boolean
    grandmasterClaimed: boolean
    claimingGrandmaster: boolean
    grandmasterTX: { transactionHash?: string } | undefined
}

type Claim2Action =
    | { type: 'SET_KITTY_ID'; payload: string }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ELIGIBILITY'; payload: { eligible: boolean; proof: string[]; claimed: boolean; owner: string | null } }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'SET_CLAIMING'; payload: boolean }
    | { type: 'SET_CLAIM_TX'; payload: { transactionHash?: string } }
    | { type: 'SET_GRANDMASTER'; payload: { eligible: boolean; claimed: boolean } }
    | { type: 'SET_CLAIMING_GRANDMASTER'; payload: boolean }
    | { type: 'SET_GRANDMASTER_TX'; payload: { transactionHash?: string } }
    | { type: 'RESET' }

const initialState: Claim2State = {
    kittyId: '',
    loading: false,
    kittyEligible: false,
    merkleProof: [],
    claimed: false,
    kittyOwner: null,
    claiming: false,
    claimTX: undefined,
    errorMessage: '',
    isGrandmaster: false,
    grandmasterClaimed: false,
    claimingGrandmaster: false,
    grandmasterTX: undefined,
}

function reducer(state: Claim2State, action: Claim2Action): Claim2State {
    switch (action.type) {
        case 'SET_KITTY_ID':
            return {
                ...state,
                kittyId: action.payload,
                claimTX: undefined,
                errorMessage: '',
                kittyEligible: false,
                merkleProof: [],
                claimed: false,
                kittyOwner: null,
                loading: false,
            }
        case 'SET_LOADING':
            return { ...state, loading: action.payload }
        case 'SET_ELIGIBILITY':
            return {
                ...state,
                kittyEligible: action.payload.eligible,
                merkleProof: action.payload.proof,
                claimed: action.payload.claimed,
                kittyOwner: action.payload.owner,
                loading: false,
                errorMessage: '',
            }
        case 'SET_ERROR':
            return { ...state, errorMessage: action.payload, loading: false, claiming: false, claimingGrandmaster: false }
        case 'SET_CLAIMING':
            return { ...state, claiming: action.payload, errorMessage: action.payload ? '' : state.errorMessage }
        case 'SET_CLAIM_TX':
            return { ...state, claimTX: action.payload, claiming: false }
        case 'SET_GRANDMASTER':
            return { ...state, isGrandmaster: action.payload.eligible, grandmasterClaimed: action.payload.claimed }
        case 'SET_CLAIMING_GRANDMASTER':
            return { ...state, claimingGrandmaster: action.payload, errorMessage: action.payload ? '' : state.errorMessage }
        case 'SET_GRANDMASTER_TX':
            return { ...state, grandmasterTX: action.payload, claimingGrandmaster: false }
        case 'RESET':
            return {
                ...initialState,
                isGrandmaster: state.isGrandmaster,
                grandmasterClaimed: state.grandmasterClaimed,
            }
        default:
            return state
    }
}

export const useClaim2Logic = (
    walletAddress: string | undefined,
    purrClaim2: Contract<AbiFragment[]> | undefined,
    cryptokitties: Contract<AbiFragment[]>,
) => {
    const [state, dispatch] = useReducer(reducer, initialState)

    const checkGrandmaster = useCallback(async () => {
        if (!walletAddress) {
            dispatch({ type: 'SET_GRANDMASTER', payload: { eligible: false, claimed: false } })
            return
        }
        let eligible = isGrandmasterAddress(walletAddress)
        let claimed = false
        try {
            if (!eligible && purrClaim2?.methods.isGrandmaster) {
                eligible = await purrClaim2.methods.isGrandmaster(walletAddress).call() as boolean
            }
            if (eligible && purrClaim2?.methods.hasGrandmasterClaimed) {
                claimed = await purrClaim2.methods.hasGrandmasterClaimed(walletAddress).call() as boolean
            }
        } catch (error) {
            console.warn('Could not check grandmaster claim status:', error)
        }
        dispatch({ type: 'SET_GRANDMASTER', payload: { eligible, claimed } })
    }, [walletAddress, purrClaim2])

    useEffect(() => {
        void checkGrandmaster()
    }, [checkGrandmaster])

    const checkKittyEligibility = useCallback(async (kittyId: string) => {
        if (!kittyId || isNaN(parseInt(kittyId))) {
            dispatch({ type: 'SET_ELIGIBILITY', payload: { eligible: false, proof: [], claimed: false, owner: null } })
            return
        }

        dispatch({ type: 'SET_LOADING', payload: true })
        const kittyIdNum = parseInt(kittyId)
        const eligible = isGildedKitty(kittyIdNum)

        if (!eligible) {
            dispatch({ type: 'SET_ELIGIBILITY', payload: { eligible: false, proof: [], claimed: false, owner: null } })
            return
        }

        const proof = await getGildedProof(kittyIdNum)

        let kittyOwner: string | null = null
        let claimed = false
        try {
            if (cryptokitties?.methods.ownerOf) {
                kittyOwner = await cryptokitties.methods.ownerOf(kittyId).call() as string
            }
        } catch (error) {
            console.warn('Could not check kitty ownership:', error)
        }

        if (kittyOwner && walletAddress && kittyOwner.toLowerCase() === walletAddress.toLowerCase()) {
            try {
                if (purrClaim2?.methods.hasGildedClaimed) {
                    claimed = await purrClaim2.methods.hasGildedClaimed(kittyId).call() as boolean
                }
            } catch (error) {
                console.warn('Could not check gilded claim status:', error)
            }
        }

        dispatch({ type: 'SET_ELIGIBILITY', payload: { eligible: true, proof, claimed, owner: kittyOwner } })
    }, [purrClaim2, cryptokitties, walletAddress])

    useEffect(() => {
        if (!state.kittyId) return
        const timeoutId = setTimeout(() => {
            void checkKittyEligibility(state.kittyId)
        }, 1000)
        return () => clearTimeout(timeoutId)
    }, [state.kittyId, checkKittyEligibility])

    useEffect(() => {
        if (!walletAddress || !isAddress(walletAddress)) {
            dispatch({ type: 'RESET' })
        }
    }, [walletAddress])

    const setKittyId = (id: string) => {
        dispatch({ type: 'SET_KITTY_ID', payload: id })
    }

    const claimGilded = async () => {
        const ownsKitty = state.kittyOwner && walletAddress && state.kittyOwner.toLowerCase() === walletAddress.toLowerCase()
        if (!purrClaim2 || !state.kittyId || !state.kittyEligible || !ownsKitty || !walletAddress) {
            dispatch({ type: 'SET_ERROR', payload: 'Invalid kitty, not eligible, not owned, or wallet not connected' })
            return
        }
        dispatch({ type: 'SET_CLAIMING', payload: true })
        try {
            const proof = state.merkleProof.length
                ? state.merkleProof
                : await getGildedProof(parseInt(state.kittyId, 10))
            if (!proof.length) {
                dispatch({ type: 'SET_ERROR', payload: 'Missing merkle proof for this kitty' })
                return
            }
            const result = await purrClaim2.methods.claimGilded(state.kittyId, proof).send({ from: walletAddress })
            dispatch({ type: 'SET_CLAIM_TX', payload: result })
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Error claiming: ' + (error instanceof Error ? error.message : String(error)) })
        }
    }

    const claimGrandmaster = async () => {
        if (!purrClaim2 || !walletAddress || !state.isGrandmaster) {
            dispatch({ type: 'SET_ERROR', payload: 'Not a grandmaster or wallet not connected' })
            return
        }
        dispatch({ type: 'SET_CLAIMING_GRANDMASTER', payload: true })
        try {
            const result = await purrClaim2.methods.claimGrandmaster().send({ from: walletAddress })
            dispatch({ type: 'SET_GRANDMASTER_TX', payload: result })
            dispatch({ type: 'SET_GRANDMASTER', payload: { eligible: true, claimed: true } })
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Error claiming: ' + (error instanceof Error ? error.message : String(error)) })
        }
    }

    const reset = () => {
        dispatch({ type: 'RESET' })
    }

    return { state, actions: { setKittyId, claimGilded, claimGrandmaster, reset } }
}
