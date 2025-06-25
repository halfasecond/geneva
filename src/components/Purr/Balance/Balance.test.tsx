import { expect, test, beforeEach, vi } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import Balance from './Balance'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'

// Mock the contract
const mockPurrContract = {
    methods: {
        transfer: vi.fn().mockReturnValue({
            send: vi.fn().mockReturnValue(Promise.resolve({ 
                transactionHash: '0xabc123def456' 
            }))
        })
    }
} as unknown as Contract<AbiFragment[]>

// Mock the updateBalance function
const mockUpdateBalance = vi.fn()

// Default props for testing
const defaultProps = {
    balance: '1000000000000000000', // 1 PURR in Wei
    purr: mockPurrContract,
    walletAddress: '0x1234567890123456789012345678901234567890',
    updateBalance: mockUpdateBalance
}

beforeEach(() => {
    vi.clearAllMocks()
    // Reset the mock implementation
    mockPurrContract.methods.transfer = vi.fn().mockReturnValue({
        send: vi.fn().mockReturnValue(Promise.resolve({ 
            transactionHash: '0xabc123def456' 
        }))
    })
})

test('renders Balance component with balance display', () => {
    const { getByText } = render(<Balance {...defaultProps} />)
    expect(getByText('$PURR: 1.00')).toBeTruthy()
})

test('renders Balance component with zero balance when undefined', () => {
    const { getByText } = render(<Balance {...defaultProps} balance={undefined} />)
    expect(getByText('$PURR: 0')).toBeTruthy()
})

test('shows transfer form when balance is clicked', async () => {
    const { getByText, getByPlaceholderText } = render(<Balance {...defaultProps} />)
    
    await act(async () => {
        fireEvent.click(getByText('$PURR: 1.00'))
    })
    
    expect(getByPlaceholderText('Recipient address (0x...)')).toBeTruthy()
    expect(getByPlaceholderText('Amount in $PURR')).toBeTruthy()
    const button = getByText('Transfer') as HTMLButtonElement
    expect(button.type).toBe('submit')
})

test('validates recipient address format', async () => {
    const { getByText, getByPlaceholderText } = render(<Balance {...defaultProps} />)
    
    await act(async () => {
        fireEvent.click(getByText('$PURR: 1.00'))
    })
    
    const addressInput = getByPlaceholderText('Recipient address (0x...)')
    const amountInput = getByPlaceholderText('Amount in $PURR')
    const transferButton = getByText('Transfer') as HTMLButtonElement
    
    await act(async () => {
        fireEvent.change(addressInput, { target: { value: 'invalid-address' } })
        fireEvent.change(amountInput, { target: { value: '0.5' } })
        fireEvent.click(transferButton)
    })
    
    expect(getByText('Please enter a valid Ethereum address')).toBeTruthy()
})

test('validates transfer amount is positive', async () => {
    const { getByText, getByPlaceholderText } = render(<Balance {...defaultProps} />)
    
    await act(async () => {
        fireEvent.click(getByText('$PURR: 1.00'))
    })
    
    const addressInput = getByPlaceholderText('Recipient address (0x...)')
    const amountInput = getByPlaceholderText('Amount in $PURR')
    const transferButton = getByText('Transfer') as HTMLButtonElement
    
    await act(async () => {
        fireEvent.change(addressInput, { target: { value: '0x1234567890123456789012345678901234567890' } })
        fireEvent.change(amountInput, { target: { value: '0' } })
        fireEvent.click(transferButton)
    })
    
    expect(getByText('Please enter a valid amount greater than 0')).toBeTruthy()
})

test('validates transfer amount does not exceed balance', async () => {
    const { getByText, getByPlaceholderText } = render(<Balance {...defaultProps} />)
    
    await act(async () => {
        fireEvent.click(getByText('$PURR: 1.00'))
    })
    
    const addressInput = getByPlaceholderText('Recipient address (0x...)')
    const amountInput = getByPlaceholderText('Amount in $PURR')
    const transferButton = getByText('Transfer') as HTMLButtonElement
    
    await act(async () => {
        fireEvent.change(addressInput, { target: { value: '0x1234567890123456789012345678901234567890' } })
        fireEvent.change(amountInput, { target: { value: '2' } }) // More than 1 PURR balance
        fireEvent.click(transferButton)
    })
    
    expect(getByText('Insufficient balance. You have 1.00 $PURR')).toBeTruthy()
})

test('disables transfer button when inputs are empty', async () => {
    const { getByText, getByPlaceholderText } = render(<Balance {...defaultProps} />)
    
    await act(async () => {
        fireEvent.click(getByText('$PURR: 1.00'))
    })
    
    // Ensure form is visible
    expect(getByPlaceholderText('Recipient address (0x...)')).toBeTruthy()
    
    const transferButton = getByText('Transfer') as HTMLButtonElement
    expect(transferButton.disabled).toBeTruthy()
})

test('enables transfer button when valid inputs are provided', async () => {
    const { getByText, getByPlaceholderText } = render(<Balance {...defaultProps} />)
    
    await act(async () => {
        fireEvent.click(getByText('$PURR: 1.00'))
    })
    
    const addressInput = getByPlaceholderText('Recipient address (0x...)')
    const amountInput = getByPlaceholderText('Amount in $PURR')
    const transferButton = getByText('Transfer') as HTMLButtonElement
    
    await act(async () => {
        fireEvent.change(addressInput, { target: { value: '0x1234567890123456789012345678901234567890' } })
        fireEvent.change(amountInput, { target: { value: '0.5' } })
    })
    
    expect(transferButton.disabled).toBeFalsy()
})

test('executes transfer with correct parameters and shows success message', async () => {
    const { getByText, getByPlaceholderText } = render(<Balance {...defaultProps} />)
    
    await act(async () => {
        fireEvent.click(getByText('$PURR: 1.00'))
    })
    
    const addressInput = getByPlaceholderText('Recipient address (0x...)')
    const amountInput = getByPlaceholderText('Amount in $PURR')
    const transferButton = getByText('Transfer') as HTMLButtonElement
    
    await act(async () => {
        fireEvent.change(addressInput, { target: { value: '0x9876543210987654321098765432109876543210' } })
        fireEvent.change(amountInput, { target: { value: '0.5' } })
        fireEvent.click(transferButton)
    })
    
    // Check that contract transfer method was called with correct parameters
    expect(mockPurrContract.methods.transfer).toHaveBeenCalledWith(
        '0x9876543210987654321098765432109876543210',
        '500000000000000000' // 0.5 PURR in Wei
    )
    
    // Check that send was called with correct from address
    const transferCall = mockPurrContract.methods.transfer()
    expect(transferCall.send).toHaveBeenCalledWith({
        from: '0x1234567890123456789012345678901234567890'
    })
    
    // Check success message
    expect(getByText(/Transfer successful! TX: 0xabc123def456/)).toBeTruthy()
})

test('clears form after successful transfer', async () => {
    const { getByText, getByPlaceholderText } = render(<Balance {...defaultProps} />)
    
    await act(async () => {
        fireEvent.click(getByText('$PURR: 1.00'))
    })
    
    const addressInput = getByPlaceholderText('Recipient address (0x...)') as HTMLInputElement
    const amountInput = getByPlaceholderText('Amount in $PURR') as HTMLInputElement
    const transferButton = getByText('Transfer') as HTMLButtonElement
    
    await act(async () => {
        fireEvent.change(addressInput, { target: { value: '0x9876543210987654321098765432109876543210' } })
        fireEvent.change(amountInput, { target: { value: '0.5' } })
        fireEvent.click(transferButton)
    })
    
    // Check that form inputs are cleared
    expect(addressInput.value).toBe('')
    expect(amountInput.value).toBe('')
})

test('calls updateBalance after successful transfer', async () => {
    const { getByText, getByPlaceholderText } = render(<Balance {...defaultProps} />)
    
    await act(async () => {
        fireEvent.click(getByText('$PURR: 1.00'))
    })
    
    const addressInput = getByPlaceholderText('Recipient address (0x...)')
    const amountInput = getByPlaceholderText('Amount in $PURR')
    const transferButton = getByText('Transfer') as HTMLButtonElement
    
    await act(async () => {
        fireEvent.change(addressInput, { target: { value: '0x9876543210987654321098765432109876543210' } })
        fireEvent.change(amountInput, { target: { value: '0.5' } })
        fireEvent.click(transferButton)
    })
    
    expect(mockUpdateBalance).toHaveBeenCalled()
})

test('shows loading state during transfer', async () => {
    // Mock a delayed transfer
    const delayedTransfer = vi.fn().mockReturnValue({
        send: vi.fn().mockReturnValue(new Promise(resolve => 
            setTimeout(() => resolve({ transactionHash: '0xabc123def456' }), 100)
        ))
    })
    mockPurrContract.methods.transfer = delayedTransfer
    
    const { getByText, getByPlaceholderText } = render(<Balance {...defaultProps} />)
    
    await act(async () => {
        fireEvent.click(getByText('$PURR: 1.00'))
    })
    
    const addressInput = getByPlaceholderText('Recipient address (0x...)') as HTMLInputElement
    const amountInput = getByPlaceholderText('Amount in $PURR') as HTMLInputElement
    const transferButton = getByText('Transfer') as HTMLButtonElement
    
    await act(async () => {
        fireEvent.change(addressInput, { target: { value: '0x9876543210987654321098765432109876543210' } })
        fireEvent.change(amountInput, { target: { value: '0.5' } })
        fireEvent.click(transferButton)
    })
    
    // Check loading state
    expect(getByText('Transferring...')).toBeTruthy()
    expect(addressInput.disabled).toBeTruthy()
    expect(amountInput.disabled).toBeTruthy()
    expect(transferButton.disabled).toBeTruthy()
})

test('handles transfer failure and shows error message', async () => {
    // Mock a failed transfer
    const failedTransfer = vi.fn().mockReturnValue({
        send: vi.fn().mockRejectedValue(new Error('Transaction failed'))
    })
    mockPurrContract.methods.transfer = failedTransfer
    
    const { getByText, getByPlaceholderText } = render(<Balance {...defaultProps} />)
    
    await act(async () => {
        fireEvent.click(getByText('$PURR: 1.00'))
    })
    
    const addressInput = getByPlaceholderText('Recipient address (0x...)')
    const amountInput = getByPlaceholderText('Amount in $PURR')
    const transferButton = getByText('Transfer') as HTMLButtonElement
    
    await act(async () => {
        fireEvent.change(addressInput, { target: { value: '0x9876543210987654321098765432109876543210' } })
        fireEvent.change(amountInput, { target: { value: '0.5' } })
        fireEvent.click(transferButton)
    })
    
    expect(getByText('Transaction failed')).toBeTruthy()
})

test('works without updateBalance callback', async () => {
    const propsWithoutCallback = {
        ...defaultProps,
        updateBalance: undefined
    }
    
    const { getByText, getByPlaceholderText } = render(<Balance {...propsWithoutCallback} />)
    
    await act(async () => {
        fireEvent.click(getByText('$PURR: 1.00'))
    })
    
    const addressInput = getByPlaceholderText('Recipient address (0x...)')
    const amountInput = getByPlaceholderText('Amount in $PURR')
    const transferButton = getByText('Transfer') as HTMLButtonElement
    
    await act(async () => {
        fireEvent.change(addressInput, { target: { value: '0x9876543210987654321098765432109876543210' } })
        fireEvent.change(amountInput, { target: { value: '0.5' } })
        fireEvent.click(transferButton)
    })
    
    // Should not throw error and should show success message
    expect(getByText(/Transfer successful! TX: 0xabc123def456/)).toBeTruthy()
})

test('toggles form visibility when balance is clicked', async () => {
    const { getByText, queryByPlaceholderText, getByPlaceholderText } = render(<Balance {...defaultProps} />)
    
    // Form should be hidden initially (open: false)
    expect(queryByPlaceholderText('Recipient address (0x...)')).toBeFalsy()
    
    // Click to show
    await act(async () => {
        fireEvent.click(getByText('$PURR: 1.00'))
    })
    
    expect(getByPlaceholderText('Recipient address (0x...)')).toBeTruthy()
    
    // Click to hide again
    await act(async () => {
        fireEvent.click(getByText('$PURR: 1.00'))
    })
    
    expect(queryByPlaceholderText('Recipient address (0x...)')).toBeFalsy()
})