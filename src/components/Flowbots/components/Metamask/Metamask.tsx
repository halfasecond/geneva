import React from 'react'
import { AuthProps } from 'types/auth'
import * as Styled from './Metamask.style'

const Metamask: React.FC<AuthProps> = ({ loggedIn, handleSignIn, handleSignOut }) => {
    return (
        <Styled.Div>
            {loggedIn ? (
                <Styled.Button onClick={handleSignOut}>
                    <img src={'/metamask.svg'} alt={'metamask'} />
                    {'Sign out'}
                </Styled.Button>
            ) : (
                <Styled.Button onClick={handleSignIn}>
                    <img src={'/metamask.svg'} alt={'metamask'} />
                    {'Sign in'}
                </Styled.Button>
            )}
        </Styled.Div>

    )
}

export default Metamask