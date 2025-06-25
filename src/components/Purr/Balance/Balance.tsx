import * as Styled from './Balance.style'
import { fromWei, toWei } from 'web3-utils'
import { useState } from 'react'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'

const Balance: React.FC<{
    balance: string | undefined,
    purr: Contract<AbiFragment[]>,
    walletAddress: string,
    updateBalance?: () => void
}> = ({ balance, purr, walletAddress, updateBalance }) => {
    const [open, setOpen] = useState(false)
    const [amount, setAmount] = useState('')
    const [address, setAddress] = useState('')
    const [isTransferring, setIsTransferring] = useState(false)
    const [transferStatus, setTransferStatus] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Validate Ethereum address
    const isValidAddress = (addr: string): boolean => {
        return /^0x[a-fA-F0-9]{40}$/.test(addr)
    }

    // Validate amount
    const isValidAmount = (amt: string): boolean => {
        const num = parseFloat(amt)
        return !isNaN(num) && num > 0
    }

    // Handle transfer
    const handleTransfer = async () => {
        setError(null)
        setTransferStatus(null)

        // Validation
        if (!isValidAddress(address)) {
            setError('Please enter a valid Ethereum address')
            return
        }

        if (!isValidAmount(amount)) {
            setError('Please enter a valid amount greater than 0')
            return
        }

        // Check if user has enough balance
        if (balance) {
            const balanceInEther = parseFloat(fromWei(balance, 'ether'))
            const transferAmount = parseFloat(amount)
            if (transferAmount > balanceInEther) {
                setError(`Insufficient balance. You have ${balanceInEther.toFixed(2)} $PURR`)
                return
            }
        }

        try {
            setIsTransferring(true)
            setTransferStatus('Initiating transfer...')

            const amountInWei = toWei(amount, 'ether')

            setTransferStatus('Waiting for transaction confirmation...')

            // Execute transfer
            const result = await purr.methods.transfer(address, amountInWei).send({
                from: walletAddress
            })

            setTransferStatus(`Transfer successful! TX: ${result.transactionHash}`)
            
            // Clear form
            setAmount('')
            setAddress('')
            
            // Update balance if callback provided
            if (updateBalance) {
                updateBalance()
            }
            
            // Auto-hide success message after 5 seconds
            setTimeout(() => {
                setTransferStatus(null)
            }, 5000)

        } catch (err: any) {
            console.error('Transfer failed:', err)
            setError(err.message || 'Transfer failed. Please try again.')
        } finally {
            setIsTransferring(false)
        }
    }

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        handleTransfer()
    }

    return (
        <>
            <Styled.Div>
                <span onClick={() => setOpen(prevState => !prevState)}>
                    {`$PURR: ${balance === undefined ? '0' : parseFloat(fromWei(balance, 'ether')).toFixed(2)}`}
                </span>
            </Styled.Div>
            {open && (
                <Styled.Div className={'menu'}>
                    <form onSubmit={handleSubmit}>
                        <h4>Transfer $PURR</h4>
                        
                        <input
                            type={'text'}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder={'Recipient address (0x...)'}
                            disabled={isTransferring}
                        />
                        
                        <input
                            type={'number'}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={'Amount in $PURR'}
                            step="0.01"
                            min="0"
                            disabled={isTransferring}
                        />

                        {error && (
                            <div style={{ color: 'red', fontSize: '12px', marginBottom: '8px' }}>
                                {error}
                            </div>
                        )}

                        {transferStatus && (
                            <div style={{ color: 'green', fontSize: '12px', marginBottom: '8px' }}>
                                {transferStatus}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isTransferring || !address || !amount}
                            style={{
                                width: '100%',
                                padding: '8px',
                                backgroundColor: isTransferring ? '#ccc' : '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isTransferring ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isTransferring ? 'Transferring...' : 'Transfer'}
                        </button>
                    </form>
                </Styled.Div>
            )}
        </>
    )
}

export default Balance