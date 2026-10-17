import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'
import { fromWei } from 'web3-utils'
import { getAssetPath } from '../../../utils/assetPath'
import gildedGem from '../../../kittyFamily/svg/gilded.svg'
import fancyIcon from '../../../kittyFamily/svg/genes/type-fancy.svg'
import { GILDED_REWARD, GRANDMASTER_REWARD, isGildedKitty, useClaim2Logic } from './useClaim2Logic'

const LoadingSpinner = () => (
    <img src={getAssetPath('loading.png')} alt="" className="w-5 h-5 inline-block" />
)

const GildedMark = ({ className = '' }: { className?: string }) => (
    <div className={`rounded-full bg-neutral-200 flex items-center justify-center ${className}`}>
        <img src={gildedGem} alt="" className="w-[70%] h-[70%]" />
    </div>
)

const CriteriaBadge = ({ icon, label }: { icon: string; label: string }) => (
    <div className="flex items-center justify-center gap-2 bg-neutral-200 text-neutral-700 font-bold text-sm
        px-3 py-2 rounded shadow-md w-[48%] md:w-[30%] max-w-[180px]">
        <img src={icon} alt="" className="w-6 h-6" />
        <span>{label}</span>
    </div>
)

const Claim2Criteria = () => (
    <>
        <ol className="text-center space-y-2 mb-4">
            <li>Gilded CryptoKitties - <b>$PURR {GILDED_REWARD}</b></li>
            <li>Fancy #1 Breeders - <b>$PURR {GRANDMASTER_REWARD}</b></li>
        </ol>
        <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl mx-auto mb-6">
            <CriteriaBadge icon={gildedGem} label="Gilded" />
            <CriteriaBadge icon={fancyIcon} label="Grandmasters" />
        </div>
    </>
)

const Claim2: React.FC<{
    walletAddress: string | undefined
    cryptokitties: Contract<AbiFragment[]>
    purrClaim2: Contract<AbiFragment[]> | undefined
    balance: string | undefined
    purrClaim2Balance: string | undefined
    updateBalances: () => void
    handleSignIn: () => void
}> = ({ walletAddress, cryptokitties, purrClaim2, balance, purrClaim2Balance, updateBalances, handleSignIn }) => {
    const { state, actions } = useClaim2Logic(walletAddress, purrClaim2, cryptokitties)
    const live = Boolean(purrClaim2)

    useEffect(() => {
        if (state.claimTX || state.grandmasterTX) {
            updateBalances()
        }
    }, [state.claimTX, state.grandmasterTX])

    const availableBalance = purrClaim2Balance === undefined
        ? <LoadingSpinner />
        : fromWei(purrClaim2Balance, 'ether')

    const userBalance = balance
        ? fromWei(balance, 'ether')
        : <LoadingSpinner />

    const formShell = (children: React.ReactNode) => (
        <form
            onSubmit={(e) => e.preventDefault()}
            className="purr-card flex flex-col items-center w-full h-full max-w-3xl mx-auto xl:max-w-none px-6 py-12"
        >
            {children}
        </form>
    )

    if (state.claimTX || state.grandmasterTX) {
        const tx = state.claimTX || state.grandmasterTX
        return formShell(
            <>
                <GildedMark className="w-16 h-16 md:w-24 md:h-24 mb-8" />
                <h4 className="font-display text-lg md:text-xl mb-4">Gilded / Grandmaster Claim</h4>
                <p className="mb-4">Available: <b>$PURR {availableBalance}</b></p>
                <h4 className="font-display text-base mb-4">
                    You <Link to={`https://etherscan.io/tx/${tx?.transactionHash}`} className="purr-link">claimed</Link>
                    {state.claimTX ? ` for CryptoKitty #${state.kittyId}` : ' your grandmaster allocation'}
                </h4>
                <p className="mb-6">You currently hold <b>$PURR {userBalance}</b></p>
                <button type="button" onClick={actions.reset} className="purr-btn">Make another claim</button>
            </>
        )
    }

    if (state.claiming || state.claimingGrandmaster) {
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
            <GildedMark className="w-16 h-16 md:w-24 md:h-24 mb-8" />
            <h4 className="font-display text-xl md:text-2xl mb-4">Gilded / Grandmaster Claim</h4>
            <p className="hidden md:block mb-8">Available: <b>$PURR {availableBalance}</b></p>

            <h4 className="font-display text-base mb-6">Claim Criteria</h4>

            {walletAddress ? (
                <div className="w-full flex flex-col items-center text-center leading-relaxed">
                    <Claim2Criteria />
                    {state.isGrandmaster && (
                        <div className="w-full mb-8">
                            {state.grandmasterClaimed ? (
                                <p>😼 This hatcher has already claimed the grandmaster allocation 😼</p>
                            ) : (
                                <>
                                    <p className="mb-4">✅ This wallet hatched a Fancy #1 — eligible for <b>{GRANDMASTER_REWARD} $PURR</b></p>
                                    <button
                                        type="button"
                                        className="purr-btn mb-6"
                                        disabled={!live || state.claimingGrandmaster}
                                        onClick={() => { void actions.claimGrandmaster() }}
                                    >
                                        Claim {GRANDMASTER_REWARD} $PURR
                                    </button>
                                </>
                            )}
                        </div>
                    )}

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
                                if (state.loading) return <p className="mb-4">Checking eligibility...</p>
                                if (isGildedKitty(kittyIdNum)) {
                                    return (
                                        <p className="mb-4">
                                            🙀 #{state.kittyId} is gilded — <b>{GILDED_REWARD} $PURR</b> 🙀
                                        </p>
                                    )
                                }
                                return <p className="mb-4">😿 #{state.kittyId} is not a gilded kitty 😿</p>
                            })()}

                            {!state.loading && state.kittyEligible && state.kittyOwner ? (
                                ownsKitty ? (
                                    state.claimed ? (
                                        <p className="mb-4">😼 This kitty has already claimed <b>$PURR</b> 😼</p>
                                    ) : (
                                        <p className="mb-4">✅ Eligible for {GILDED_REWARD} <b>$PURR</b> ✅</p>
                                    )
                                ) : (
                                    <p className="mb-4">❌ You don&apos;t own this kitty — only the owner can claim ❌</p>
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

                    {state.errorMessage && (
                        <p className="text-red-400 mb-4">{state.errorMessage}</p>
                    )}

                    <button
                        type="submit"
                        className="purr-btn mt-4"
                        disabled={
                            !live
                            || state.claiming
                            || !state.kittyEligible
                            || state.claimed
                            || !ownsKitty
                            || state.kittyId === ''
                        }
                        onClick={(e) => {
                            e.preventDefault()
                            if (state.kittyEligible && !state.claimed && ownsKitty) {
                                void actions.claimGilded()
                            }
                        }}
                    >
                        Claim $PURR
                    </button>
                </div>
            ) : (
                <>
                    <div className="w-full flex flex-col items-center">
                        <Claim2Criteria />
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

export default Claim2
