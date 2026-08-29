import { Link } from 'react-router-dom'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'
import { fromWei } from 'web3-utils'
import { useClaimLogic } from './useClaimLogic'
import { diamonds } from './diamonds'
import exclusives from './exclusives'
import * as Styled from './PurrClaim.style'

const { VITE_CDN_URL } = import.meta.env

const PurrClaim: React.FC<{
    walletAddress: string | undefined,
    purrClaim: Contract<AbiFragment[]>,
    cryptokitties: Contract<AbiFragment[]>,
    purrClaimBalance: string | undefined,
}> = ({ walletAddress, purrClaim, cryptokitties, purrClaimBalance }) => {
    // Use the custom hook for all claim logic and state management
    const { state, actions } = useClaimLogic(walletAddress, purrClaim, cryptokitties)

    const isDayOneKitty = (kittyId: number): boolean => kittyId <= 3365
    const isFounderKitty = (kittyId: number): boolean => kittyId <= 100
    const isDiamondKitty = (kittyId: number): boolean => diamonds.includes(kittyId)
    const isExclusiveKitty = (kittyId: number): boolean => exclusives.includes(kittyId)

    const getClaim = (kittyId: string) => {
        if (!kittyId) return 0
        const kittyIdNum = parseInt(kittyId)
        if (isNaN(kittyIdNum)) return 0
        let claim = 0
        if (isDayOneKitty(kittyIdNum)) {
            claim = 10
            claim *= 10
            if (isFounderKitty(kittyIdNum)) {
                claim *= 10
            }
            if (isExclusiveKitty(kittyIdNum)) {
                claim *= 10
            }
        }
        if (isDiamondKitty(kittyIdNum)) {
            claim = claim === 0 ? 100 : 1000
            claim *= 10
        }
        return claim
    }
    
    return (
        <Styled.Div>
            <img src={`${VITE_CDN_URL}/images/purr/ether-diamond.gif`} />
            <h2>$PURR CLAIM</h2>
            <p>Available: <b>{'$PURR '}{!(purrClaimBalance === undefined) ? fromWei(purrClaimBalance, 'ether') : <img src={`${VITE_CDN_URL}/images/purr/loading.png`} alt={''} />}</b></p>
            <ol>
                <li>{`Day1 CryptoKitties`} - <b>$PURR 10</b></li>
                <li>{`Diamond CryptoKitties`} - <b>$PURR 100</b></li>
            </ol>
            <div>
                <div>
                    <label>enter your kitty id:</label>
                    <input
                        type="text"
                        value={state.kittyId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const value = e.target.value
                            // Only allow numerical input (digits only)
                            if (value === '' || /^\d+$/.test(value)) {
                                actions.setKittyId(value)
                            }
                        }}
                        placeholder='#123'
                    />
                </div>
                {state.loading ? (
                    <img src={`${VITE_CDN_URL}/images/purr/loading.png`} alt={''} />
                ) : (
                    state.kittyEligible ? (
                        <>
                            <p>🙀 kitty is eligible to claim 🙀</p>
                            <p><b>$PURR {getClaim(state.kittyId)}</b></p>
                        </>
                    ) : !(state.kittyId === '') && (
                        <>
                            <p>😿 kitty is not eligible 😿</p>
                            <p>more claim rounds coming soon..</p>
                        </>
                    )
                )}
                <br />
                <p>visit <Link to={'https://purr.international'} target={'_blank'}>purr.international</Link> to claim</p>
            </div>
        </Styled.Div>
    )
}

export default PurrClaim
