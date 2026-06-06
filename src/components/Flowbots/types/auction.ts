export interface Auction {
    transactionHash: string
    transactionIndex: number
    blockHash: string
    blockNumber: number
    from: string
    to: string
    cumulativeGasUsed: number
    gasUsed: number
    contractAddress?: string
    logs: any[]
    logIndex: number
    events: { SaleCreated: { returnValues: { startPrice: string, endPrice: string, endTime: string } } }
}