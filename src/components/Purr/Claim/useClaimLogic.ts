import { useReducer, useEffect, useCallback } from 'react'
import { isAddress } from 'web3-validator'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'
import { proofs } from './diamonds'
import { proofs as exclusiveProofs } from './exclusives'

// Types
interface ClaimState {
    claimTX: any
    claiming: boolean
    claimed: boolean
    kittyId: string
    kittyEligible: boolean
    merkleProof: string[]
    errorMessage: string
    loading: boolean
    kittyOwner: string | null
}

type ClaimAction =
    | { type: 'SET_KITTY_ID'; payload: string }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ELIGIBILITY'; payload: { eligible: boolean; proof: string[]; claimed: boolean; owner: string | null } }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'SET_CLAIMING'; payload: boolean }
    | { type: 'SET_CLAIM_TX'; payload: any }
    | { type: 'RESET' }

// Initial state
const initialState: ClaimState = {
    claimTX: undefined,
    claiming: false,
    claimed: false,
    kittyId: '',
    kittyEligible: false,
    merkleProof: [],
    errorMessage: '',
    loading: false,
    kittyOwner: null
}

// Reducer
function claimReducer(state: ClaimState, action: ClaimAction): ClaimState {
    switch (action.type) {
        case 'SET_KITTY_ID':
            return { ...initialState, kittyId: action.payload }
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
                errorMessage: ''
            }
        case 'SET_ERROR':
            return {
                ...state,
                errorMessage: action.payload,
                kittyEligible: false,
                merkleProof: [],
                kittyOwner: null,
                loading: false
            }
        case 'SET_CLAIMING':
            return { ...state, claiming: action.payload }
        case 'SET_CLAIM_TX':
            return { ...state, claimTX: action.payload, claiming: false }
        case 'RESET':
            return initialState
        default:
            return state
    }
}

// Helper function to check if kitty is eligible for claim
const isKittyEligible = (kittyId: number): boolean => {
    // Day1 kitties (ID <= 3365)
    if (kittyId <= 3365) return true
    
    // Check if diamond kitty has proof
    const kittyIdStr = kittyId.toString()
    if (kittyIdStr in proofs) return true
    
    // Check if exclusive kitty has proof
    if (kittyIdStr in exclusiveProofs) return true
    
    return false
}

// Helper function to get merkle proof for a kitty
const getMerkleProofForKitty = (kittyId: number): string[] => {
    const kittyIdStr = kittyId.toString()
    
    // Check diamond proofs
    if (kittyIdStr in proofs) {
        return (proofs as any)[kittyIdStr]
    }
    
    // Check exclusive proofs
    if (kittyIdStr in exclusiveProofs) {
        return (exclusiveProofs as any)[kittyIdStr]
    }
    
    // No proof available
    return []
}

// Custom hook
export const useClaimLogic = (
        walletAddress: string | undefined,
        purrClaim: Contract<AbiFragment[]>,
        cryptokitties: Contract<AbiFragment[]>
    ) => {
    const [state, dispatch] = useReducer(claimReducer, initialState)

    // Debounced eligibility check - only makes contract calls for eligible kitties
    const checkKittyEligibility = useCallback(async (kittyId: string) => {
        if (!kittyId || isNaN(parseInt(kittyId))) {
            dispatch({ type: 'SET_ELIGIBILITY', payload: { eligible: false, proof: [], claimed: false, owner: null } })
            return
        }

        dispatch({ type: 'SET_LOADING', payload: true })

        try {
            const kittyIdNum = parseInt(kittyId)
            
            // Step 1: Local eligibility check (no contract calls)
            const isEligible = isKittyEligible(kittyIdNum)
            const proof = getMerkleProofForKitty(kittyIdNum)
            
            if (!isEligible) {
                // If not eligible, no need for contract calls
                dispatch({
                    type: 'SET_ELIGIBILITY',
                    payload: { eligible: false, proof: [], claimed: false, owner: null }
                })
                return
            }

            // Step 2: Check ownership first (only for eligible kitties)
            let kittyOwner: string | null = null
            let claimed = false

            try {
                if (cryptokitties && cryptokitties.methods.ownerOf) {
                    kittyOwner = await cryptokitties.methods.ownerOf(kittyId).call() as string
                }
            } catch (error) {
                console.warn('Could not check kitty ownership:', error)
                // Don't fail the whole check if ownership fails - kitty might not exist
            }

            // Step 3: Only check claim status if user owns the kitty
            if (kittyOwner && walletAddress && kittyOwner.toLowerCase() === walletAddress.toLowerCase()) {
                try {
                    if (purrClaim && purrClaim.methods.hasKittyClaimed) {
                        claimed = await purrClaim.methods.hasKittyClaimed(kittyId).call() as boolean
                    }
                } catch (error) {
                    console.warn('Could not check claim status:', error)
                }
            }

            dispatch({
                type: 'SET_ELIGIBILITY',
                payload: { eligible: true, proof, claimed, owner: kittyOwner }
            })
        } catch (error) {
            console.error('Error checking eligibility:', error)
            dispatch({ type: 'SET_ERROR', payload: 'Error checking eligibility' })
        }
  }, [purrClaim, cryptokitties, walletAddress])

  // Debounce the eligibility check to avoid contract calls on every keystroke
  useEffect(() => {
    if (!state.kittyId) return

    const timeoutId = setTimeout(() => {
      checkKittyEligibility(state.kittyId)
    }, 1000) // 1000ms debounce

    return () => clearTimeout(timeoutId)
  }, [state.kittyId, checkKittyEligibility])

  // Reset state when wallet changes
  useEffect(() => {
    if (!walletAddress || !isAddress(walletAddress)) {
      dispatch({ type: 'RESET' })
    }
  }, [walletAddress])

  // Actions
  const setKittyId = (id: string) => {
    dispatch({ type: 'SET_KITTY_ID', payload: id })
  }

  const claim = async () => {
    const ownsKitty = state.kittyOwner && walletAddress && state.kittyOwner.toLowerCase() === walletAddress.toLowerCase()
    if (!state.kittyId || !state.kittyEligible || !ownsKitty || !walletAddress) {
      dispatch({ type: 'SET_ERROR', payload: 'Invalid kitty ID, not eligible, not owned, or wallet not connected' })
      return
    }

    dispatch({ type: 'SET_CLAIMING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: '' })

    try {
      // Call the claim function with kitty ID and merkle proof
      const claimResult = await purrClaim.methods.claim(state.kittyId, state.merkleProof).send({ from: walletAddress })
      dispatch({ type: 'SET_CLAIM_TX', payload: claimResult })
    } catch (error) {
      console.error('Error claiming:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Error claiming: ' + (error instanceof Error ? error.message : String(error)) })
      dispatch({ type: 'SET_CLAIMING', payload: false })
    }
  }

  const reset = () => {
    dispatch({ type: 'RESET' })
  }

  return {
    state,
    actions: {
      setKittyId,
      claim,
      reset
    }
  }
}