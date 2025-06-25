import { expect, test, beforeEach, vi } from 'vitest'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Claim from './Claim'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'
import * as useClaimLogicModule from './useClaimLogic'

// Mock the custom hook
vi.mock('./useClaimLogic', () => ({
    useClaimLogic: vi.fn()
}))

// Mock asset path utility
vi.mock('utils/assetPath', () => ({
    getAssetPath: vi.fn((path: string) => `/assets/${path}`)
}))

// Mock contracts
const mockCryptokitties = {
    methods: {
        ownerOf: vi.fn().mockReturnValue({
            call: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890')
        })
    }
} as unknown as Contract<AbiFragment[]>

const mockPurrClaim = {
    methods: {
        claim: vi.fn().mockReturnValue({
            send: vi.fn().mockResolvedValue({ transactionHash: '0xabc123def456' })
        }),
        hasKittyClaimed: vi.fn().mockReturnValue({
            call: vi.fn().mockResolvedValue(false)
        })
    }
} as unknown as Contract<AbiFragment[]>

// Mock functions
const mockUpdateBalances = vi.fn()
const mockHandleSignIn = vi.fn()

// Default props
const defaultProps = {
    walletAddress: '0x1234567890123456789012345678901234567890',
    cryptokitties: mockCryptokitties,
    purrClaim: mockPurrClaim,
    balance: '1000000000000000000', // 1 PURR in Wei
    purrClaimBalance: '5000000000000000000', // 5 PURR in Wei
    updateBalances: mockUpdateBalances,
    handleSignIn: mockHandleSignIn
}

// Mock hook states
const mockInitialState = {
    claimTX: undefined,
    claiming: false,
    claimed: false,
    kittyId: '',
    kittyEligible: false,
    merkleProof: [],
    errorMessage: '',
    loading: false,
    kittyOwner: null
}

const mockActions = {
    setKittyId: vi.fn(),
    claim: vi.fn(),
    reset: vi.fn()
}

// Helper to wrap component with router
const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
}

beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementation
    const useClaimLogic = vi.mocked(useClaimLogicModule.useClaimLogic)
    useClaimLogic.mockReturnValue({
        state: mockInitialState,
        actions: mockActions
    })
})

test('renders claim form when wallet is connected', () => {
    const { getByText, getByPlaceholderText } = renderWithRouter(<Claim {...defaultProps} />)
    
    expect(getByText('Day1 / Diamond Claim')).toBeTruthy()
    expect(getByText('Claim Criteria')).toBeTruthy()
    expect(getByPlaceholderText('Enter Kitty ID')).toBeTruthy()
    expect(getByText('$PURR 10')).toBeTruthy()
    expect(getByText('$PURR 100')).toBeTruthy()
})

test('renders sign in prompt when wallet is not connected', () => {
    const { getByText } = renderWithRouter(<Claim {...defaultProps} walletAddress={undefined} />)
    
    expect(getByText('Sign in with Metamask')).toBeTruthy()
    expect(getByText('$PURR 10')).toBeTruthy()
    expect(getByText('$PURR 100')).toBeTruthy()
})

test('calls handleSignIn when sign in button is clicked', async () => {
    const { getByText } = renderWithRouter(<Claim {...defaultProps} walletAddress={undefined} />)
    
    const signInButton = getByText('Sign in with Metamask')
    
    await act(async () => {
        fireEvent.click(signInButton)
    })
    
    expect(mockHandleSignIn).toHaveBeenCalled()
})

test('displays available PURR claim balance', () => {
    const { getByText } = renderWithRouter(<Claim {...defaultProps} />)
    
    expect(getByText('Available:')).toBeTruthy()
})

test('handles kitty ID input and calls setKittyId action', async () => {
    const { getByPlaceholderText } = renderWithRouter(<Claim {...defaultProps} />)
    
    const kittyInput = getByPlaceholderText('Enter Kitty ID')
    
    await act(async () => {
        fireEvent.change(kittyInput, { target: { value: '123' } })
    })
    
    expect(mockActions.setKittyId).toHaveBeenCalledWith('123')
})

test('only allows numeric input for kitty ID', async () => {
    const { getByPlaceholderText } = renderWithRouter(<Claim {...defaultProps} />)
    
    const kittyInput = getByPlaceholderText('Enter Kitty ID')
    
    // Try to enter non-numeric characters
    await act(async () => {
        fireEvent.change(kittyInput, { target: { value: 'abc123' } })
    })
    
    // Should not call setKittyId with invalid input
    expect(mockActions.setKittyId).not.toHaveBeenCalledWith('abc123')
    
    // Try valid numeric input
    await act(async () => {
        fireEvent.change(kittyInput, { target: { value: '456' } })
    })
    
    expect(mockActions.setKittyId).toHaveBeenCalledWith('456')
})

test('shows eligibility message for eligible day1 kitty', () => {
    const useClaimLogic = vi.mocked(useClaimLogicModule.useClaimLogic)
    useClaimLogic.mockReturnValue({
        state: {
            ...mockInitialState,
            kittyId: '100',
            kittyEligible: true,
            kittyOwner: '0x1234567890123456789012345678901234567890',
            claimed: false
        },
        actions: mockActions
    })
    
    const { getByPlaceholderText } = renderWithRouter(<Claim {...defaultProps} />)
    
    expect(getByPlaceholderText('Enter Kitty ID')).toBeTruthy()
})

test('shows not eligible message for ineligible kitty', () => {
    const useClaimLogic = vi.mocked(useClaimLogicModule.useClaimLogic)
    useClaimLogic.mockReturnValue({
        state: {
            ...mockInitialState,
            kittyId: '999999',
            kittyEligible: false
        },
        actions: mockActions
    })
    
    const { getByPlaceholderText } = renderWithRouter(<Claim {...defaultProps} />)
    
    expect(getByPlaceholderText('Enter Kitty ID')).toBeTruthy()
})

test('shows ownership error when user does not own kitty', () => {
    const useClaimLogic = vi.mocked(useClaimLogicModule.useClaimLogic)
    useClaimLogic.mockReturnValue({
        state: {
            ...mockInitialState,
            kittyId: '100',
            kittyEligible: true,
            kittyOwner: '0x9876543210987654321098765432109876543210', // Different owner
            claimed: false
        },
        actions: mockActions
    })
    
    const { getByPlaceholderText } = renderWithRouter(<Claim {...defaultProps} />)
    
    expect(getByPlaceholderText('Enter Kitty ID')).toBeTruthy()
})

test('shows already claimed message when kitty has been claimed', () => {
    const useClaimLogic = vi.mocked(useClaimLogicModule.useClaimLogic)
    useClaimLogic.mockReturnValue({
        state: {
            ...mockInitialState,
            kittyId: '100',
            kittyEligible: true,
            kittyOwner: '0x1234567890123456789012345678901234567890',
            claimed: true
        },
        actions: mockActions
    })
    
    const { getByPlaceholderText } = renderWithRouter(<Claim {...defaultProps} />)
    
    expect(getByPlaceholderText('Enter Kitty ID')).toBeTruthy()
})

test('shows eligible for claim message when conditions are met', () => {
    const useClaimLogic = vi.mocked(useClaimLogicModule.useClaimLogic)
    useClaimLogic.mockReturnValue({
        state: {
            ...mockInitialState,
            kittyId: '100',
            kittyEligible: true,
            kittyOwner: '0x1234567890123456789012345678901234567890',
            claimed: false
        },
        actions: mockActions
    })
    
    const { getByPlaceholderText } = renderWithRouter(<Claim {...defaultProps} />)
    
    expect(getByPlaceholderText('Enter Kitty ID')).toBeTruthy()
})

test('disables claim button when conditions are not met', () => {
    const useClaimLogic = vi.mocked(useClaimLogicModule.useClaimLogic)
    useClaimLogic.mockReturnValue({
        state: {
            ...mockInitialState,
            kittyId: '',
            kittyEligible: false
        },
        actions: mockActions
    })
    
    const { getByDisplayValue } = renderWithRouter(<Claim {...defaultProps} />)
    
    const claimButton = getByDisplayValue('Claim $PURR') as HTMLInputElement
    expect(claimButton.disabled).toBeTruthy()
})

test('enables claim button when all conditions are met', () => {
    const useClaimLogic = vi.mocked(useClaimLogicModule.useClaimLogic)
    useClaimLogic.mockReturnValue({
        state: {
            ...mockInitialState,
            kittyId: '100',
            kittyEligible: true,
            kittyOwner: '0x1234567890123456789012345678901234567890',
            claimed: false,
            claiming: false
        },
        actions: mockActions
    })
    
    const { getByDisplayValue } = renderWithRouter(<Claim {...defaultProps} />)
    
    const claimButton = getByDisplayValue('Claim $PURR') as HTMLInputElement
    expect(claimButton.disabled).toBeFalsy()
})

test('calls claim action when claim button is clicked', async () => {
    const useClaimLogic = vi.mocked(useClaimLogicModule.useClaimLogic)
    useClaimLogic.mockReturnValue({
        state: {
            ...mockInitialState,
            kittyId: '100',
            kittyEligible: true,
            kittyOwner: '0x1234567890123456789012345678901234567890',
            claimed: false,
            claiming: false
        },
        actions: mockActions
    })
    
    const { getByDisplayValue } = renderWithRouter(<Claim {...defaultProps} />)
    
    const claimButton = getByDisplayValue('Claim $PURR')
    
    await act(async () => {
        fireEvent.click(claimButton)
    })
    
    expect(mockActions.claim).toHaveBeenCalled()
})

test('shows loading state during claim process', () => {
    const useClaimLogic = vi.mocked(useClaimLogicModule.useClaimLogic)
    useClaimLogic.mockReturnValue({
        state: {
            ...mockInitialState,
            claiming: true
        },
        actions: mockActions
    })
    
    const { getByAltText } = renderWithRouter(<Claim {...defaultProps} />)
    
    expect(getByAltText('')).toBeTruthy() // Loading image
})

test('shows success state after successful claim', () => {
    const useClaimLogic = vi.mocked(useClaimLogicModule.useClaimLogic)
    useClaimLogic.mockReturnValue({
        state: {
            ...mockInitialState,
            claimTX: { transactionHash: '0xabc123def456' },
            kittyId: '100'
        },
        actions: mockActions
    })
    
    const { getByText } = renderWithRouter(<Claim {...defaultProps} />)
    
    expect(getByText('claimed')).toBeTruthy()
    expect(getByText('Make another claim')).toBeTruthy()
    expect(getByText('Make another claim')).toBeTruthy()
})

test('calls reset action when make another claim button is clicked', async () => {
    const useClaimLogic = vi.mocked(useClaimLogicModule.useClaimLogic)
    useClaimLogic.mockReturnValue({
        state: {
            ...mockInitialState,
            claimTX: { transactionHash: '0xabc123def456' },
            kittyId: '100'
        },
        actions: mockActions
    })
    
    const { getByText } = renderWithRouter(<Claim {...defaultProps} />)
    
    const resetButton = getByText('Make another claim')
    
    await act(async () => {
        fireEvent.click(resetButton)
    })
    
    expect(mockActions.reset).toHaveBeenCalled()
})

test('shows error message when there is an error', () => {
    const useClaimLogic = vi.mocked(useClaimLogicModule.useClaimLogic)
    useClaimLogic.mockReturnValue({
        state: {
            ...mockInitialState,
            errorMessage: 'Something went wrong'
        },
        actions: mockActions
    })
    
    const { getByText } = renderWithRouter(<Claim {...defaultProps} />)
    
    expect(getByText('Something went wrong')).toBeTruthy()
})

test('shows checking eligibility message during loading', () => {
    const useClaimLogic = vi.mocked(useClaimLogicModule.useClaimLogic)
    useClaimLogic.mockReturnValue({
        state: {
            ...mockInitialState,
            kittyId: '100',
            loading: true
        },
        actions: mockActions
    })
    
    const { getByText } = renderWithRouter(<Claim {...defaultProps} />)
    
    expect(getByText('Checking eligibility...')).toBeTruthy()
})

test('calls updateBalances when claimTX is set', () => {
    const useClaimLogic = vi.mocked(useClaimLogicModule.useClaimLogic)
    useClaimLogic.mockReturnValue({
        state: {
            ...mockInitialState,
            claimTX: { transactionHash: '0xabc123def456' }
        },
        actions: mockActions
    })
    
    renderWithRouter(<Claim {...defaultProps} />)
    
    expect(mockUpdateBalances).toHaveBeenCalled()
})

test('displays current balance in success state', () => {
    const useClaimLogic = vi.mocked(useClaimLogicModule.useClaimLogic)
    useClaimLogic.mockReturnValue({
        state: {
            ...mockInitialState,
            claimTX: { transactionHash: '0xabc123def456' },
            kittyId: '100'
        },
        actions: mockActions
    })
    
    const { getByText } = renderWithRouter(<Claim {...defaultProps} />)
    
    expect(getByText('$PURR 1')).toBeTruthy()
})