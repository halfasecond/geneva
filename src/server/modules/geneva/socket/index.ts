import { Namespace } from 'socket.io';

interface Models {
    Event: any;
    NFT: any;
    Owner: any;
    Account: any;
    Message: any;
    [key: string]: any;
}

// import { authMiddleware, getWalletAddress } from '../middleware/auth';

const socket = async (io: any, web3: any, name: string, Models: Models, Contracts: any, emitter: any) => {
    const namespace = io.of(`/${name}`);
    // Apply auth middleware to namespace
    // namespace.use(authMiddleware);
    let socketCount = 0;
    let latestEthBlock = { blocknumber: 0, timestamp: 0 };
    try {
        const { getLatestBlockNumber, resolveHeadRpc } = await import('../../../indexer');
        latestEthBlock.blocknumber = await getLatestBlockNumber(resolveHeadRpc());
    } catch (error) {
        console.error('[geneva] getBlockNumber failed', error);
    }
    emitter.on('newEthBlock', ({ number, timestamp }: { number: number; timestamp: number }) => {
        latestEthBlock.blocknumber = Number(number)
        latestEthBlock.timestamp = Number(timestamp)
        namespace.emit('newEthBlock', latestEthBlock)
    })

    namespace.on('connection', (socket: any) => {
        socketCount++;
        console.log(`Socket connected: ${socket.id} (Total sockets: ${socketCount})`);
        socket.on('disconnect', async () => {
            socketCount--;
            console.log(`Socket disconnected: ${socket.id} (Total sockets: ${socketCount})`);

        });
    });

    // Clean up on server shutdown
    const cleanup = () => {
        console.log('\n🎮 Cleaning up Geneva game server...');
        console.log('===========================\n');
        namespace.disconnectSockets(true);
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
};

export default socket;
