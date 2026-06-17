import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Metamask from 'components/Metamask'
import { AuthProps } from 'types/auth'
import Layout from '../KittyFamily/Layout'
import Home from '../KittyFamily/pages/Home'
import FamilyTree from '../KittyFamily/pages/FamilyTree'
import Placeholder from '../KittyFamily/pages/Placeholder'

const AppView: React.FC<AuthProps> = ({
    handleSignIn,
    handleSignOut,
    loggedIn,
    token,
    tokenId,
    BASE_URL,
}) => (
    <Router>
        <div className="relative">
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="kitty/:id" element={<FamilyTree />} />
                    <Route
                        path="search"
                        element={
                            <Placeholder
                                title="Search"
                                description="Specialist CK search with cattribute filters — porting from the legacy kitty.family client."
                            />
                        }
                    />
                    <Route
                        path="kitty-hats"
                        element={
                            <Placeholder
                                title="Kitty Hats"
                                description="Community hats for your cryptokitties. The shop needs the kitty-hats API module and on-chain purchase flow."
                                note="Kitty-hats is a separate indexer (Buy events on the hats contract) and may share NFT hat metadata on ck_nfts. We'll decide whether to nest it under cryptokitties or keep a slim kitty-hats module."
                            />
                        }
                    />
                    <Route
                        path="report"
                        element={
                            <Placeholder
                                title="Zen report"
                                description="Daily CK stats and market report — will connect to kittynews socket once that module ships."
                            />
                        }
                    />
                    <Route
                        path="profile/:profile"
                        element={
                            <Placeholder
                                title="Profile"
                                description="Owner profiles, followers, and kitty balances — needs kittyfamily accounts routes."
                            />
                        }
                    />
                </Route>
            </Routes>

            <div className="fixed bottom-5 left-5 z-50">
                <Metamask
                    {...{ handleSignIn, handleSignOut, token, tokenId, BASE_URL }}
                    loggedIn={loggedIn}
                />
            </div>
        </div>
    </Router>
)

export default AppView