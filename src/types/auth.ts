export interface AuthProps {
    loggedIn: string | undefined;
    handleSignIn: () => void;
    handleSignOut: () => void;
    BASE_URL: string;
    tokenId: number | undefined;
}

export interface WalletDetails {
    walletInput: string,
}