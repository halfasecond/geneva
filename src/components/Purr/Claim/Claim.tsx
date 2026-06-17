import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'
import { fromWei } from 'web3-utils'
import { getAssetPath } from '../../../utils/assetPath'
import { useClaimLogic } from './useClaimLogic'
import { diamonds } from './diamonds'
import exclusives from './exclusives'

const LoadingSpinner = () => (
    <img src={getAssetPath('loading.png')} alt="" className="w-5 h-5 inline-block" />
)

const MultiplierBadge = ({ icon, label, iconClass = '' }: { icon: string; label: string; iconClass?: string }) => (
    <div className="flex items-center gap-2 bg-neutral-200 text-neutral-700 font-bold text-sm
        px-3 py-2 rounded shadow-md w-[48%] md:w-[22%] max-w-[160px]">
        <img src={icon} alt={label} className={`w-6 h-6 ${iconClass}`} />
        <span>{label}</span>
    </div>
)

const ClaimCriteria = () => (
    <>
        <ol className="text-center space-y-2 mb-4">
            <li>
                Day1 CryptoKitties
                <span className="md:hidden"> (ID &lt;= 3365)</span>
                {' '}- <b>$PURR 10</b>
            </li>
            <li>Diamond CryptoKitties - <b>$PURR 100</b></li>
        </ol>
        <h4 className="font-display text-base mb-3">x10 Multipliers:</h4>
        <div className="flex flex-wrap justify-around gap-3 w-full max-w-2xl mx-auto mb-6">
            <MultiplierBadge icon={getAssetPath('icons/founders.svg')} label="Founders" />
            <MultiplierBadge icon={getAssetPath('icons/diamond.svg')} label="Diamonds" iconClass="w-5 h-5" />
            <MultiplierBadge icon={getAssetPath('icons/normal.svg')} label="Day1" />
            <MultiplierBadge icon={getAssetPath('icons/exclusive.svg')} label="Exclusive" />
        </div>
    </>
)

const Claim: React.FC<{
    walletAddress: string | undefined,
    cryptokitties: Contract<AbiFragment[]>,
    purrClaim: Contract<AbiFragment[]>,
    balance: string | undefined,
    purrClaimBalance: string | undefined,
    updateBalances: () => void,
    handleSignIn: () => void,
}> = ({ walletAddress, cryptokitties, purrClaim, balance, purrClaimBalance, updateBalances, handleSignIn }) => {
    const { state, actions } = useClaimLogic(walletAddress, purrClaim, cryptokitties)

    useEffect(() => {
        if (state.claimTX) {
            updateBalances()
        }
    }, [state.claimTX])

    const isDayOneKitty = (kittyId: number): boolean => kittyId <= 3365
    const isFounderKitty = (kittyId: number): boolean => kittyId <= 100
    const isDiamondKitty = (kittyId: number): boolean => diamonds.includes(kittyId)
    const isExclusiveKitty = (kittyId: number): boolean => exclusives.includes(kittyId)

    const getClaim = (kittyId: string) => {
        if (!kittyId) return 0
        const kittyIdNum = parseInt(kittyId)
        if (isNaN(kittyIdNum)) return 0
        let claim = 0
        if (kittyIdNum <= 3365) {
            claim = 10
            claim *= 10
            if (isFounderKitty(kittyIdNum)) claim *= 10
            if (isExclusiveKitty(kittyIdNum)) claim *= 10
        }
        if (isDiamondKitty(kittyIdNum)) {
            claim = claim === 0 ? 100 : 1000
            claim *= 10
        }
        return claim
    }

    const availableBalance = purrClaimBalance === undefined
        ? <LoadingSpinner />
        : fromWei(purrClaimBalance, 'ether')

    const userBalance = balance
        ? fromWei(balance, 'ether')
        : <LoadingSpinner />

    const formShell = (children: React.ReactNode) => (
        <form
            onSubmit={(e) => e.preventDefault()}
            className="purr-card flex flex-col items-center w-full max-w-3xl mx-auto px-6 py-12
                border-[12px] border-white/10 shadow-[0_0_24px_rgba(236,35,165,0.1)]"
        >
            {children}
        </form>
    )

    if (state.claimTX) {
        return formShell(
            <>
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-neutral-200 mb-8" />
                <h4 className="font-display text-lg md:text-xl mb-4">Day1 / Diamond Claim</h4>
                <p className="mb-4">Available: <b>$PURR {availableBalance}</b></p>
                <h4 className="font-display text-base mb-4">
                    You <Link to={`https://etherscan.io/tx/${state.claimTX.transactionHash}`} className="purr-link">claimed</Link>
                    {' '}for CryptoKitty #{state.kittyId}
                </h4>
                <p className="mb-6">You currently hold <b>$PURR {userBalance}</b></p>
                <button type="button" onClick={actions.reset} className="purr-btn">Make another claim</button>
            </>
        )
    }

    if (state.claiming) {
        return formShell(
            <div className="py-12">
                <LoadingSpinner />
            </div>
        )
    }

    const ownsKitty = state.kittyOwner && walletAddress
        && state.kittyOwner.toLowerCase() === walletAddress.toLowerCase()

    return formShell(
        <>
            <div
                className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-neutral-200 mb-8 bg-center bg-no-repeat bg-[length:88%]"
                style={{ backgroundImage: `url(${getAssetPath('ether-diamond.gif')})` }}
            />
            <h4 className="font-display text-xl md:text-2xl mb-4">Day1 / Diamond Claim</h4>
            <p className="hidden md:block mb-8">Available: <b>$PURR {availableBalance}</b></p>

            <h4 className="font-display text-base mb-6">Claim Criteria</h4>

            {walletAddress ? (
                <>
                    <div className="w-full flex flex-col items-center text-center leading-relaxed">
                        <ClaimCriteria />
                        <p className="mb-4">Enter your CryptoKitty ID to check eligibility:</p>
                        <input
                            type="text"
                            value={state.kittyId}
                            onChange={(e) => {
                                const value = e.target.value
                                if (value === '' || /^\d+$/.test(value)) {
                                    actions.setKittyId(value)
                                }
                            }}
                            placeholder="Enter Kitty ID"
                            className="purr-input mb-6"
                        />

                        {state.kittyId ? (
                            <>
                                {(() => {
                                    const kittyIdNum = parseInt(state.kittyId)
                                    if (isNaN(kittyIdNum)) return null
                                    const isLocallyEligible = isDayOneKitty(kittyIdNum)
                                        || isDiamondKitty(kittyIdNum)
                                        || isExclusiveKitty(kittyIdNum)

                                    if (state.loading) return <p className="mb-4">Checking eligibility...</p>
                                    if (isLocallyEligible) {
                                        return (
                                            <p className="mb-4">
                                                🙀 #{state.kittyId} is eligible for <b>DAY1 / Diamond Claim</b> 🙀
                                            </p>
                                        )
                                    }
                                    return <p className="mb-4">😿 #{state.kittyId} is not eligible to claim 😿</p>
                                })()}

                                {!state.loading && state.kittyEligible && state.kittyOwner ? (
                                    ownsKitty ? (
                                        state.claimed ? (
                                            <p className="mb-4">😼 This kitty has already claimed <b>$PURR</b> 😼</p>
                                        ) : (
                                            <p className="mb-4">✅ Eligible for {getClaim(state.kittyId)} <b>$PURR</b> ✅</p>
                                        )
                                    ) : (
                                        <p className="mb-4">❌ You don&apos;t own this kitty - only the owner can claim ❌</p>
                                    )
                                ) : (
                                    <p className="mb-4">
                                        {state.loading ? <b><LoadingSpinner /></b> : '..................................'}
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="mb-4">..................................</p>
                        )}

                        {!state.loading && state.kittyId === '' && (
                            <p className="mb-4">..................................</p>
                        )}

                        {state.errorMessage && (
                            <p className="text-red-400 mb-4">{state.errorMessage}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="purr-btn mt-4"
                        disabled={
                            state.claiming
                            || !state.kittyEligible
                            || state.claimed
                            || !ownsKitty
                            || state.kittyId === ''
                        }
                        onClick={(e) => {
                            e.preventDefault()
                            if (state.kittyEligible && !state.claimed && ownsKitty) {
                                actions.claim()
                            }
                        }}
                    >
                        Claim $PURR
                    </button>
                </>
            ) : (
                <>
                    <div className="w-full flex flex-col items-center">
                        <ClaimCriteria />
                    </div>
                    <p className="mt-8">
                        <button type="button" onClick={handleSignIn} className="purr-link cursor-pointer bg-transparent border-0 p-0 font-inherit">
                            Sign in with Metamask
                        </button>
                    </p>
                </>
            )}
        </>
    )
}

export default Claim