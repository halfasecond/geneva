import { useEffect, useState } from 'react'
import { isAddress } from 'web3-validator'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'
import { grey } from 'style/config'
import { claimTiers } from './config'
import * as Styled from './Claim.style'

const Claim: React.FC<{
    walletAddress: string | undefined,
    cryptokitties: Contract<AbiFragment[]>,
    purrClaim: Contract<AbiFragment[]>,
    purr: Contract<AbiFragment[]>,
}> = ({ walletAddress, cryptokitties, purr, purrClaim }) => {

    const [formDetails, setFormDetails] = useState<{
        walletInput: string,
        submit: boolean,
        loading: boolean
    }>({
        walletInput: walletAddress ? walletAddress : '',
        submit: false,
        loading: false
    })

    const [claiming, setClaiming] = useState<boolean>(false)
    const [claimed, setClaimed] = useState<boolean>(false)

    const [balance, setBalance] = useState<number | undefined>(undefined)

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>,
        changeParam: 'walletInput'
    ) => {
        const { value } = e.target
        const newState = { ...formDetails }
        if (changeParam === 'walletInput') {
            newState['walletInput'] = value
        }
        setFormDetails(newState)
    }

    useEffect(() => {
        if (walletAddress) {
            setFormDetails(prevState => ({ ...prevState, walletInput: walletAddress }))
        }
    }, [walletAddress])

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
                    setFormDetails(prevState => ({ ...prevState, submit: false }))
                }
            } catch (error) {
                console.error(error)
            }
        }
        if (formDetails.submit) {
            getClaimStatus()
        }
    }, [formDetails.submit])

    const getAvailableClaim = (balance: number): number | undefined => {
        const tier = claimTiers.find(({ threshold }) => balance >= threshold)
        return tier?.reward
    }

    const claim = async () => {
        setClaiming(true)
        try {
            await purrClaim.methods.claim().send({ from: walletAddress })
            // setClaimSuccess(true)
        } catch (error) {
            // setClaimError(true)
            console.error(error)
        } finally {
            setClaiming(false)
        }
    }

    if (claimed) {
        return (
            <Styled.Div>
                <p>Your are not eligible to claim <b>$PURR</b> at this time</p>
            </Styled.Div>
        )
    }

    if (balance !== undefined) {
        return (
            <>
                <Styled.Div>
                    {[...claimTiers].reverse().map(({ threshold, reward }) => (
                        <div 
                            key={threshold}
                            style={{ backgroundColor: getAvailableClaim(balance) === reward ? grey[300] : 'transparent' }}
                        >{`>= ${threshold} CryptoKitties =`}<b>{`${reward} $PURR`}</b></div>
                    ))}
                </Styled.Div>
                
                {balance > 9 ? (
                    <Styled.Form onSubmit={e => {
                        e.preventDefault()
                        claim()
                    }}>
                        <code>🐾 You are eligible for <b>{getAvailableClaim(balance)} $PURR</b> 🐾</code>
                        <input 
                            type={'submit'}
                            value={`Claim ${getAvailableClaim(balance)} $PURR`}
                            disabled={claiming}
                        />
                    </Styled.Form>
                ) : (
                    <code>{`🐾 You are not eligible to claim $PURR at this time. 🐾`}</code>
                )}
            </>
        )
    }

    return (
        <Styled.Form onSubmit={e => {
            e.preventDefault()
            setFormDetails(prevState => ({ ...prevState, submit: true }))
        }}>
            <label htmlFor={'walletAddress'}>
                Enter your wallet address:
                <input
                    id={'walletAddress'}
                    type='text'
                    value={formDetails.walletInput}
                    onChange={(e) => handleChange(e, 'walletInput')}
                    disabled={formDetails.loading}
                />
                <input 
                    type={'submit'}
                    value={'Check your $PURR eligibility'}
                    disabled={formDetails.loading || !isAddress(formDetails.walletInput)}
                />
            </label>
        </Styled.Form>
    )

}

export default Claim