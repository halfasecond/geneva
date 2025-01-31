interface Window {
    ethereum?: {
        on: (event: string, handler: (...args: any[]) => void) => void;
        off: (event: string, handler: (...args: any[]) => void) => void;
        request: (request: { method: string }) => Promise<any>;
        enable: () => Promise<any>;
        isMetaMask: boolean;
        isDapper: boolean;
    };
}