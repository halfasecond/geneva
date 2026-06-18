import React, { useCallback } from 'react'
import type { AuthProps } from '../../types/auth'
import { COLORS } from '../config'

type VechMetamaskProps = Pick<AuthProps, 'loggedIn' | 'handleSignIn' | 'handleSignOut' | 'BASE_URL'>

/** VECH-themed MetaMask sign-in/out — project styling, not the shared white button. */
const VechMetamask: React.FC<VechMetamaskProps> = ({
    loggedIn,
    handleSignIn,
    handleSignOut,
    BASE_URL,
}) => {
    const onClick = useCallback(async () => {
        if (!(window as Window & { ethereum?: unknown }).ethereum) {
            alert('MetaMask is not available. Install the MetaMask browser extension to sign in.')
            return
        }

        if (loggedIn) {
            await handleSignOut()
        } else {
            await handleSignIn()
        }
    }, [loggedIn, handleSignIn, handleSignOut])

    return (
        <button type="button" onClick={onClick} style={buttonStyle}>
            <img
                src={`${BASE_URL}metamask.svg`}
                alt=""
                aria-hidden
                style={iconStyle}
            />
            {loggedIn ? 'Sign out' : 'Sign in'}
        </button>
    )
}

const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 18px',
    border: '1px solid rgba(102, 170, 255, 0.35)',
    borderRadius: 2,
    background: 'rgba(0, 6, 14, 0.9)',
    color: COLORS.vechRingCss,
    fontFamily: 'ui-monospace, monospace',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    boxShadow: 'inset 0 0 12px rgba(102, 170, 255, 0.08)',
}

const iconStyle: React.CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: 4,
    flexShrink: 0,
}

export default VechMetamask