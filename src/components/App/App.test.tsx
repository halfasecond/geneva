import { render, fireEvent, waitFor, act } from '@testing-library/react'
import App from './App'
import { expect, vi, test, beforeEach } from 'vitest'

// Mock window.ethereum
const mockEnable = vi.fn()
const mockEthereum = {
    enable: mockEnable,
    isDapper: true, // Set it to true or false based on the test case
    on: vi.fn(),  // Method to listen to events (mocking basic behavior)
    off: vi.fn(), // Method to remove event listeners (mocking basic behavior)
    request: vi.fn().mockResolvedValue({}), // Mock the `request` method (it can return any value based on the method)
    isMetaMask: true, // Mock the `isMetaMask` flag
}

beforeEach(() => {
    vi.clearAllMocks() // Clear any previous mocks to ensure clean tests
    window.ethereum = mockEthereum // Mock ethereum object
    window.alert = vi.fn() // Mock alert
})

test('renders App and handles sign in with ethereum', async () => {
    // Mock the response from ethereum.enable to simulate a successful sign-in
    mockEnable.mockResolvedValue(['0x1234567890abcdef1234567890abcdef12345678']) // Simulate a wallet address
    const { getByText } = render(<App />)
    await waitFor(async () => {
        const signInButton = getByText('Sign in') // Ensure this matches the button text in your app
        await act(async () => {
            fireEvent.click(signInButton)
        })
        expect(getByText('Sign out')).toBeTruthy()
    })
})

test('shows alert when Dapper wallet is not found', async () => {
    // Simulate a missing ethereum object (e.g., user doesn't have Dapper or MetaMask)
    window.ethereum = undefined
    const { getByText } = render(<App />)
    await waitFor(async () => {
        const signInButton = getByText('Sign in')
        await act(async () => {
            fireEvent.click(signInButton)
        })
        expect(window.alert).toHaveBeenCalledWith('Dapper wallet not found.')
    })
})

test('handles sign out correctly', async () => {
    // Mock sign-in
    mockEnable.mockResolvedValue(['0x1234567890abcdef1234567890abcdef12345678'])
    const { getByText } = render(<App />)
    await waitFor(async () => {
        const signInButton = getByText('Sign in')
        await act(async () => {
            fireEvent.click(signInButton)
        })
        const signOutButton = getByText('Sign out')
        await act(async () => {
            fireEvent.click(signOutButton)
        })
        expect(getByText('Sign in')).toBeTruthy()
    })
})

test('shows alert when there is an error during sign-in', async () => {
    mockEnable.mockRejectedValue(new Error('Error during sign in'))
    const { getByText } = render(<App />)
    await waitFor(async () => {
        const signInButton = getByText('Sign in')
        await act(async () => {
            fireEvent.click(signInButton)
        })
        expect(window.alert).toHaveBeenCalledWith('Error during sign in')
    })
})
