import { getPastContractEvents } from '../modules/utils';
import type { WatchedContract } from './registry';

export type WatchContractFn = (contract: WatchedContract) => void;

export interface FollowedContract {
    label?: string;
    abi: any[];
    addr: string;
    events: string[];
}

/**
 * Live-watch a module's contracts on the shared block follower.
 *
 * Historic genesis scans are a separate server import (dumps / project APIs).
 * If VITE_ENABLE_INDEXER is on and the module already has events in Mongo,
 * we only catch up from the last stored block to head.
 */
export async function followContracts(opts: {
    name: string;
    watchContract?: WatchContractFn;
    contracts: FollowedContract[];
    handle: (event: any) => Promise<void>;
    backfill?: {
        web3: any;
        Models: { Event: any };
        deployed: number;
        increment: number;
    };
}): Promise<void> {
    const { name, watchContract, contracts, handle, backfill } = opts;

    if (!watchContract) {
        console.log(`${name}: API only — not on block follower`);
        return;
    }

    if (!contracts.length) {
        console.log(`${name}: no contract found to observe`);
        return;
    }

    for (const contract of contracts) {
        const label = contracts.length > 1 && contract.label ? `${name}:${contract.label}` : name;
        watchContract({
            name: label,
            address: contract.addr,
            abi: contract.abi,
            events: contract.events,
            handle,
        });
    }

    if (process.env.VITE_ENABLE_INDEXER !== 'true' || !backfill) {
        return;
    }

    const latest = await backfill.Models.Event.findOne({}, {}, { sort: { blockNumber: -1 } });
    if (!latest) {
        console.log(
            `[indexer] ${name}: no events in mongo — live only. Import historic data on the server before enabling a genesis scan.`,
        );
        return;
    }

    const maxRange = Math.max(1, Number(process.env.GETLOGS_MAX_RANGE ?? 5));
    const maxCatchup = Math.max(maxRange, Number(process.env.INDEXER_MAX_CATCHUP ?? 500));
    const head = Number(await backfill.web3.eth.getBlockNumber());
    const last = Number(latest.blockNumber);
    const gap = head - last;
    if (gap > maxCatchup) {
        console.log(
            `[indexer] ${name}: ${gap} blocks behind (last ${last}, head ${head}) — skip HTTP catch-up (eth_getLogs max ${maxRange}). Serving mongo + live follower.`,
        );
        return;
    }

    for (const contract of contracts) {
        const label = contract.label ? `${name}:${contract.label}` : name;
        await getPastContractEvents(
            label,
            contract.abi,
            contract.addr,
            backfill.deployed,
            Math.min(backfill.increment, maxRange),
            backfill.Models as any,
            handle,
            contract.events,
            backfill.web3,
        );
    }
}
