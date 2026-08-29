/**
 * Live follow (WSS newHeads + per-block getPastEvents) is opt-in.
 *
 * Serving mongo dumps does not need the follower. Watching while ck_events
 * has a hole corrupts ck_nfts.owners[]. Historic fill / audit is a separate
 * job (import, then ck:rebuild), not this flag.
 *
 * INDEXER_FOLLOW=true     register watches + start BlockFollower
 * INDEXER_CATCHUP=true    HTTP gap fill inside followContracts (follow mode only)
 * VITE_ENABLE_INDEXER     legacy alias for catch-up only — does not start WSS
 */
export function isFollowEnabled(): boolean {
    return process.env.INDEXER_FOLLOW === 'true';
}

export function isCatchupEnabled(): boolean {
    if (process.env.INDEXER_CATCHUP !== undefined) {
        return process.env.INDEXER_CATCHUP === 'true';
    }
    return process.env.VITE_ENABLE_INDEXER === 'true';
}
