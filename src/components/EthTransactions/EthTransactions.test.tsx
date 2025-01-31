import { expect, test, beforeEach, vi } from 'vitest'
import { act, render, fireEvent } from '@testing-library/react'
import EthTransactions from './EthTransactions'
import { utils } from 'web3'

// Mock invokeTx method
const mockInvokeTx = vi.fn()

beforeEach(() => {
    vi.clearAllMocks()
    window.alert = vi.fn() // Mock alert
})

test('renders EthTransactions component', async () => {
    const { getByText } = render(<EthTransactions walletAddress="0x123" invokeTx={mockInvokeTx} />)
    const titleElement = getByText('Move Ethereum Between Wallets')
    expect(titleElement).toBeTruthy()
})

test('allows input for recipient address and amount', async () => {
    const { getByLabelText } = render(<EthTransactions walletAddress="0x123" invokeTx={mockInvokeTx} />)
    const recipientInput = getByLabelText(/Recipient Address:/i) as HTMLInputElement
    const amountInput = getByLabelText(/Amount \(ETH\):/i) as HTMLInputElement
    await act(async () => {
        fireEvent.change(recipientInput, { target: { value: '0x456' } })
        fireEvent.change(amountInput, { target: { value: '0.5' } })
    })
    expect(recipientInput.value).toBe('0x456')
    expect(amountInput.value).toBe('0.5')
})

test('calls invokeTx with correct parameters on transfer', async () => {
    const { getByLabelText, getByText } = render(<EthTransactions walletAddress="0x123" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Recipient Address:/i), { target: { value: '0x456' } })
        fireEvent.change(getByLabelText(/Amount \(ETH\):/i), { target: { value: '0.5' } })
        fireEvent.click(getByText('Transfer ETH'))
    })
    expect(mockInvokeTx).toHaveBeenCalledTimes(1)
    expect(mockInvokeTx).toHaveBeenCalledWith('0x456', undefined, utils.toWei('0.5', 'ether'))
})

test('displays success message on successful transfer', async () => {
    const { getByLabelText, getByText, findByText } = render(<EthTransactions walletAddress="0x123" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Recipient Address:/i), { target: { value: '0x456' } })
        fireEvent.change(getByLabelText(/Amount \(ETH\):/i), { target: { value: '0.5' } })
        fireEvent.click(getByText('Transfer ETH'))
    })
    const successMessage = await findByText(/Successfully transferred 0.5 ETH to 0x456/i)
    expect(successMessage).toBeTruthy()
})

test('displays error message on failed transfer', async () => {
    const { getByLabelText, getByText } = render(<EthTransactions walletAddress="0x123" invokeTx={mockInvokeTx} />)
    mockInvokeTx.mockRejectedValueOnce(new Error('Transaction failed')) // Mock a failed transaction
    await act(async () => {
        fireEvent.change(getByLabelText(/Recipient Address:/i), { target: { value: '0x456' } })
        fireEvent.change(getByLabelText(/Amount \(ETH\):/i), { target: { value: '0.5' } })
        fireEvent.click(getByText('Transfer ETH'))
    })
    expect(window.alert).toHaveBeenCalledWith('Failed to transfer ETH. Please try again.')
})
