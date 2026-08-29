export interface RecentEvent {
    tokenId: string;
    kitty?: {
        g8: number;
        gen: number;
    },
    gen: number;
    g8: number;
    value: string | undefined
}