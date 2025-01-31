import React from 'react'
import { AuthProps } from 'types/auth'
import * as Styled from './Metamask.style'

const Header: React.FC<AuthProps> = ({ loggedIn, handleSignIn, handleSignOut, BASE_URL }) => {
    return (
        <>
            {loggedIn ? (
                <Styled.Button onClick={handleSignOut}>
                    <img src={BASE_URL + 'metamask.svg'} alt={'metamask'} />
                    {'Sign out'}
                </Styled.Button>
            ) : (
                <Styled.Button onClick={handleSignIn}>
                    <img src={BASE_URL + 'metamask.svg'} alt={'metamask'} />
                    {'Sign in'}
                </Styled.Button>
            )}
        </>

    )
}

export default Header