export interface AuthProps {
    loggedIn: string | undefined
    handleSignIn: () => void
    handleSignOut: () => void
    token: string | undefined
}
