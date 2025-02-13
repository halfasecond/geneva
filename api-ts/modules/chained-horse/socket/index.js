const socket = async (io, web3, name, Models) => {
    const namespace = io.of(`/${name}`)
    const { Account, Message } = Models
    let socketCount = 0
    let latestBlockNumber = await web3.eth.getBlockNumber()
    let blockBefore = latestBlockNumber

    const fetchLatestBlockHeader = async () => {
        try {
            latestBlockNumber = await web3.eth.getBlockNumber()
            if (blockBefore < latestBlockNumber) {
                blockBefore = latestBlockNumber
                namespace.emit('ethHeader', latestBlockNumber.toString())
            }
        } catch (error) {
            console.error(error);
        }
    }

    // Start fetching block headers at intervals (every second in this case)
    setInterval(fetchLatestBlockHeader, 1000)

    namespace.on('connection', socket => {
        socketCount++
        namespace.emit('users connected', socketCount)
        socket.emit('ethHeader', latestBlockNumber.toString())

        socket.on('ethHeader', () => socket.emit('ethHeader', latestBlockNumber.toString()))
        socket.on('getMessages', () => getMessages(socket, Message))
        socket.on('getAccounts', () => getAccounts(socket, Account))
        socket.on('addMessage', req => {
            const { message, account } = req
            let _Message = new Message({ message, account })
            _Message.save().then(() => getMessages(namespace, Message))
        })
        socket.on('disconnect', () => {
            socketCount--
            namespace.emit('users connected', socketCount)
            console.log('users connected', socketCount)
        })
    })
}

const getAccounts = (socket, Model) => {
    Model.find({})
        .then(data => socket.emit('accounts', data))
        .catch(err => console.log(err))
}

const getMessages = (io, Model) => {
    Model.aggregate([
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
    ])
        .then((data) => io.emit('messages', data))
        .catch((err) => console.log(err))
}

export default socket