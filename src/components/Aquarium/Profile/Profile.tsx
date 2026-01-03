import { useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../Card'
import Metamask from '../../Metamask'
import * as Styled from './Profile.style'

const Profile: React.FC<{
    onClose: () => void
    token: string
    handleSignIn: () => void
    handleSignOut: () => void
    shareLink: undefined | string
    loggedIn: string
    BASE_URL: string
}> = ({ onClose, token, handleSignIn, handleSignOut, shareLink, loggedIn, BASE_URL }) => {
    const [editName, setEditName] = useState<string | null>(null)

    const signIn = async () => {
        await handleSignIn()
        onClose()
    }

    const signOut = async () => {
        await handleSignOut()
        onClose()
    }

    return (
        <Card {...{ onClose }}>
            <h2>{loggedIn ? 'your profile' : 'sign in'}</h2>
            
            {loggedIn ? (
                <Styled.Form>
                    <Styled.Div>
                        <div>wallet:</div>
                        <div>{loggedIn}</div>
                    </Styled.Div>
                    {shareLink && (
                        <Styled.Div>
                            <div>share:</div>
                            <div><Link to={`/tank/${shareLink}`}>{`tank.life/tank/${shareLink}`}</Link></div>
                        </Styled.Div>
                    )}
                    {/* <Styled.Div>
                        <div>name:</div>
                        <div>{loggedIn}<span onClick={() => { }}>edit</span></div>
                    </Styled.Div> */}
                </Styled.Form>
            ) : (
                <p>More sign in options are coming soon.</p>
            )}
            <Metamask handleSignIn={signIn} handleSignOut={signOut} {...{ token, loggedIn, BASE_URL }} />
        </Card>
    )

}

export default Profile