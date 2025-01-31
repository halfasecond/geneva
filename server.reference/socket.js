import Account from './models/chained-horse/accounts';
import Message from './models/chained-horse/messages';
import News from './models/chained-horse/news';
import Birth from './models/chained-horse/births';
import Race from './models/chained-horse/races';
import ScareCityGameModel from './models/chained-horse/scareCityGames'

const ScareCityGame = {}

const traitTypes = ['background','bodyAccessory','bodyColor','headAccessory','hoofColor','mane','maneColor','pattern','patternColor','tail','utility']

const socket = async (io, web3) => {
  const races = await Race.distinct('race');
  const raceRecords = [];
  const racePromises = races.map(async (_race) => {
    const record = await Race.findOne({ name: { $eq: _race }}).sort({ time: 1 });
    const { race, tokenId, winner, time, block, timestamp } = record;
    raceRecords.push({ race, tokenId, winner, time, block, timestamp });
  });
  await Promise.all(racePromises);

  let socketCount = 0
  let latestBlockNumber = await web3.eth.getBlockNumber()
  let blockBefore = latestBlockNumber
  let subscription
  
  const things = {}
  const avatars = [] // TODO - rename this to players
  const fetchLatestBlockHeader = async () => {
    try {
      latestBlockNumber = await web3.eth.getBlockNumber()
      if (blockBefore < latestBlockNumber) {
        blockBefore = latestBlockNumber
        io.emit('ethHeader', latestBlockNumber.toString())
        doGameTasks()
      }
    } catch (error) {
      console.error(error);
    }
  }

  const doGameTasks = async () => {
    if (!ScareCityGame.gameStart || ScareCityGame.gameStart + ScareCityGame.gameLength <= Number(latestBlockNumber)) {
      if (ScareCityGame.gameStart) {
        let someonePlayed = traitTypes.some(trait => ScareCityGame[trait].foundBy || ScareCityGame[trait].discounted.length > 0)
        if (someonePlayed) {
          const payments = []
          let ghostPayment = 0
          traitTypes.map(trait => {
            if (ScareCityGame[trait].foundBy) {
              payments.push({ 
                payTo: ScareCityGame[trait].foundBy,
                payment: (attributes.find(attribute => attribute.name === trait && attribute.value === ScareCityGame[trait].answer).percentage / 11) / 100
              })
            }
            if (ScareCityGame[trait].discounters.length) {
              ScareCityGame[trait].discounters.map(payTo => {
                payments.push({ 
                  payTo,
                  payment: (( attributes.find(attribute => attribute.name === trait && attribute.value === ScareCityGame[trait].answer).percentage / 11) / 100) / attributes.filter(attribute => attribute.name === trait).length
                })
              })
            }
            if (ScareCityGame.ghosts.length) {
              ghostPayment = ghostPayment + (attributes.find(attribute => attribute.name === trait && attribute.value === ScareCityGame[trait].answer).percentage / 11) / 100
            }
          })
          if (ScareCityGame.ghosts.length) {
            ScareCityGame.ghosts.map(payTo => {
              payments.push({ payTo, payment: ghostPayment })
            })
          }
          const multiplier1 = ScareCityGame.ghosts.length + 1
          const multiplier2 = traitTypes.filter(trait => ScareCityGame[trait].foundBy).length === traitTypes.length ? 5 : 1
          const multiplier = multiplier1 * multiplier2
          const payeeTotals = payments.reduce((acc, payment) => {
            const { payTo, payment: amount } = payment;        
            if (!acc[payTo]) {
              acc[payTo] = 0;
            }
            acc[payTo] += amount * multiplier;
            return acc;
          }, {});
          // Show everyone the hay...
          Object.keys(payeeTotals).map(async (payee, i) => {
            const totalAmount = payeeTotals[payee]
            const user = await Account.findOne({ address: payee });
            if (user) {
              user.hay += payeeTotals[payee];
              await user.save()
              if (avatars.find(avatar => avatar.account === payee)) {
                const userAvatar = avatars.find(avatar => avatar.account === payee);
                userAvatar.hay += totalAmount;
                io.emit('move', avatars)
                addNotification(payee, 'Hay distribution', `you received ${totalAmount} $HAY`);
              }
            }
          });
          // Calculate the overall total
          ScareCityGame.totalPaidOut = Object.values(payeeTotals).reduce((sum, total) => sum + total, 0);
          const newGame = new ScareCityGameModel(ScareCityGame);
          try {
            await newGame.save();
          } catch (error) { console.error('Error saving ScareCityGame:', error); }
        }
      }
      makeScareCityGame(Number(latestBlockNumber), 10)
    } else {
      savePlayers([...avatars])
    }
  }
  
  // Start fetching block headers at intervals (every second in this case)
  subscription = setInterval(fetchLatestBlockHeader, 1000);

  const makeScareCityGame = async (blockNumberStart, gameLength) => {
    const traits = []
    Birth.find().sort({ blockNumber: -1, tokenId: -1 }).limit(1000).then(_horses => {
      traitTypes.forEach((traitType) => {
        const uniqueTraits = [...new Set(_horses.map((horse) => horse[traitType]))]
          .filter((trait) => trait !== undefined);
        uniqueTraits.forEach((trait) => {
          const amount = _horses.filter((horse) => horse[traitType] === trait).length;
          traits.push({ name: traitType, value: trait, amount });
        });
      });
      ScareCityGame.gameStart = blockNumberStart
      ScareCityGame.gameLength = gameLength
      ScareCityGame.ghosts = []
      ScareCityGame.totalPaidOut = 0
      traitTypes.forEach((trait, i) => {
        const traitsOfThisType = traits.filter(({ name }) => name === trait)
        const randomIndex = Math.floor(Math.random() * traitsOfThisType.length)
        const answer = traitsOfThisType[randomIndex] ? traitsOfThisType[randomIndex].value : 0
        ScareCityGame[trait] = { answer, discounted: [], discounters: [], foundBy: null, foundAtBlock: null }
        if (i === traitTypes.length - 1) {
          io.emit('gameData', ScareCityGame)
        }
      })
    })
  }

  const savePlayers = async (players) => {
      // Create an array of update operations for each avatar
    const updateOperations = players.map(({ account, tokenId, left, top, transform, newbRaceOver, hay }) => {
      return {
        updateOne: {
          filter: { address: account }, // Filter by account (assuming account is unique)
          update: { avatar: tokenId, left, top, transform, newbIslandRace: newbRaceOver, hay },
          upsert: false,
        },
      };
    });
    try { await Account.bulkWrite(updateOperations) } catch (error) { console.error('Error saving players:', error) }
  }

  const getPlayers = (io) => {
    Account.find().then(accounts => {
      accounts.forEach(({ level, address, avatar, left, top, transform, newbIslandRace, hay }) => {
        if (avatars.find(player => player.account === address) === undefined) {
          avatars.push({
            level,
            account: address,
            tokenId: avatar,
            left,
            top,
            transform,
            newbRaceOver: newbIslandRace,
            hay,
          })
        }
      })
    })
    io.emit('move', avatars)
  }

  getPlayers(io)
  
  const attributes = []
  let horses = []
  
  Birth.find().sort({ blockNumber: -1, tokenId: -1 }).limit(1000).then(_horses => {
    horses = [..._horses]
    traitTypes.forEach((traitType) => {
      const uniqueTraits = [...new Set(_horses.map((horse) => horse[traitType]))]
        .filter((trait) => trait !== undefined);
      uniqueTraits.forEach((trait) => {
        const amount = _horses.filter((horse) => horse[traitType] === trait).length;
        attributes.push({ name: traitType, value: trait, amount, percentage: (100 / horses.length) * amount });
      });
      
    });
    if (_horses.length > 0) {
      const utilities = [...new Set(horses.map(({ utility }) => utility))].filter(x => x !== undefined)
      utilities.forEach(util => {
        const _data = horses.filter(d => d.utility === util).map((d, i) => {
          let newData = Object.assign({}, d); // create a new object using the spread operator
          if (util === 'duck of doom') {
            newData.top = Math.floor(Math.random() * 300) + 2500;
            newData.left = Math.floor(Math.random() * 300) + 40;
          } else {
            if (util === 'ghost of death') {
              newData.top = Math.floor(Math.random() * (100));
              newData.left = Math.floor(Math.random() * 3001) + 2000;
            } else {
              newData.top = Math.floor(Math.random() * (10000 - 100));
              newData.left = Math.floor(Math.random() * (10000 - 100));
            }
          }
          delete newData.svg;
          return newData;
        });
        if (util === 'bonsai of life') { things.bonsaiOfLife = _data }
        if (util === 'ghost of death') { things.ghostsOfDeath = _data }
        if (util === 'flower of goodwill') { things.flowers = _data }
        if (util === 'duck of doom') { things.ducksOfDoom = _data }
        if (util === 'turtle of speed') { things.turtlesOfSpeed = _data }
        if (util === 'bonfire from hell') { things.bonfiresFromHell = _data }
      })
      setInterval(() => {
        things.turtlesOfSpeed.forEach(thing => {
          thing.left = thing.left + 1 > horses.length * 10 ? 0 : thing.left + 1;
        });
        things.ghostsOfDeath.forEach(thing => {
          thing.left = thing.left - 10 > 2000 ? thing.left - 10 : 5000;
        });
        things.ducksOfDoom.forEach(thing => {
          thing.left = thing.left + 4 > 280 ? 20 : thing.left + 4;
        });
        io.emit('things', things);
      }, 1000);
    }
  }).catch(e => console.log(e));

  const addNotification = (account, type, message, alertAll) => {
    io.emit('notification', { account, type, message, alertAll })
  }

  io.on('connection', socket => {
    socket.emit('ethHeader', latestBlockNumber.toString())
    socket.emit('move', avatars)
    socket.emit('things', things)
    socket.emit('attributes', attributes)
    socketCount++
    io.emit('users connected', socketCount)

    socket.emit('gameData', ScareCityGame)

    socket.on('gameData', () => socket.emit('gameData', ScareCityGame))
    socket.on('raceRecords', () => socket.emit('raceRecords', raceRecords))
    socket.on('attributes', () =>  socket.emit('attributes', attributes))
    socket.on('horses', () => socket.emit('horses', horses))

    socket.on('ethHeader', () => socket.emit('ethHeader', latestBlockNumber.toString()))

    socket.on('scanHorse', scanResults => {
      const { scanType, scanResult, account } = scanResults
      if (avatars.find(avatar => avatar.account === account)) {
        const player = avatars.find(avatar => avatar.account === account)
        if (ScareCityGame[scanType]['foundBy'] === null && ScareCityGame[scanType]['answer'] === scanResult) {
          ScareCityGame[scanType]['foundBy'] = account
          ScareCityGame[scanType]['foundAtBlock'] = Number(latestBlockNumber)
          addNotification(account, 'Scare City', `Horse #${player.tokenId} was spooked by a ghost who spotted their ${scanResult} ${scanType}`, true)
        } else {
          if (ScareCityGame[scanType]['answer'] !== scanResult)  {
            if (!(ScareCityGame[scanType].discounters.includes(account))) {
              ScareCityGame[scanType].discounters.push(account)
              if (!ScareCityGame[scanType].discounted.includes(scanResult)) {
                ScareCityGame[scanType].discounted.push(scanResult)
              }
              if (traitTypes.filter(traitType => ScareCityGame[traitType].discounters.includes(account)).length === traitTypes.length) {
                ScareCityGame.ghosts.push(account)
                addNotification(account, 'Scare City', `Horse #${player.tokenId} walked through Scare City without getting scared!`, true)
              }
            } else { console.log('horse hacking!') }
          }
        }
      }
      io.emit('gameData', ScareCityGame)
    })

    socket.on('wonRace', async ({ race, tokenId, winner, time, riders }) => { // { race, tokenId, winner, time, riders }
      try {
        const getblock = await web3.eth.getBlock(latestBlockNumber)
        const block = getblock.number
        const timestamp = new Date(Number(getblock.timestamp) * 1000)
        const newRecordTime = raceRecords.some(_race => _race.race === race && _race.time > time) || !raceRecords.some(_race => _race.race === race);
        const newRace = new Race({ race, tokenId, winner, time, riders, block: Number(block), timestamp, newRecordTime });
        await newRace.save();
        const alertAll = true
        if (newRecordTime) {
          const existingRecordIndex = raceRecords.findIndex(_race => _race.race === race);
          if (existingRecordIndex !== -1) {
            raceRecords[existingRecordIndex] = { race, tokenId, winner, time, block: Number(block), timestamp };
          } else {
            raceRecords.push({ race, tokenId, winner, time, block: Number(block), timestamp });
          }
          io.emit('raceRecords', raceRecords)
          addNotification(winner, 'Track Record', `Horse #${tokenId} set a new record in the ${race}: ${time / 1000}s`, alertAll);
        } else {
          addNotification(winner, 'Horse Race', `Horse #${tokenId} won the ${race} in ${time / 1000}s`, alertAll);
        }
      } catch (error) { console.error('Error adding a new race record:', error) }
    })

    socket.on('getPlayers', () => getPlayers(io))

    socket.on('userMove', ({ left, top, account, transform, tokenId, newbRaceOver, canMove, hay }) => {
      if (avatars.find(avatar => avatar.account === account)) {
        avatars.find(avatar => avatar.account === account).left = left
        avatars.find(avatar => avatar.account === account).top = top
        avatars.find(avatar => avatar.account === account).transform = transform
        avatars.find(avatar => avatar.account === account).tokenId = tokenId
        avatars.find(avatar => avatar.account === account).newbRaceOver = newbRaceOver
        avatars.find(avatar => avatar.account === account).canMove = canMove
      } else {
        avatars.push({ left, top, account, transform, tokenId, newbRaceOver, canMove, hay })
      }
      io.emit('move', avatars)
    })

    socket.on('addMessage', req => {
      const { message, account } = req
      let _Message = new Message({ message, account })
      _Message.save().then(() => getMessages(io))
    })
    socket.on('addNews', req => addNews(req, socket))
    socket.on('getMessages', () => getMessages(socket))
    socket.on('getNews', () => getNews(socket))
    socket.on('getAccounts', () => getAccounts(socket))
    socket.on('disconnect', () => {
      // Decrease the socket count on a disconnect, emit
      socketCount--
      io.emit('users connected', socketCount)
      console.log('users connected - 1', socketCount)
    })
  })
}

const getAccounts = socket => {
  Account.find({})
    .then(data => socket.emit('accounts', data))
    .catch(err => console.log(err))
}

const getMessages = io => {
  Message.aggregate([
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

const getNews = socket => {
  News.aggregate([
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
        headline: 1,
        story: 1,
        account: 1,
        createdAt: 1,
        avatar: { $arrayElemAt: ['$accountInfo.avatar', 0] }
      }
    }
  ])
    .then(data => socket.emit('news', data))
    .catch(err => console.log(err))
}

const addNews = ({ story, headline, account }, socket) => {
  let _News = new News({ story, headline, account })
  _News.save().then(() => getNews(socket))
}

module.exports = socket;