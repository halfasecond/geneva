import { Namespace } from 'socket.io';
import { Model } from 'mongoose'

interface Models {
    Account: Model<any>;
    Aquarium: Model<any>;
    CMS: Model<any>;
    Message: Model<any>;
    [key: string]: Model<any>;
}

import { authMiddleware, getWalletAddress } from '../middleware/auth';

const socket = async (io: any, web3: any, name: string, Models: Models, Contracts?: any, emitter?: any) => {
    const namespace = io.of(`/${name}`);

    // Apply auth middleware to namespace
    namespace.use(authMiddleware);
    let socketCount = 0;
    let gameLoopInterval: NodeJS.Timeout;
    let saveInterval: NodeJS.Timeout;
    let latestEthBlock = { blocknumber: 0, timestamp: 0 };

    namespace.on('connection', (socket: any) => {
        socketCount++;
        console.log(`Socket connected: ${socket.id} (Total sockets: ${socketCount})`);
        getMessages(namespace, Models.Message)

        socket.on('getMessages', () => getMessages(namespace, Models.Message))
        socket.on('getAccounts', () => getAccounts(socket, Models.Account))
        socket.on('addMessage', (message: string) => {
            try {
                const walletAddress = getWalletAddress(socket);
                let _Message = new Models.Message({ message, account: walletAddress })
                _Message.save().then(() => {
                    getMessages(namespace, Models.Message)
                })
            } catch (e) {
                console.log(e)
            }
        })

        socket.on("saveTank", async (tank: any) => {
            try {
                const walletAddress = getWalletAddress(socket)
                if (!walletAddress) {
                    throw new Error("Unauthenticated")
                }

                // Never trust client account field
                const payload = {
                    ...tank,
                    account: walletAddress.toLowerCase()
                }

                const saved = await Models.Aquarium.findOneAndUpdate(
                    { account: walletAddress.toLowerCase() },   // lookup
                    payload,                       // overwrite
                    {
                        upsert: true,                // create if missing
                        new: true,                   // return updated doc
                        setDefaultsOnInsert: true
                    }
                )

                socket.emit("tankSaved", {
                    success: true,
                    updatedAt: saved.updatedAt
                })
            } catch (err) {
                console.error("saveTank error:", err)

                socket.emit("tankSaved", {
                    success: false,
                    error: "Failed to save tank"
                })
            }
        })

        socket.on('getTank', async () => {
            console.log('getting tank!')
            try {
                const walletAddress = getWalletAddress(socket)
                if (!walletAddress) {
                    throw new Error("Unauthenticated")
                }
                // Never trust client account field
                const tank = await Models.Aquarium.findOne({ account: walletAddress.toLowerCase() }).select('-__v -createdAt -account')
                socket.emit("tankLoaded", { success: true, tank })
            } catch (err) {
                console.error("tank error:", err)
                socket.emit("tankLoaded", { success: false, error: "Failed to load tank" })
            }
        })

        socket.on('disconnect', async () => {
            socketCount--;
            console.log(`Socket disconnected: ${socket.id} (Total sockets: ${socketCount})`);
        });
    });

    // Clean up on server shutdown
    const cleanup = () => {
        console.log('\n🎮 Cleaning up game server...');
        namespace.disconnectSockets(true);
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
};

const getAccounts = (socket: any, Model: any) => {
    Model.find({})
        .then((data: any) => socket.emit('accounts', data))
        .catch((err: Error) => console.log(err))
}

const getMessages = (namespace: Namespace, Model: any) => {
    // const players = getConnectedPlayers(namespace)
    Model.find({}, { "_id": 0 }).then((data: any[]) => {
        const messages = [] as any[]
        // data.forEach((d: { account: string; _doc: any }) => {
        //     const avatar = players.find(({ walletAddress }) => walletAddress?.toLowerCase() === d.account.toLowerCase())?.id
        //     const message = { ...d._doc, avatar }
        //     messages.push(message)
        // })
        namespace.emit('messages', data)
    }).catch((err: Error) => console.log(err))
}

export default socket;
