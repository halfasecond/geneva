import { useEffect, useState } from 'react'
import { isAddress } from 'web3-validator'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'
import { fromWei } from 'web3-utils'
import { claimTiers } from './config'
import * as Styled from './Claim.style'
import { getAssetPath } from 'utils/assetPath'

const Claim: React.FC<{
    walletAddress: string | undefined,
    cryptokitties: Contract<AbiFragment[]>,
    purrClaim: Contract<AbiFragment[]>,
    purrBalance: string,
    purrClaimBalance: string,
    handleSignIn: () => void,
}> = ({ walletAddress, cryptokitties, purrClaim, purrBalance, handleSignIn }) => {

    const [claiming, setClaiming] = useState<boolean>(false)
    const [claimed, setClaimed] = useState<boolean>(false)
    const [balance, setBalance] = useState<number | undefined>(undefined)
    const [claimSuccess, setClaimSuccess] = useState<boolean>(false)

    useEffect(() => {
        const getClaimStatus = async () => {
            const hasAddressClaimed = await purrClaim.methods.hasAddressClaimed(walletAddress).call()
            if (hasAddressClaimed) {
                setClaimed(true)
            } else {
                getCryptoKittiesBalanceAndTotal()
            }
        }
        const getCryptoKittiesBalanceAndTotal = async () => {
            try {
                const _balance = await cryptokitties.methods.balanceOf(walletAddress).call()
                if (_balance) {
                    setBalance(parseInt(_balance.toString()))
                }
            } catch (error) {
                console.error(error)
            }
        }
        if (walletAddress && isAddress(walletAddress)) {
            getClaimStatus()
        } else {
            if (claimed || balance) {
                setClaimed(false)
                setBalance(undefined)
            }

        }
    }, [walletAddress])

    const getAvailableClaim = (balance: number): number | undefined => {
        const tier = claimTiers.find(({ threshold }) => balance >= threshold)
        return tier?.reward
    }

    const claim = async () => {
        setClaiming(true)
        try {
            await purrClaim.methods.claim().send({ from: walletAddress })
            console.log('purr claimed')
            setClaimSuccess(true)
        } catch (error) {
            console.error(error)
        } finally {
            setClaiming(false)
        }
    }

    if (claimSuccess) {
        return (
            <Styled.Form onSubmit={e => {
                e.preventDefault()
            }}>
                <Styled.Div>
                    <p>{`Congratulations - your $PURR-ing...`}</p>
                    <p>{'You currently hold '}<b>{'$PURR '}{purrBalance ? fromWei(purrBalance, 'ether') : '0'}</b></p>
                </Styled.Div>
            </Styled.Form>
        )
    }

    if (claimed) {
        return (
            <Styled.Form onSubmit={e => {
                e.preventDefault()
            }}>
                <Styled.Div>
                    <p>{`😿 You are not eligible to claim `}<b>$PURR</b>{` 😿`}</p>
                    <p>{'You currently hold '}<b>{'$PURR '}{purrBalance ? fromWei(purrBalance, 'ether') : '0'}</b></p>
                </Styled.Div>
            </Styled.Form>

        )
    }

    if (claiming) {
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

    return (
        <>
            <Styled.Form onSubmit={e => {
                e.preventDefault()
                claim()
            }}>
                <p className={'claim'}>$PURR Claim Criteria:</p>
                {walletAddress ? (
                    <>
                        <Styled.Div>
                            {(balance === undefined || balance < 10) ? (
                                <p>{`😿 You are currently not eligible to claim `}<b>$PURR</b>{` 😿`}</p>
                            ) : (
                                <p>{`🙀 You are eligible for ${getAvailableClaim(balance)} $PURR 🙀`}</p>
                            )}
                        </Styled.Div>
                        {!(balance === undefined || balance < 10) && (
                             <input
                                type={'submit'}
                                value={`Claim ${getAvailableClaim(balance)} $PURR`}
                                disabled={claiming}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <Styled.Div>
                            {[...claimTiers].reverse().map(({ threshold, reward }, i) => (
                                <p key={i}>
                                    {`>= ${threshold} CryptoKitties: `}<b>{`$PURR ${reward} `}</b>
                                </p>
                            ))}
                        </Styled.Div>
                        <br /><br />
                        <p>
                            <span role={'button'} onClick={handleSignIn}>Sign in with Metamask</span> to check your eligibility.
                        </p>
                    </>
                )}
            </Styled.Form>
        </>
    )
}

export default Claim