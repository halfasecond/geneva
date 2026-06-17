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

    const isValidAddress = (addr: string): boolean => /^0x[a-fA-F0-9]{40}$/.test(addr)

    const isValidAmount = (amt: string): boolean => {
        const num = parseFloat(amt)
        return !isNaN(num) && num > 0
    }

    const handleTransfer = async () => {
        setError(null)
        setTransferStatus(null)

        if (!isValidAddress(address)) {
            setError('Please enter a valid Ethereum address')
            return
        }

        if (!isValidAmount(amount)) {
            setError('Please enter a valid amount greater than 0')
            return
        }

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

            const result = await purr.methods.transfer(address, amountInWei).send({
                from: walletAddress
            })

            setTransferStatus(`Transfer successful! TX: ${result.transactionHash}`)
            setAmount('')
            setAddress('')
            updateBalance?.()

            setTimeout(() => setTransferStatus(null), 5000)
        } catch (err: any) {
            console.error('Transfer failed:', err)
            setError(err.message || 'Transfer failed. Please try again.')
        } finally {
            setIsTransferring(false)
        }
    }

    const displayBalance = balance === undefined
        ? '0'
        : parseFloat(fromWei(balance, 'ether')).toFixed(2)

    return (
        <div className="fixed top-5 right-5 z-[1000] flex flex-col items-end gap-2">
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                className="font-display text-sm bg-neutral-200 text-black px-4 py-2 rounded shadow-lg
                    border border-neutral-400 hover:opacity-80 transition-opacity cursor-pointer"
            >
                {`$PURR: ${displayBalance}`}
            </button>

            {open && (
                <div className="w-72 bg-neutral-200 text-black p-4 rounded shadow-lg border border-neutral-400">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleTransfer()
                        }}
                        className="flex flex-col gap-3"
                    >
                        <h4 className="font-display text-base">Transfer $PURR</h4>

                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Recipient address (0x...)"
                            disabled={isTransferring}
                            className="font-display text-xs w-full text-center rounded bg-white px-2 py-2
                                border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purr-pink"
                        />

                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Amount in $PURR"
                            step="0.01"
                            min="0"
                            disabled={isTransferring}
                            className="font-display text-xs w-full text-center rounded bg-white px-2 py-2
                                border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purr-pink"
                        />

                        {error && <p className="text-red-600 text-xs">{error}</p>}
                        {transferStatus && <p className="text-green-700 text-xs break-all">{transferStatus}</p>}

                        <button
                            type="submit"
                            disabled={isTransferring || !address || !amount}
                            className="purr-btn w-full text-xs disabled:opacity-60"
                        >
                            {isTransferring ? 'Transferring...' : 'Transfer'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    )
}

export default Balance