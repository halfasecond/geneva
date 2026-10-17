import { expect, test, beforeEach, vi } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Claim2 from './Claim2'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'
import * as useClaim2LogicModule from './useClaim2Logic'

vi.mock('./useClaim2Logic', async () => {
    const actual = await vi.importActual<typeof useClaim2LogicModule>('./useClaim2Logic')
    return {
        ...actual,
        useClaim2Logic: vi.fn(),
    }
})

vi.mock('utils/assetPath', () => ({
    getAssetPath: vi.fn((path: string) => `/assets/${path}`),
}))

vi.mock('../../../kittyFamily/svg/gilded.svg', () => ({
    default: '/gilded.svg',
}))

vi.mock('../../../kittyFamily/svg/genes/type-fancy.svg', () => ({
    default: '/fancy.svg',
}))

const mockCryptokitties = {
    methods: {
        ownerOf: vi.fn().mockReturnValue({
            call: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
        }),
    },
} as unknown as Contract<AbiFragment[]>

const mockPurrClaim2 = {
    methods: {
        claimGilded: vi.fn().mockReturnValue({
            send: vi.fn().mockResolvedValue({ transactionHash: '0xabc' }),
        }),
        claimGrandmaster: vi.fn().mockReturnValue({
            send: vi.fn().mockResolvedValue({ transactionHash: '0xdef' }),
        }),
        hasGildedClaimed: vi.fn().mockReturnValue({
            call: vi.fn().mockResolvedValue(false),
        }),
        hasGrandmasterClaimed: vi.fn().mockReturnValue({
            call: vi.fn().mockResolvedValue(false),
        }),
    },
} as unknown as Contract<AbiFragment[]>

const mockUpdateBalances = vi.fn()
const mockHandleSignIn = vi.fn()

const defaultProps = {
    walletAddress: '0x1234567890123456789012345678901234567890',
    cryptokitties: mockCryptokitties,
    purrClaim2: mockPurrClaim2,
    balance: '1000000000000000000',
    purrClaim2Balance: '5000000000000000000',
    updateBalances: mockUpdateBalances,
    handleSignIn: mockHandleSignIn,
}

const mockInitialState = {
    kittyId: '',
    loading: false,
    kittyEligible: false,
    merkleProof: [] as string[],
    claimed: false,
    kittyOwner: null as string | null,
    claiming: false,
    claimTX: undefined as { transactionHash?: string } | undefined,
    errorMessage: '',
    isGrandmaster: false,
    grandmasterClaimed: false,
    claimingGrandmaster: false,
    grandmasterTX: undefined as { transactionHash?: string } | undefined,
}

const mockActions = {
    setKittyId: vi.fn(),
    claimGilded: vi.fn(),
    claimGrandmaster: vi.fn(),
    reset: vi.fn(),
}

const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
}

beforeEach(() => {
    vi.clearAllMocks()
    const useClaim2Logic = vi.mocked(useClaim2LogicModule.useClaim2Logic)
    useClaim2Logic.mockReturnValue({
        state: mockInitialState,
        actions: mockActions,
    })
})

test('renders gilded / grandmaster claim form when wallet is connected', () => {
    const { getByText, getByPlaceholderText } = renderWithRouter(<Claim2 {...defaultProps} />)
    expect(getByText('Gilded / Grandmaster Claim')).toBeTruthy()
    expect(getByText('Claim Criteria')).toBeTruthy()
    expect(getByPlaceholderText('Enter Kitty ID')).toBeTruthy()
    expect(getByText('$PURR 100')).toBeTruthy()
    expect(getByText('$PURR 1000')).toBeTruthy()
    expect(getByText('Gilded')).toBeTruthy()
    expect(getByText('Grandmasters')).toBeTruthy()
    expect(getByText(/Fancy #1 Breeders/)).toBeTruthy()
})

test('renders sign in prompt when wallet is not connected', () => {
    const { getByText } = renderWithRouter(<Claim2 {...defaultProps} walletAddress={undefined} />)
    expect(getByText('Sign in with Metamask')).toBeTruthy()
})

test('disables claims when contract is missing', () => {
    const { getAllByRole } = renderWithRouter(<Claim2 {...defaultProps} purrClaim2={undefined} />)
    const buttons = getAllByRole('button')
    const gildedButton = buttons.find((btn) => btn.textContent === 'Claim $PURR')
    expect(gildedButton).toBeTruthy()
    expect((gildedButton as HTMLButtonElement).disabled).toBe(true)
})

test('disables grandmaster claim when contract is missing', () => {
    const useClaim2Logic = vi.mocked(useClaim2LogicModule.useClaim2Logic)
    useClaim2Logic.mockReturnValue({
        state: { ...mockInitialState, isGrandmaster: true, grandmasterClaimed: false },
        actions: mockActions,
    })
    const { getByText } = renderWithRouter(<Claim2 {...defaultProps} purrClaim2={undefined} />)
    expect((getByText('Claim 1000 $PURR') as HTMLButtonElement).disabled).toBe(true)
})

test('shows grandmaster claim when wallet is a hatcher', () => {
    const useClaim2Logic = vi.mocked(useClaim2LogicModule.useClaim2Logic)
    useClaim2Logic.mockReturnValue({
        state: { ...mockInitialState, isGrandmaster: true, grandmasterClaimed: false },
        actions: mockActions,
    })
    const { getByText } = renderWithRouter(<Claim2 {...defaultProps} />)
    expect(getByText(/hatched a Fancy #1/i)).toBeTruthy()
    fireEvent.click(getByText('Claim 1000 $PURR'))
    expect(mockActions.claimGrandmaster).toHaveBeenCalled()
})

test('handles kitty ID input', async () => {
    const { getByPlaceholderText } = renderWithRouter(<Claim2 {...defaultProps} />)
    const kittyInput = getByPlaceholderText('Enter Kitty ID')
    await act(async () => {
        fireEvent.change(kittyInput, { target: { value: 'abc' } })
    })
    expect(mockActions.setKittyId).not.toHaveBeenCalledWith('abc')
    await act(async () => {
        fireEvent.change(kittyInput, { target: { value: '308471' } })
    })
    expect(mockActions.setKittyId).toHaveBeenCalledWith('308471')
})
