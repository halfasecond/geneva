import { expect, test, beforeEach, vi } from 'vitest'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import AppView from './AppView'
import { getCosignerForAuthorized } from '../../utils'

// Mock the getContract function and other necessary utilities
vi.mock('../../utils', () => {
    const mockContract = {
        methods: {
            authVersion: vi.fn().mockReturnValue({
                call: vi.fn().mockResolvedValue('12345678900000000000000000000000000000000000000000000000000000000'), // Mock a version
            }),
            setAuthorized: vi.fn().mockReturnValue({
                send: vi.fn().mockResolvedValue({}), // Mock successful send
            }),
            authorizations: vi.fn().mockReturnValue({
                call: vi.fn().mockResolvedValue('12345678900000000000000000000000000000000000000000000000000000000'), // Mock raw address
            }),
            invoke0: vi.fn().mockReturnValue({
                estimateGas: vi.fn().mockResolvedValue(100000), // Mocking gas estimate
                send: vi.fn().mockResolvedValue({}), // Mock the send method
            }),
        },
    }

    return {
        getContract: vi.fn().mockReturnValue(mockContract), // Return the mock contract
        getCosignerForAuthorized: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'), // Mock cosigner address
        prepareInvokeData: vi.fn().mockResolvedValue({ data: 'mockedData' }),
    }
})

const mockHandleSignIn = vi.fn()
const mockHandleSignOut = vi.fn()
const mockWalletAddress = '0x1234567890123456789012345678901234567890'

beforeEach(() => {
    vi.clearAllMocks()
    window.alert = vi.fn()
})

test('renders AppView without wallet address', () => {
    const { getByText } = render(
        <AppView 
            handleSignIn={mockHandleSignIn} 
            handleSignOut={mockHandleSignOut} 
            loggedIn={undefined} 
            isDapper={false}
            BASE_URL={'/'}
        />
    )
    expect(getByText('How to use this app')).toBeTruthy()
})

test('renders Authorization component when Dapper wallet is used', async () => {
    const { getByText, getByRole } = render(
        <AppView 
            handleSignIn={mockHandleSignIn} 
            handleSignOut={mockHandleSignOut} 
            loggedIn={mockWalletAddress} 
            isDapper={true}
            BASE_URL={'/'}
        />
    )
    await waitFor(async () => {
        const input = getByRole('textbox', { name: /Add new authorization:/i })
        const button = getByRole('button', { name: /Set new authorized address/i })
        await act(async () => {
            fireEvent.click(button)
            fireEvent.change(input, { target: { value: '0x4567890123456789012345678901234567890123' } });
        })
        expect(getByText('Success! New authorized / cosigner pair for this address is:')).toBeTruthy()
        expect(getByText('0x4567890123456789012345678901234567890123')).toBeTruthy()
    })
})

test('calls handleSetDapperWallet when the wallet address is set', async () => {
    const { getByRole, getByText } = render(
        <AppView 
            handleSignIn={mockHandleSignIn} 
            handleSignOut={mockHandleSignOut} 
            loggedIn={mockWalletAddress} 
            isDapper={true}
            BASE_URL={'/'}
        />
    )
    await waitFor(async () => {
        const input = getByRole('textbox', { name: /Add new authorization:/i })
        const button = getByText('Set new authorized address')
        await act(async () => {
            fireEvent.change(input, { target: { value: '0x4567890123456789012345678901234567890123' } })
            fireEvent.click(button)
        })
        expect(getByText('Success! New authorized / cosigner pair for this address is:')).toBeTruthy()
    })
})

test('renders child components for Metamask users', async () => {
    const { getByText } = render(
        <AppView 
            handleSignIn={mockHandleSignIn} 
            handleSignOut={mockHandleSignOut} 
            loggedIn={mockWalletAddress} 
            isDapper={false}
            BASE_URL={'/'}
        />
    )
    await waitFor(async () => {
        expect(getByText('Set Dapper Wallet')).toBeTruthy()
    })
})

test('handles input change', async () => {
    const { getByRole } = render(
        <AppView 
            handleSignIn={mockHandleSignIn} 
            handleSignOut={mockHandleSignOut} 
            loggedIn={mockWalletAddress} 
            isDapper={false}
            BASE_URL={'/'}
        />
    )
    const input = getByRole('textbox') as HTMLInputElement
    await act(async () => {
        fireEvent.change(input, { target: { value: '0x4567890123456789012345678901234567890123' } })
    })
    expect(input.value).toBe('0x4567890123456789012345678901234567890123')
})

test('displays Dapper wallet once set by the user', async () => {
    const { getByText, getByRole } = render(
        <AppView 
            handleSignIn={mockHandleSignIn} 
            handleSignOut={mockHandleSignOut} 
            loggedIn={mockWalletAddress} 
            isDapper={false}
            BASE_URL={'/'}
        />
    )
    
    await waitFor(async () => {
        const input = getByRole('textbox') as HTMLInputElement
        const button = getByText('Set Dapper Wallet')
        await act(async () => {
            fireEvent.change(input, { target: { value: '0x4567890123456789012345678901234567890123' } })
            fireEvent.click(button)
        })
        expect(getByText('The wallet you are signed in with is authorized for the Dapper Legacy wallet you provided.')).toBeTruthy()
    })
})

test('shows alert if there was a revert / error while setting Dapper wallet', async () => {
    const { getByText, getByRole } = render(
        <AppView 
            handleSignIn={mockHandleSignIn} 
            handleSignOut={mockHandleSignOut} 
            loggedIn={mockWalletAddress} 
            isDapper={false}
            BASE_URL={'/'}
        />
    )
    
    await waitFor(async () => {
        const input = getByRole('textbox') as HTMLInputElement
        const button = getByText('Set Dapper Wallet')
        await act(async () => {
            vi.mocked(getCosignerForAuthorized).mockRejectedValueOnce(new Error('Transfer revert error'))
            fireEvent.change(input, { target: { value: '0x4567890123456789012345678901234567890123' } })
            fireEvent.click(button)
            expect(window.alert).toHaveBeenCalledWith('Unable to set Dapper wallet address')
        })
    })
})
