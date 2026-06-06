export type Bot = {
    id: number;
    tokenId: number;
    arms: number;
    grill: number;
    panel: number;
    body: number;
    head: number;
    legs: number;
    awards: string[];
    luck: number;
    skill: number;
    power: number;
    isPrime: number | boolean;
    issue: number;
    currentPrice: string;
    forSale: boolean;
    owner: string,
    owners: [string],
    bids: [{
        amount: string,
        bidder: string,
        txHash: string,
        timestamp: number,
    }]
}