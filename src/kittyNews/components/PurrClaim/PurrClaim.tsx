import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'
import { fromWei } from 'web3-utils'
import { useClaimLogic } from './useClaimLogic'
import { diamonds } from './diamonds'
import exclusives from './exclusives'
import * as Styled from './PurrClaim.style'
import { API, CDN } from 'kittyNews/api'

type RoundId = 'day1' | 'gilded'

const ROUNDS: {
    id: RoundId
    label: string
    icon: string
    criteria: { label: string; reward: string }[]
}[] = [
    {
        id: 'day1',
        label: 'Day1 / Diamond',
        icon: `${CDN}/images/purr/ether-diamond.gif`,
        criteria: [
            { label: 'Day1 CryptoKitties', reward: '10' },
            { label: 'Diamond CryptoKitties', reward: '100' },
        ],
    },
    {
        id: 'gilded',
        label: 'Gilded / Grandmaster',
        icon: `${CDN}/images/purr/icons/gilded.svg`,
        criteria: [
            { label: 'Gilded CryptoKitties', reward: '100' },
            { label: 'Fancy #1 Breeders', reward: '1000' },
        ],
    },
]

const isYes = (value: unknown) => value === true || value === 'true'

const PurrClaim: React.FC<{
    walletAddress: string | undefined,
    purrClaim: Contract<AbiFragment[]>,
    purrClaim2: Contract<AbiFragment[]> | undefined,
    cryptokitties: Contract<AbiFragment[]>,
    purrClaimBalance: string | undefined,
    purrClaim2Balance: string | undefined,
}> = ({ walletAddress, purrClaim, purrClaim2, cryptokitties, purrClaimBalance, purrClaim2Balance }) => {
    const { state, actions } = useClaimLogic(walletAddress, purrClaim, cryptokitties)
    const [round, setRound] = useState<RoundId>('day1')
    const [gildedLoading, setGildedLoading] = useState(false)
    const [gildedCheck, setGildedCheck] = useState<{ id: string; eligible: boolean } | undefined>()
    const [grandmaster, setGrandmaster] = useState<{ eligible: boolean; claimed: boolean } | undefined>()

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

    useEffect(() => {
        if (round !== 'gilded' || !state.kittyId || !/^\d+$/.test(state.kittyId)) {
            setGildedCheck(undefined)
            setGildedLoading(false)
            return
        }
        let cancel = false
        const kittyId = state.kittyId
        setGildedLoading(true)
        const timeoutId = setTimeout(async () => {
            try {
                const { data } = await axios.get(`${API}/purr/claims2/${kittyId}`)
                if (!cancel) setGildedCheck({ id: kittyId, eligible: Boolean(data?.isGilded) })
            } catch (e) {
                console.log(e)
                if (!cancel) setGildedCheck({ id: kittyId, eligible: false })
            } finally {
                if (!cancel) setGildedLoading(false)
            }
        }, 1000)
        return () => {
            cancel = true
            clearTimeout(timeoutId)
        }
    }, [state.kittyId, round])

    useEffect(() => {
        if (!walletAddress || !purrClaim2) {
            setGrandmaster(undefined)
            return
        }
        let cancel = false
        const check = async () => {
            try {
                const eligible = await purrClaim2.methods.isGrandmaster(walletAddress).call()
                const claimed = isYes(eligible)
                    ? await purrClaim2.methods.hasGrandmasterClaimed(walletAddress).call()
                    : false
                if (!cancel) setGrandmaster({ eligible: isYes(eligible), claimed: isYes(claimed) })
            } catch (e) {
                console.log(e)
                if (!cancel) setGrandmaster(undefined)
            }
        }
        void check()
        return () => {
            cancel = true
        }
    }, [walletAddress, purrClaim2])

    const active = ROUNDS.find((item) => item.id === round) || ROUNDS[0]
    const availableBalance = round === 'gilded' ? purrClaim2Balance : purrClaimBalance

    return (
        <Styled.Div>
            <img src={active.icon} alt="" />
            <h2>$PURR CLAIM</h2>
            <p>Available: <b>{'$PURR '}{!(availableBalance === undefined) ? fromWei(availableBalance, 'ether') : <img src={`${CDN}/images/purr/loading.png`} alt={''} />}</b></p>
            <ol>
                {active.criteria.map((item) => (
                    <li key={item.label}>{item.label} - <b>$PURR {item.reward}</b></li>
                ))}
            </ol>
            <div className="panel">
                <div>
                    <label>enter your kitty id:</label>
                    <input
                        type="text"
                        value={state.kittyId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const value = e.target.value
                            if (value === '' || /^\d+$/.test(value)) {
                                actions.setKittyId(value)
                            }
                        }}
                        placeholder="#123"
                    />
                </div>
                {round === 'day1' ? (
                    state.loading ? (
                        <img src={`${CDN}/images/purr/loading.png`} alt={''} />
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
                    )
                ) : (
                    <>
                        {state.kittyId !== '' && (
                            gildedLoading || gildedCheck?.id !== state.kittyId ? (
                                <img src={`${CDN}/images/purr/loading.png`} alt={''} />
                            ) : gildedCheck.eligible ? (
                                <>
                                    <p>🙀 kitty is eligible to claim 🙀</p>
                                    <p><b>$PURR 100</b></p>
                                </>
                            ) : (
                                <p>😿 kitty is not a gilded kitty 😿</p>
                            )
                        )}
                        {walletAddress ? (
                            grandmaster?.eligible ? (
                                <>
                                    <p>✅ This wallet hatched a Fancy #1</p>
                                    <p><b>$PURR 1000</b></p>
                                    {grandmaster.claimed && <p>😼 Grandmaster allocation already claimed 😼</p>}
                                </>
                            ) : null
                        ) : (
                            <p>Sign in to check the grandmaster award.</p>
                        )}
                    </>
                )}
                <br />
                <p>visit <Link to={'https://purr.international'} target={'_blank'}>purr.international</Link> to claim</p>
            </div>
            <p className="round-name">{active.label}</p>
            <div className="rounds" role="tablist" aria-label="Claim rounds">
                {ROUNDS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={item.id === round}
                        aria-label={item.label}
                        onClick={() => setRound(item.id)}
                    />
                ))}
            </div>
        </Styled.Div>
    )
}

export default PurrClaim
