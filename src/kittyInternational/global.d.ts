interface Window {
    ethereum?: {
        on: (event: string, handler: (...args: unknown[]) => void) => void
        off: (event: string, handler: (...args: unknown[]) => void) => void
        request: (request: { method: string }) => Promise<unknown>
    }
}
