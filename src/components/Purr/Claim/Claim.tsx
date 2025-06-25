import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'
import { fromWei } from 'web3-utils'
import * as Styled from './Claim.style'
import { getAssetPath } from '../../../utils/assetPath'
import { useClaimLogic } from './useClaimLogic'
import { diamonds } from './diamonds'
import exclusives from './exclusives'

const Claim: React.FC<{
    walletAddress: string | undefined,
    cryptokitties: Contract<AbiFragment[]>,
    purrClaim: Contract<AbiFragment[]>,
    balance: string | undefined,
    purrClaimBalance: string | undefined,
    updateBalances: () => void,
    handleSignIn: () => void,
}> = ({ walletAddress, cryptokitties, purrClaim, balance, purrClaimBalance, updateBalances, handleSignIn }) => {
    
    // Use the custom hook for all claim logic and state management
    const { state, actions } = useClaimLogic(walletAddress, purrClaim, cryptokitties)

    // Update balances when a claim transaction is completed
    useEffect(() => {
        if (state.claimTX) {
            updateBalances()
        }
    }, [state.claimTX])

    const isDayOneKitty = (kittyId: number): boolean => kittyId <= 3365
    const isFounderKitty = (kittyId: number): boolean => kittyId <= 100
    const isDiamondKitty = (kittyId: number): boolean => diamonds.includes(kittyId)
    const isExclusiveKitty = (kittyId: number): boolean => exclusives.includes(kittyId)

    // Helper function to get eligibility display text (purely local, stable)
    const getClaim = (kittyId: string) => {
        if (!kittyId) return 0
        const kittyIdNum = parseInt(kittyId)
        if (isNaN(kittyIdNum)) return 0
        let claim = 0
        if (kittyIdNum <= 3365) {
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
            claim = claim === 0 ? 100 : claim
            claim *= 10
        }
        return claim
    }

    // Render success state after claiming
    if (state.claimTX) {
        return (
            <Styled.Form onSubmit={e => {
                e.preventDefault()
            }}>
                <div className='logo' />
                <h4>{'Day1 / Diamond Claim'}</h4>
                <p>Available: <b>{'$PURR '}{!(purrClaimBalance === undefined) ? fromWei(purrClaimBalance, 'ether') : <img src={getAssetPath('loading.png')} alt={''} />}</b></p>
                <h4>{`You `}<Link to={`https://etherscan.io/tx/${state.claimTX.transactionHash}`}>claimed</Link>{` for CryptoKitty #${state.kittyId}`}</h4>
                <p>{'You currently hold '}<b>{'$PURR '}{balance ? fromWei(balance, 'ether') : <img src={getAssetPath('loading.png')} alt={''}  />}</b></p>
                <button onClick={actions.reset}>Make another claim</button>
            </Styled.Form>
        )
    }

    // Render loading state while claiming
    if (state.claiming) {
        return (
            <Styled.Form onSubmit={e => {
                e.preventDefault()
            }}>
                <Styled.Div>
                    <img src={getAssetPath('loading.png')} alt={''} />
                </Styled.Div>
            </Styled.Form>
        )
    }

    // Main claim form
    return (
        <>
            <Styled.Form onSubmit={e => {
                e.preventDefault()
                const ownsKitty = state.kittyOwner && walletAddress && state.kittyOwner.toLowerCase() === walletAddress.toLowerCase()
                if (state.kittyEligible && !state.claimed && ownsKitty) {
                    actions.claim()
                }
            }}>
                <div className='logo' style={{ backgroundImage: `url(${getAssetPath('ether-diamond.gif')})` }} />
                <h4>{'Day1 / Diamond Claim'}</h4>
                <p>Available: <b>{'$PURR '}{!(purrClaimBalance === undefined) ? fromWei(purrClaimBalance, 'ether') : <img src={getAssetPath('loading.png')} alt={''} />}</b></p>
                <h4>{`Claim Criteria`}</h4>
                {walletAddress ? (
                    <>
                        <Styled.Div>
                            <ol>
                                <li>{`Day1 CryptoKitties`} <span className={'mobileOnly'}>{` (ID <= 3365)`}</span> - <b>$PURR 10</b></li>
                                <li>{`Diamond CryptoKitties`} - <b>$PURR 100</b></li>
                            </ol>
                            <h4>x10 Multipliers:</h4>
                            <div>
                                <div><img src={getAssetPath('icons/founders.svg')} alt={'founders'} />Founders</div>
                                <div><img src={getAssetPath('icons/diamond.svg')} alt={'diamonds'} className={'diamond'} />Diamonds</div>
                                <div><img src={getAssetPath('icons/normal.svg')} alt={'day1'} />Day1</div>
                                <div><img src={getAssetPath('icons/exclusive.svg')} alt={'exclusive'} />Exclusive</div>
                            </div>
                            <p>{'Enter your CryptoKitty ID to check eligibility:'}</p>
                            <input
                                type="text"
                                value={state.kittyId}
                                onChange={(e) => {
                                    const value = e.target.value
                                    // Only allow numerical input (digits only)
                                    if (value === '' || /^\d+$/.test(value)) {
                                        actions.setKittyId(value)
                                    }
                                }}
                                placeholder="Enter Kitty ID"
                            />
                            
                            {state.kittyId ? (
                                <>
                                    {/* Paragraph 1: Eligibility status (instant, local logic - never reloads) */}
                                    {(() => {
                                        const kittyIdNum = parseInt(state.kittyId)
                                        if (isNaN(kittyIdNum)) return null
                                        
                                        const isLocallyEligible = isDayOneKitty(kittyIdNum) || isDiamondKitty(kittyIdNum) || isExclusiveKitty(kittyIdNum)
                                        
                                        return state.loading ? (
                                            <p>Checking eligibility...</p>
                                        ) : isLocallyEligible ? (
                                            <p>{`🙀 #${state.kittyId} is eligible for`}<b>DAY1 / Diamond Claim</b> 🙀</p>
                                        ) : (
                                            <p>{`😿 #${state.kittyId} is not eligible to claim 😿`}</p>
                                        )
                                    })()}
                                    
                                    {/* Paragraph 2: Ownership and claim status (after contract calls) */}
                                    {(!state.loading && state.kittyEligible && state.kittyOwner) ? (
                                        <>
                                            {walletAddress && state.kittyOwner.toLowerCase() === walletAddress.toLowerCase() ? (
                                                <>
                                                    {state.claimed ? (
                                                        <p>{`😼 This kitty has already claimed`}<b>$PURR</b> 😼</p>
                                                    ) : (
                                                        <p>{`✅ Eligible for ${getClaim(state.kittyId)}`}<b>$PURR</b> ✅</p>
                                                    )}
                                                </>
                                            ) : (
                                                <p>{`❌ You don't own this kitty - only the owner can claim ❌`}</p>
                                            )}
                                        </>
                                    ) : (
                                        <p>{state.loading ? (
                                            <b><img src={getAssetPath('loading.png')} alt={''} /></b>
                                        ) : (
                                            <>{'..................................'}</>
                                        )}</p>
                                    )}
                                </>
                            ) : (
                                <p>{'..................................'}</p>
                            )}

                            {!state.loading && state.kittyId === '' && (
                                <p>{'..................................'}</p>
                            )}
                            
                            {state.errorMessage && (
                                <p style={{ color: 'red' }}>{state.errorMessage}</p>
                            )}
                        </Styled.Div>
                        <input
                            type={'submit'}
                            value={`Claim $PURR`}
                            disabled={state.claiming || !state.kittyEligible || state.claimed || !(state.kittyOwner && walletAddress && state.kittyOwner.toLowerCase() === walletAddress.toLowerCase()) || state.kittyId === ''}
                        />
                    </>
                ) : (
                    <>
                        <Styled.Div>
                            <ol>
                                <li>{`Day1 CryptoKitties`} <span className={'mobileOnly'}>{` (ID <= 3365)`}</span> - <b>$PURR 10</b></li>
                                <li>{`Diamond CryptoKitties`} - <b>$PURR 100</b></li>
                            </ol>
                            <h4>{'x10 Multipliers'}</h4>
                            <div>
                                <div><img src={getAssetPath('icons/founders.svg')} alt={'founders'} />Founders</div>
                                <div><img src={getAssetPath('icons/diamond.svg')} alt={'diamonds'} className={'diamond'} />Diamonds</div>
                                <div><img src={getAssetPath('icons/normal.svg')} alt={'day1'} />Day1</div>
                                <div><img src={getAssetPath('icons/exclusive.svg')} alt={'exclusive'} />Exclusive</div>
                            </div>
                        </Styled.Div>
                        <br /><br />
                        <p>
                            <span role={'button'} onClick={handleSignIn}>Sign in with Metamask</span>
                        </p>
                    </>
                )}
            </Styled.Form>
        </>
    )
}

export default Claim
