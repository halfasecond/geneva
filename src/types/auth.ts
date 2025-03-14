export interface AuthProps {
    loggedIn: string | undefined;
    handleSignIn: () => void;
    handleSignOut: () => void;
    token: string | undefined;
    tokenId: number | undefined;
    BASE_URL: string;
    app?: string;
}

export interface WalletDetails {
    walletInput: string,
}