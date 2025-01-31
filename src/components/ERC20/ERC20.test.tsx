import { expect, test, beforeEach, vi } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import ERC20 from './ERC20'
import { abi } from '@openzeppelin/contracts/build/contracts/ERC20.json'
import abis from './abis'
import { getContract } from '../../utils'

// Mock the getContract method
vi.mock('../../utils', () => ({
    getContract: vi.fn().mockReturnValue({
        methods: {
            balanceOf: vi.fn().mockReturnValue({
                call: vi.fn().mockReturnValue(Promise.resolve('1000000000000000000'))
            }),
            transfer: vi.fn().mockReturnValue({
                call: vi.fn().mockReturnValue(Promise.resolve()),
                encodeABI: vi.fn().mockReturnValue({})
            }),
        }
    })
}))

// Mock the invokeTx method
const mockInvokeTx = vi.fn()

beforeEach(() => {
    vi.clearAllMocks()
    window.alert = vi.fn()
})

test('renders ERC20 component', async () => {
    const { getByText } = render(<ERC20 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    const titleElement = getByText('ERC20 Transfers')
    expect(titleElement).toBeTruthy()
})

test('sets the contract when a valid address is provided', async () => {
    const { getByLabelText, getByText } = render(<ERC20 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the token contract:/i), { target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' } })
        fireEvent.click(getByText('set contract'))
    })
    expect(getContract).toHaveBeenCalledWith(expect.anything(), '0xf7503bea549e73c0f260e42c088568fd865a358a')
    expect(getByText('0xf7503bea549e73c0f260e42c088568fd865a358a')).toBeTruthy()
    expect(getByLabelText(/amount:/i)).toBeTruthy()
    expect(getByText('transfer tokens')).toBeTruthy()
})

test('transfers token and display success message + reset form c2a', async () => {
    const { getByLabelText, getByText } = render(<ERC20 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the token contract:/i), { target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' } })
        fireEvent.click(getByText('set contract'))
    })
    const button = getByText('transfer tokens') as HTMLButtonElement
    await act(async () => {
        fireEvent.change(getByLabelText(/amount:/i), { target: { value: '1' } })
        fireEvent.click(button)
    })
    
    const methodCall = getContract(abi, '0xf7503bea549e73c0f260e42c088568fd865a358a').methods.transfer('0x123', '1')
    expect(mockInvokeTx).toHaveBeenCalledWith('0xf7503bea549e73c0f260e42c088568fd865a358a', methodCall, '0x0')
    expect(getByText(/Transfer method invoked/i)).toBeTruthy()
    expect(getByText(/Reset form/i)).toBeTruthy()
})

test('transfers token using safeTransferFrom if available and display success message + reset form c2a', async () => {
    const { getByLabelText, getByText } = render(<ERC20 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    const contract = getContract(abi, '0xf7503bea549e73c0f260e42c088568fd865a358a')
    contract.methods.safeTransferFrom = vi.fn().mockReturnValue({
        call: vi.fn().mockResolvedValue(Promise.resolve()), // Simulate successful transfer
        encodeABI: vi.fn().mockReturnValue({})
    })
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the token contract:/i), { target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' } })
        fireEvent.click(getByText('set contract'))
    })
    const button = getByText('transfer tokens') as HTMLButtonElement
    await act(async () => {
        fireEvent.change(getByLabelText(/amount:/i), { target: { value: '1' } })
        fireEvent.click(button)
    })
    const methodCall = contract.methods.safeTransferFrom('0x456', '0x123', '1')
    expect(mockInvokeTx).toHaveBeenCalledWith('0xf7503bea549e73c0f260e42c088568fd865a358a', methodCall, '0x0')
    expect(getByText(/Transfer method invoked/i)).toBeTruthy()
    expect(getByText(/Reset form/i)).toBeTruthy()
})

test('only enables the transfer tokens button if the user has provided a valid amount less than their balance for that token', async () => {
    const { getByLabelText, getByText } = render(<ERC20 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the token contract:/i), { target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' } })
        fireEvent.click(getByText('set contract'))
    })
    const button = getByText('transfer tokens') as HTMLButtonElement
    await act(async () => {
        fireEvent.change(getByLabelText(/amount:/i), { target: { value: '2' } }) // i.e. greater than balance (mocked to 1)
    })
    expect(button.disabled).toBeTruthy()

    await act(async () => {
        fireEvent.change(getByLabelText(/amount:/i), { target: { value: '0' } }) // zero
    })
    expect(button.disabled).toBeTruthy()

    await act(async () => {
        fireEvent.change(getByLabelText(/amount:/i), { target: { value: '0.' } }) // not zero but still 0
    })
    expect(button.disabled).toBeTruthy()

    await act(async () => {
        fireEvent.change(getByLabelText(/amount:/i), { target: { value: '0.00000' } }) // ditto
    })
    expect(button.disabled).toBeTruthy()

    await act(async () => {
        fireEvent.change(getByLabelText(/amount:/i), { target: { value: 'silly!' } })
    })
    expect(button.disabled).toBeTruthy()

    await act(async () => {
        fireEvent.change(getByLabelText(/amount:/i), { target: { value: '0.005' } })
    })
    expect(button.disabled).toBeFalsy()

    await act(async () => {
        fireEvent.change(getByLabelText(/amount:/i), { target: { value: '1' } })
    })
    expect(button.disabled).toBeFalsy()

    await act(async () => {
        fireEvent.change(getByLabelText(/amount:/i), { target: { value: '1.00001' } })
    })
    expect(button.disabled).toBeTruthy()
})

test('preloads a contract - e.g. Wrapped CryptoKitties - via a clickable link / button', async () => {
    const { getByRole, getByLabelText } = render(<ERC20 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    const c2a = getByRole('button', { name: /Wrapped CryptoKitties \(WCK\)/i })
    await act(async () => {
        fireEvent.click(c2a)
    })
    const input = getByLabelText(/Enter the address of the token contract:/i) as HTMLInputElement
    expect(input.value).toEqual(abis.wck.address)
})

test('alerts when setting the contract fails to load', async () => {
    const { getByLabelText, getByText } = render(<ERC20 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the token contract:/i), { target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' }})
        fireEvent.change(getByLabelText(/Enter the abi of the token contract:/i), { target: { value: 'invalid abi' } })
        fireEvent.click(getByText('set contract'))
    })
    expect(window.alert).toHaveBeenCalledWith('something went wrong setting the ERC-20 contract')
})

test('shows alert when transfer fails', async () => {
    const { getByLabelText, getByText } = render(<ERC20 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the token contract:/i), { target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' } })
        fireEvent.click(getByText('set contract'))
    })
    const button = getByText('transfer tokens') as HTMLButtonElement
    mockInvokeTx.mockImplementation(() => Promise.reject(new Error('Transfer failed due to invalid address or token ID')))
    await act(async () => {
        fireEvent.change(getByLabelText(/amount:/i), { target: { value: '1' } })
        fireEvent.click(button)
    })
    expect(window.alert).toHaveBeenCalledWith('Failed to transfer. Please try again')
})

test('disables input when the component is loading', async () => {
    const { getByLabelText, getByText } = render(<ERC20 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the token contract:/i), { target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' } })
        fireEvent.click(getByText('set contract'))
    })
    const button = getByText('transfer tokens') as HTMLButtonElement
    const input = getByLabelText(/amount:/i) as HTMLInputElement
    mockInvokeTx.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100))) // Simulate a brief delay
    await act(async () => {
        fireEvent.change(input, { target: { value: '1' } })
        fireEvent.click(button)
    })
    expect(input.disabled).toBeTruthy()
    expect(button.disabled).toBeTruthy()
})
