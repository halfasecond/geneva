export interface AuthProps {
    loggedIn: string | undefined;
    handleSignIn: () => void;
    handleSignOut: () => void;
    BASE_URL: string;
}

export interface WalletDetails {
    walletInput: string,
}