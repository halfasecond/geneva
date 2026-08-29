export interface FamilyUser {
    valid: boolean
    followers: string[]
    following: string[]
    balance: number
    birthed: number
    balanceAll: number
    address?: string
    token?: string
    avatar?: number
    displayName?: string
}

export interface AuthProps {
    loggedIn: string | undefined
    handleSignIn: () => void
    handleSignOut: () => void
    token: string | undefined
    user: FamilyUser
    checkToken: () => void
}
