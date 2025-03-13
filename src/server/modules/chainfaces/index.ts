import { Express } from 'express';
import { Server } from 'socket.io';
import { Model, Connection } from 'mongoose';
import _Models from './models';
import Routes from './routes';
import Contracts from './contracts';
import { getContractHistory, handleStandardERC721Event } from '../utils';

interface ModuleConfig {
    app: Express;
    io: Server;
    web3: any;
    db: Connection;
    name?: string;
    prefix: string;
    deployed?: number;
    increment?: number;
    eventsToWatch?: string[];
    emitter: any;
}

interface Models {
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    [key: string]: Model<any>;
}

const processEvent = async (event: any, web3: any): Promise<void> => {
    const contract = new web3.eth.Contract(Contracts.Core.abi, Contracts.Core.addr)
    event.face = await contract.methods.getFace(event.tokenId).call().catch(e => console.log(e))
    const backgroundColor = await contract.methods.getBackgroundColor(event.tokenId).call().catch(e => console.log(e))
    event.backgroundColor = Number(backgroundColor)
    const faceSymmetry = await contract.methods.getFaceSymmetry(event.tokenId).call().catch(e => console.log(e))
    event.faceSymmetry = Number(faceSymmetry)
    const golfScore = await contract.methods.getGolfScore(event.tokenId).call().catch(e => console.log(e))
    event.golfScore = Number(golfScore)
    const percentBear = await contract.methods.getPercentBear(event.tokenId).call().catch(e => console.log(e))
    event.percentBear = Number(percentBear)
    const textColor = await contract.methods.getTextColor(event.tokenId).call().catch(e => console.log(e))
    event.textColor = Number(textColor)
    console.log(event.face, event.backgroundColor, event.faceSymmetry, event.golfScore, event.percentBear, event.textColor)
};

const logEvent = async (event: any, Models: Models, web3: any) => 
    handleStandardERC721Event(event, processEvent, Models, web3);

const runModule = (config: ModuleConfig) => {
    const { app, io, web3, db, name, prefix, deployed = 0, increment = 1000, eventsToWatch = ['Transfer'], emitter } = config;
    const Models = _Models(prefix, db);

    Routes(app, name, Models);

    if (Object.keys(Contracts).length) {
        const module = { 
            Contracts, 
            Models, 
            deployed, 
            increment, 
            eventsToWatch, 
            logEvent: (event: any) => logEvent(event, Models, web3) 
        };
        getContractHistory(name || 'default module', module, eventsToWatch, web3);
    } else {
        console.log('no contract found to observe');
    }
};

export default runModule;
