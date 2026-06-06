const socket = async (io, web3, name, Models, db, emitter) => {
    const namespace = io.of(`/${name}`)
    const { Account, Message } = Models
    let socketCount = 0

    let latestBlock = { blocknumber: 0, timestamp: 0 }
    emitter.on('newBlock', ({ number, timestamp }) => {
        latestBlock.blocknumber = Number(number)
        latestBlock.timestamp = Number(timestamp)
        namespace.emit('newBlock', latestBlock)
    })

    emitter.on('flowbotsEvent', async (event) => {
        namespace.emit('flowbotsEvent', {
            event: event.event,
            tokenId: Number(event.returnValues.tokenId),
            blocknumber: Number(event.blockNumber),
            from: event.returnValues.from,
            owner: event.returnValues.owner,
            amount: event.returnValues.amount ? event.returnValues.amount.toString() : undefined,
            startPrice: event.returnValues.startPrice ? event.returnValues.startPrice.toString() : undefined,
            endPrice: event.returnValues.endPrice ? event.returnValues.endPrice.toString() : undefined,
        })
        if (event.event === 'Birth') {
            updateCounts()
        }
    })

    const searchTypes = await getSearchTypes({}, Models)

    const updateCounts = async () => {
        const updatedCounts = await getSearchTypes({}, Models)
        Object.assign(searchTypes, updatedCounts)
        namespace.emit('searchTypes', searchTypes)
    }

    namespace.on('connection', async (socket) => {
        socketCount++
        namespace.emit('users connected', socketCount)
        socket.emit('searchTypes', searchTypes)
        socket.emit('newBlock', latestBlock)
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
            console.log(name + ' users connected', socketCount)
        })
    })
}

const getSearchTypes = async (counts, Models) => {
    let all = await Models.NFT.find()
    let prime = all.filter(({ isPrime }) => isPrime > 0)
    counts.total = all.length
    counts.prime = prime.length
    counts["Odd"]= all.filter(({ awards }) => awards.includes('Odd')).length
    counts["Twin"] = prime.filter(({ awards }) => awards.includes('Twin')).length
    counts["Yokel"] = prime.filter(({ awards }) => awards.includes('Yokel')).length
    counts["Amorous"] = prime.filter(({ awards }) => awards.includes('Amorous')).length
    counts["Very Amorous"] = prime.filter(({ awards }) => awards.includes('Very Amorous')).length
    counts["Very Amorous Twin"] = prime.filter(({ awards }) => awards.includes('Very Amorous Twin')).length
    counts["Very Amorous Yokel"] = prime.filter(({ awards }) => awards.includes('Very Amorous Yokel')).length
    counts["Centurion"] = all.filter(({ awards }) => awards.includes('Centurion')).length
    counts["Virtuoso"]= all.filter(({ awards }) => awards.includes('Virtuoso')).length
    counts["Musical"] = all.filter(({ awards }) => awards.includes('Musical')).length
    counts["Agile"] = all.filter(({ awards }) => awards.includes('Agile')).length
    counts["Recycled"] = all.filter(({ awards }) => awards.includes('Recycled')).length
    counts["Obsessed"] = prime.filter(({ awards }) => awards.includes('Obsessed')).length
    counts["Obsessed Yokel"] = prime.filter(({ awards }) => awards.includes('Obsessed Yokel')).length
    counts["Obsessed Twin"] = prime.filter(({ awards }) => awards.includes('Obsessed Twin')).length
    counts["DTF"] = prime.filter(({ awards }) => awards.includes('DTF')).length
    counts["fully charged"] = all.filter(({ power }) => power >= 65).length
    counts["charged"] = all.filter(({ power }) => power < 65 && power >= 55).length
    counts["needs a charge"] = all.filter(({ power }) => power < 55 && power > 25).length
    counts["flat"] = all.filter(({ power }) => power < 55 && power >= 25).length
    return counts
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
        },
        {
            $sort: { createdAt: 1 }  // Sort by createdAt in ascending order (oldest first)
        }
    ])
        .then((data) => io.emit('messages', data))
        .catch((err) => console.log(err))
}

export default socket