import Aquarium from '../Aquarium'
import Share from '../Aquarium/Share'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { AuthProps } from '../../types/auth'

const AppView: React.FC<AuthProps> = ({ 
    handleSignIn,
    handleSignOut,
    loggedIn: walletAddress,
    token,
    BASE_URL
}) => {
    return (
        <Router basename={BASE_URL}>
            <Routes>
                <Route path={'/'} element={<Aquarium {...{ token, handleSignIn, handleSignOut, BASE_URL }} loggedIn={walletAddress} />} />
                <Route path={'/aquarium/:id'} element={<Share {...{ token, handleSignIn, handleSignOut, BASE_URL }} loggedIn={walletAddress} />} />
            </Routes>
            
        </Router>
    )
}

export default AppView
