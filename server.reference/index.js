import express from 'express'
import path from 'path'
import { createServer } from 'http'
import { Server as socketIo } from 'socket.io'
import bodyParser from 'body-parser'
import cors from 'cors'
import Web3 from 'web3'
import ChainedHorses from './modules/chained-horses'
import { getPastContractEvents, subscribeToContractEvents } from './utils'
import socket from './socket'
import db from './db'

const runReport = async (name, web3, Module, eventIncludes) => {
  const { Contracts, Deployed, increment, Models, logEvent } = Module;
  const events = await getPastContractEvents(name, web3, Contracts, Deployed, increment, Models, logEvent, eventIncludes);
  console.log(`${name} ${events}`);
  subscribeToContractEvents(name, web3, Contracts.Core.abi, Contracts.Core.addr, logEvent, eventIncludes);
}

const launchApp = async () => {
    const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.WEB3_SOCKET_URL, {
        clientConfig: {
          maxReceivedFrameSize: 100000000,
          maxReceivedMessageSize: 100000000,
        },
        reconnect: {
          auto: true,
          delay: 5000, // Adjust the delay as needed
          maxAttempts: Infinity, // Retry indefinitely or set a specific number of attempts
          onTimeout: false,
        }
    }))
      
    web3.currentProvider.on('error', (error) => console.error('WebSocket Connection Error:', error))
    web3.currentProvider.on('connect', () => console.log('WebSocket Connection Established'))
    const app = express()
    const server = createServer(app)
    app.use(express.json())
    app.use(cors())
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))
    const io = new socketIo(server, { cors: { origin: ["http://localhost:3333"] } })
    db.on("error", err => console.log("There was a problem connecting to mongo: ", err))
    db.once("open", () => {
      runReport("chained horse", web3, ChainedHorses, ["Transfer", "Approval", "ApprovalForAll"]);
      ChainedHorses.Routes(app, web3)
      console.log("Successfully connected to mongo")
    })
    const staticFolderPath = path.join(__dirname, 'build');
    app.use(express.static(staticFolderPath));
    app.get('/', (req, res) => {
      res.sendFile(path.join(staticFolderPath, 'index.html'));
    })
    socket(io, web3)
    server.listen(process.env.PORT, () => console.log(`listening on *:${process.env.PORT}`))
}

launchApp()

