/**
 * After UTC midnight: fill ck_events + kh_events to tip, stamp marketplace
 * Transfer.value and hats, finalize yesterday's ETH close, append kn_dailies.
 * finalize yesterday's ETH close, append that day's kn_dailies row. Idempotent.
 *
 * Usage:
 *   yarn ck:midnight
 */
import { spawnSync } from 'child_process';
import path from 'path';

const yarn = (args: string[]) => {
    console.log('[ck:midnight]', 'yarn', args.join(' '));
    const result = spawnSync('yarn', args, {
        cwd: path.resolve(process.cwd()),
        stdio: 'inherit',
        env: process.env,
    });
    if (result.status !== 0) {
        throw new Error(`yarn ${args.join(' ')} exited ${result.status}`);
    }
};

const arg = (name: string) => {
    const idx = process.argv.indexOf(name);
    return idx === -1 ? undefined : process.argv[idx + 1];
};

const main = () => {
    const now = new Date();
    const y = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    const day = arg('--day') || y.toISOString().slice(0, 10);
    console.log(`[ck:midnight] ${now.toISOString()} building ${day} (block-closed)`);
    yarn(['ck:fill', '--', '--range', '5']);
    yarn(['ck:stamp-auctions', '--', '--live', '--recent']);
    yarn(['kh:fill', '--', '--range', '5']);
    yarn(['ck:fix-values', '--', '--unstamped', '--days', '2']);
    yarn(['kh:stamp']);
    yarn(['ck:ethprices', '--finalize']);
    yarn(['ck:daily', '--day', day, '--commit']);
    console.log(`[ck:midnight] done ${day}`);
};

main();
