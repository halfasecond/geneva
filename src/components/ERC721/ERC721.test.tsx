import { expect, test, beforeEach, vi } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import ERC721 from './ERC721'
import { abi } from '@openzeppelin/contracts/build/contracts/ERC721.json'
import { getContract } from '../../utils'

// Mock the getContract method
vi.mock('../../utils', () => ({
    getContract: vi.fn().mockReturnValue({
        methods: {
            balanceOf: vi.fn().mockReturnValue({
                call: vi.fn().mockReturnValue(Promise.resolve(1))
            }),
            ownerOf: vi.fn().mockImplementation((tokenId) => {
                return tokenId === '999' ? ({ // mock an error for this tokenId
                    call: vi.fn().mockRejectedValue(new Error('Token ID not found'))
                }) : ({ // otherwise return a valid address
                    call: vi.fn().mockReturnValue(Promise.resolve('0x456'))
                })
            }),
            safeTransferFrom: vi.fn().mockReturnValue({
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

test('renders ERC721 component', async () => {
    const { getByText } = render(<ERC721 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    const titleElement = getByText('ERC-721 Transfers')
    expect(titleElement).toBeTruthy()
})

test('sets the contract when a valid address is provided', async () => {
    const { getByLabelText, getByText } = render(<ERC721 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the NFT contract:/i), { target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' } })
        fireEvent.click(getByText('set contract'))
    })
    expect(getContract).toHaveBeenCalledWith(expect.anything(), '0xf7503bea549e73c0f260e42c088568fd865a358a')
    expect(getByText('0xf7503bea549e73c0f260e42c088568fd865a358a')).toBeTruthy()
    expect(getByLabelText('token id:')).toBeTruthy()
})

test('handles ownership check for a valid token ID', async () => {
    const { getByLabelText, getByText } = render(<ERC721 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />);
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the NFT contract:/i), {  target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' } })
        fireEvent.click(getByText('set contract'))
    })
    await act(async () => {
        fireEvent.change(getByLabelText('token id:'), { target: { value: '1' } })
        fireEvent.click(getByText('check ownership'))
    })
    expect(getByText(/transfer token #1/i)).toBeTruthy()
    expect(getContract(abi, '0xf7503bea549e73c0f260e42c088568fd865a358a').methods.ownerOf).toHaveBeenCalledWith('1')
})

test('transfers NFT and display success message + reset form c2a', async () => {
    const { getByLabelText, getByText } = render(<ERC721 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the NFT contract:/i), { target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' } })
        fireEvent.click(getByText('set contract'))
    })
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: '1' } })
        fireEvent.click(getByText('check ownership'))
    })
    expect(getByText(/transfer token #1/i)).toBeTruthy()
    await act(async () => {
        fireEvent.click(getByText(/transfer token #1/i))
    })
    const methodCall = getContract(abi, '0xf7503bea549e73c0f260e42c088568fd865a358a').methods.safeTransferFrom('0x456', '0x123', '1')
    expect(mockInvokeTx).toHaveBeenCalledWith('0xf7503bea549e73c0f260e42c088568fd865a358a', methodCall, '0x0')
    expect(getByText(/Transfer method invoked for Token ID: #1/i)).toBeTruthy()
    expect(getByText(/Reset form/i)).toBeTruthy()
})

test('updates tokenId in formDetails on change', async () => {
    const { getByLabelText, getByText } = render(<ERC721 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the NFT contract:/i), { target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' } })
        fireEvent.click(getByText('set contract'))
    })
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: '2' } })
    })
    const tokenIdInput = getByLabelText(/token id:/i) as HTMLInputElement
    expect(tokenIdInput.value).toBe('2')
})

test('resets transferrable state when tokenId changes', async () => {
    const { getByLabelText, getByText } = render(<ERC721 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the NFT contract:/i), { target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' } })
        fireEvent.click(getByText('set contract'))
    })
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: '1' } })
        fireEvent.click(getByText('check ownership'))
    })
    expect(getByText(/transfer token #1/i)).toBeTruthy()
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: '2' } })
    })
    expect(getByText('check ownership')).toBeTruthy()
})

test('alerts when setting the contract fails to load', async () => {
    const { getByLabelText, getByText } = render(<ERC721 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the NFT contract:/i), { target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' }})
        fireEvent.change(getByLabelText(/Enter the abi of the NFT contract:/i), { target: { value: 'invalid abi' } })
        fireEvent.click(getByText('set contract'))
    })
    expect(window.alert).toHaveBeenCalledWith('something went wrong setting the ERC-721 contract')
})

test('shows alert for invalid token ID', async () => {
    const { getByLabelText, getByText } = render(<ERC721 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the NFT contract:/i), { target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' }})
        fireEvent.click(getByText('set contract'))
    })
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: 'abc' } }) // Enter an invalid token ID
        fireEvent.click(getByText('check ownership'))
    })
    expect(window.alert).toHaveBeenCalledWith('Invalid token id. Please try again.')
})

test('shows alert when NFT is not owned by the Dapper wallet', async () => {
    const { getByLabelText, getByText } = render(<ERC721 walletAddress="0x123" dapperWalletAddress="0x789" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the NFT contract:/i), { target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' }})
        fireEvent.click(getByText('set contract'))
    })
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: '1' } })
        fireEvent.click(getByText('check ownership'))
    })
    expect(window.alert).toHaveBeenCalledWith('NFT not owned by this Dapper Wallet')
})

test('shows alert if there is an error during ownership check', async () => {
    const { getByLabelText, getByText } = render(<ERC721 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the NFT contract:/i), { target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' }})
        fireEvent.click(getByText('set contract'))
    })
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: '999' } }) // pass in this tokenId to mock an error
        fireEvent.click(getByText('check ownership'))
    })
    expect(window.alert).toHaveBeenCalledWith('An error occurred while checking ownership.')
})

test('shows alert when transfer fails', async () => {
    const { getByLabelText, getByText } = render(<ERC721 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the NFT contract:/i), { target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' } })
        fireEvent.click(getByText('set contract'))
    })
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: '1' } })
        fireEvent.click(getByText('check ownership'))
    })
    mockInvokeTx.mockImplementation(() => Promise.reject(new Error('Transfer failed due to invalid address or token ID')))
    await act(async () => {
        fireEvent.click(getByText('transfer token #1'))
    })
    expect(window.alert).toHaveBeenCalledWith('Failed to transfer. Please try again')
})

test('disables input when loading is true', async () => {
    const { getByLabelText, getByText } = render(<ERC721 walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/Enter the address of the NFT contract:/i), { target: { value: '0xf7503bea549e73c0f260e42c088568fd865a358a' } })
        fireEvent.click(getByText('set contract'))
    })
    const input = getByLabelText(/token id:/i) as HTMLInputElement
    expect(input.disabled).toBeFalsy()
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: '1' } })
        fireEvent.click(getByText('check ownership'))
    })
    mockInvokeTx.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100))) // Simulate a brief delay
    const button = getByText('transfer token #1') as HTMLButtonElement
    await act(async () => {
        fireEvent.click(button)
    })
    expect(input.disabled).toBeTruthy()
    expect(button.disabled).toBeTruthy()
})
