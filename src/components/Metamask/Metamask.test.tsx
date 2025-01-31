import { expect, test, beforeEach, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom' // Import BrowserRouter for routing context
import Header from './Metamask'

type SignInHandler = () => void
type SignOutHandler = () => void

let handleSignIn: SignInHandler
let handleSignOut: SignOutHandler

beforeEach(() => {
    handleSignIn = vi.fn()
    handleSignOut = vi.fn()
})

test('renders header with sign-in button when not logged in', () => {
    const { getByText } = render(
        <BrowserRouter>
            <Header loggedIn={''} handleSignIn={handleSignIn} handleSignOut={handleSignOut} BASE_URL={'/'} />
        </BrowserRouter>
    )
    expect(getByText('Sign in')).toBeTruthy()
})

test('renders header with sign-out button when logged in', () => {
    const { getByText } = render(
        <BrowserRouter>
            <Header loggedIn={'0x456'} handleSignIn={handleSignIn} handleSignOut={handleSignOut} BASE_URL={'/'} />
        </BrowserRouter>
    )
    expect(getByText('Sign out')).toBeTruthy()
})

test('calls handleSignIn when sign-in button is clicked', () => {
    const { getByText } = render(
        <BrowserRouter>
            <Header loggedIn={''} handleSignIn={handleSignIn} handleSignOut={handleSignOut} BASE_URL={'/'} />
        </BrowserRouter>
    )
    fireEvent.click(getByText('Sign in'))
    expect(handleSignIn).toHaveBeenCalledTimes(1)
})

test('calls handleSignOut when sign-out button is clicked', () => {
    const { getByText } = render(
        <BrowserRouter>
            <Header loggedIn={'0x456'} handleSignIn={handleSignIn} handleSignOut={handleSignOut} BASE_URL={'/'} />
        </BrowserRouter>
    )
    fireEvent.click(getByText('Sign out'))
    expect(handleSignOut).toHaveBeenCalledTimes(1)
})
