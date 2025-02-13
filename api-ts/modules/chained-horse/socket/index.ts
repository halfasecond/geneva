import { Server, Socket, Namespace } from 'socket.io';
import Web3 from 'web3';
import { Model } from 'mongoose';

interface BaseModels {
    Account: Model<any>;
    Message: Model<any>;
    [key: string]: Model<any>;
}

interface MessageData {
    message: string;
    account: string;
}

const socket = async (io: Server, web3: Web3, name: string, Models: BaseModels) => {
    const namespace: Namespace = io.of(`/${name}`);
    const { Account, Message } = Models;
    let socketCount = 0;
    let latestBlockNumber = await web3.eth.getBlockNumber();
    let blockBefore = latestBlockNumber;

    const fetchLatestBlockHeader = async () => {
        try {
            latestBlockNumber = await web3.eth.getBlockNumber();
            if (blockBefore < latestBlockNumber) {
                blockBefore = latestBlockNumber;
                namespace.emit('ethHeader', latestBlockNumber.toString());
            }
        } catch (error) {
            console.error('Error fetching block header:', error);
        }
    };

    // Start fetching block headers at intervals (every second in this case)
    const intervalId = setInterval(fetchLatestBlockHeader, 1000);

    // Clean up interval on server shutdown
    process.on('SIGTERM', () => clearInterval(intervalId));
    process.on('SIGINT', () => clearInterval(intervalId));

    namespace.on('connection', (socket: Socket) => {
        socketCount++;
        namespace.emit('users connected', socketCount);
        socket.emit('ethHeader', latestBlockNumber.toString());

        socket.on('ethHeader', () => socket.emit('ethHeader', latestBlockNumber.toString()));
        
        socket.on('getMessages', async () => {
            try {
                await getMessages(socket, Message);
            } catch (err) {
                console.error('Error getting messages:', err);
                socket.emit('error', { message: 'Failed to fetch messages' });
            }
        });

        socket.on('getAccounts', async () => {
            try {
                await getAccounts(socket, Account);
            } catch (err) {
                console.error('Error getting accounts:', err);
                socket.emit('error', { message: 'Failed to fetch accounts' });
            }
        });
        
        socket.on('addMessage', async (req: MessageData) => {
            try {
                const { message, account } = req;
                const _Message = new Message({ message, account });
                await _Message.save();
                await getMessages(namespace, Message);
            } catch (err) {
                console.error('Error saving message:', err);
                socket.emit('error', { message: 'Failed to save message' });
            }
        });

        socket.on('disconnect', () => {
            socketCount--;
            namespace.emit('users connected', socketCount);
            console.log('users connected', socketCount);
        });
    });
};

const getAccounts = async (socket: Socket | Namespace, Model: Model<any>) => {
    try {
        const data = await Model.find({});
        socket.emit('accounts', data);
    } catch (err) {
        console.error('Error fetching accounts:', err);
        throw err;
    }
};

const getMessages = async (io: Socket | Namespace, Model: Model<any>) => {
    try {
        const data = await Model.aggregate([
            {
                $lookup: {
                    from: 'accounts',
                    localField: 'account',
                    foreignField: 'address',
                    as: 'accountInfo'
                }
            },
            {
                $project: {
                    _id: -1,
                    message: 1,
                    account: 1,
                    createdAt: 1,
                    avatar: { $arrayElemAt: ['$accountInfo.avatar', 0] }
                }
            }
        ]);
        io.emit('messages', data);
    } catch (err) {
        console.error('Error fetching messages:', err);
        throw err;
    }
};

export default socket;
