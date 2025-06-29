import * as Styled from './Balance.style'
import { fromWei, toWei } from 'web3-utils'
import { useEffect, useState } from 'react'
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

    async function playPurr() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        const hz = await randomFrequency();

        // Create the main oscillator for the purring tone
        const oscillator1 = audioContext.createOscillator();
        oscillator1.type = "sine"; // Sine wave for smoothness
        oscillator1.frequency.setValueAtTime(hz, audioContext.currentTime);

        // Create a second oscillator, slightly detuned from the first for richness
        const oscillator2 = audioContext.createOscillator();
        oscillator2.type = "sine"; // Sine wave for a natural smooth tone
        oscillator2.frequency.setValueAtTime(hz * 1.02, audioContext.currentTime); // Slight detuning for harmonic richness

        // Create a low-frequency oscillator (LFO) to modulate the volume for rumble effect
        const lfo = audioContext.createOscillator();
        lfo.type = "sine"; // Low-frequency oscillation for modulation
        lfo.frequency.setValueAtTime(20, audioContext.currentTime); // Fast modulation for rumbling
        const lfoGain = audioContext.createGain();
        lfoGain.gain.setValueAtTime(0.2, audioContext.currentTime); // Modulation depth

        // Create a gain node to control the volume
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Reduced starting volume (lower than before)

        // Connect oscillators to the gain node
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);

        // Apply the LFO to modulate the volume
        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);

        // Connect everything to the destination (audio output)
        gainNode.connect(audioContext.destination);
        lfo.start();

        // Start oscillators
        oscillator1.start();
        oscillator2.start();

        // Fade in the volume over 1 second for a smooth start
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 1); // Fade-in to 0.3 volume (instead of 0.4)

        // Increase the rumbling effect (more modulation depth over time)
        lfoGain.gain.linearRampToValueAtTime(1, audioContext.currentTime + 2); // More rumble after 2 seconds

        // Fade out the volume over 3 seconds to simulate natural purring fade
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 5); // Fade out over 5 seconds instead of 3 seconds

        // Stop the oscillators and LFO after 10 seconds
        oscillator1.stop(audioContext.currentTime + 10);
        oscillator2.stop(audioContext.currentTime + 10);
        lfo.stop(audioContext.currentTime + 10);
    }

    // Example usage: Get a random frequency between 20 and 150 Hz
    const randomFrequency = async () => {
        const hz = await purr.methods.purrs().call();
        return Number(hz);
    }

    // useEffect(() => {
    //     if (open) {
    //         playPurr();
    //     }
    // }, [open]);

    
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
                                opacity: isTransferring ? 0.8 : 1,
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