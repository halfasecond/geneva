import { useEffect, useState } from 'react'
import { getContract } from '../../utils'
import { AbiFragment } from 'web3'
import { Contract } from 'web3-eth-contract'
import { abi } from '@openzeppelin/contracts/build/contracts/ERC721.json'
import { isAddress } from 'web3-validator'

export interface FormDetails {
    tokenId: string,
    transferrable: boolean,
    contractAddress: string,
    contractAbi: string,
    loading: boolean,
    transferSuccess: boolean,
}

const initFormState = {
    tokenId: '',
    transferrable: false,
    loading: false,
    contractAddress: '',
    contractAbi: '',
    transferSuccess: false,
}

const ERC721: React.FC<{ 
    walletAddress: string,
    dapperWalletAddress: string,
    invokeTx: (address: string, method: any, amount: string | undefined) => Promise<void>,
}> = ({ walletAddress, dapperWalletAddress, invokeTx }) => {

    const [balance, setBalance] = useState<number>(0)
    const [contract, setContract] = useState<Contract<AbiFragment[]> | undefined>(undefined)
    const [formDetails, setFormDetails] = useState<FormDetails>(initFormState)

    useEffect(() => {
        if (formDetails.transferrable) {
            setFormDetails(prevState => ({ ...prevState, transferrable: false }))
        }
    }, [formDetails.tokenId])

    const getTokenBalance = async () => {
        if (contract) {
            const _balance = await contract.methods.balanceOf(dapperWalletAddress).call()
            if (_balance !== undefined && _balance !== null) {
                setBalance(parseInt(_balance.toString()))
            }
        }
    }

    useEffect(() => {
        if (contract) {
            getTokenBalance()
        }
    }, [contract])

    const handleSetContract = async () => {
        if (isAddress(formDetails.contractAddress)) {
            try {
                const _abi = formDetails.contractAbi === '' ? abi : JSON.parse(formDetails.contractAbi)
                const _contract = getContract(_abi, formDetails.contractAddress)
                setContract(_contract)
            } catch (error) {
                alert('something went wrong setting the ERC-721 contract')
            }
        }
    }

    const handleCheckOwnership = async () => {
        if (/^\d+$/.test(formDetails.tokenId.trim()) && contract) {
            setFormDetails(prevState => ({ ...prevState, loading: true }))
            const tokenId = formDetails.tokenId.trim()
            try {
                const owner = await contract.methods.ownerOf(tokenId).call()
                if (owner && owner.toString().toLowerCase() === dapperWalletAddress.toLowerCase()) {
                    setFormDetails(prevState => ({ ...prevState, tokenId, transferrable: true }))
                } else {
                    alert('NFT not owned by this Dapper Wallet')
                }
            } catch (error) {
                alert('An error occurred while checking ownership.')
            } finally {
                setFormDetails(prevState => ({ ...prevState, loading: false }))
            }
        } else {
            alert('Invalid token id. Please try again.')
        }
    }
    
    const handleTransfer = async () => {
        setFormDetails(prevState => ({ ...prevState, loading: true }))
        if (contract) {
            const methodCall = contract.methods.safeTransferFrom(dapperWalletAddress, walletAddress, formDetails.tokenId)
            try {
                await invokeTx(formDetails.contractAddress, methodCall, '0')
                setFormDetails(prevState => ({ ...prevState, transferrable: false, transferSuccess: true }))
            } catch (e) {
                alert('Failed to transfer. Please try again')
            } finally {
                setFormDetails(prevState => ({ ...prevState, loading: false }))
            }
        }
    }

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>,
        changeParam: keyof FormDetails
    ) => {
        const { value } = e.target
        const newState = { ...formDetails }
        if (changeParam === 'tokenId' || changeParam === 'contractAddress' || changeParam === 'contractAbi') {
            newState[changeParam] = value
        }
        setFormDetails(newState)
    }

    const resetForm = () => setFormDetails(initFormState)

    return (
        <>
            <h2>{`ERC-721 Transfers`}</h2>
            {balance > 0 && <p>{`You currently have: ${balance} of this type of NFT on your Dapper wallet`}</p>}
            <p>{`You can use this page to transfer ERC-721 compliant NFTs that reside on your Dapper Wallet.`}</p>
            {contract === undefined ? (
                <>  
                    <label htmlFor={'nftContractAddress'}>
                        Enter the address of the NFT contract:
                        <input
                            id={'nftContractAddress'}
                            type='text'
                            value={formDetails.contractAddress}
                            onChange={(e) => handleChange(e, 'contractAddress')}
                            disabled={formDetails.loading}
                        />
                    </label>
                    <label htmlFor={'contractAbi'}>
                        {`Enter the abi of the NFT contract:`} <i>{`(optional)`}</i>
                        <textarea id={'contractAbi'} onChange={e => handleChange(e, 'contractAbi')} value={formDetails.contractAbi} disabled={formDetails.loading} />
                    </label>
                    <button onClick={handleSetContract} disabled={formDetails.loading || !isAddress(formDetails.contractAddress)}>{'set contract'}</button>
                </>
            ) : (
                <>
                    <p>{`Enter an NFT token id to check if the NFT can be transferred.`}</p>
                    <h3>{`Transfer NFT from contract:`}</h3>
                    {contract && <code>{formDetails.contractAddress}</code>}
                    {formDetails.transferSuccess ? (
                        <>
                            <p><span className={'success'}>✓</span>{`Transfer method invoked for Token ID: #${formDetails.tokenId}`}</p>
                            <button onClick={resetForm}>{`Reset form`}</button>
                        </>
                    ) : (
                        <label htmlFor={'tokenId'}>
                            {`token id:`} 
                            <input id={'tokenId'} type={'text'} className={'tokenId'} value={formDetails.tokenId} onChange={e => handleChange(e, 'tokenId')} disabled={formDetails.loading} />
                            {formDetails.transferrable ? (
                                <button onClick={handleTransfer} disabled={formDetails.loading}>{`transfer token #${formDetails.tokenId}`}</button>
                            ) : (
                                <button onClick={handleCheckOwnership} disabled={formDetails.loading}>{'check ownership'}</button>
                            )}
                        </label>
                    )}
                </>
            )}
        </>
    )
}

export default ERC721