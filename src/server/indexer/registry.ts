export interface WatchedContract {
    name: string;
    address: string;
    abi: any[];
    events: string[];
    handle: (event: any) => Promise<void>;
}

export class ContractRegistry {
    private readonly watchers: WatchedContract[] = [];

    watch(contract: WatchedContract): void {
        const address = contract.address.toLowerCase();
        if (this.watchers.some((w) => w.address === address && w.name === contract.name)) {
            return;
        }
        this.watchers.push({ ...contract, address });
        console.log(`[indexer] watching ${contract.name} ${address} (${contract.events.join(', ')})`);
    }

    list(): WatchedContract[] {
        return this.watchers;
    }
}
