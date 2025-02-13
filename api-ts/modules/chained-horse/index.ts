import { Express } from '../../types/express';
import { Server } from 'socket.io';
import Web3 from 'web3';
import { decode } from 'js-base64';
import { Model, Connection } from 'mongoose';
import createModels from './models';
// import Routes from './routes';
import Contracts from './contracts';
import Socket from './socket';
import { getContractHistory, handleStandardERC721Event } from '../utils';

interface ModuleOptions {
    app: Express;
    io: Server;
    web3: Web3;
    db: Connection;
    name?: string;
    prefix: string;
    deployed?: number;
    increment?: number;
    eventsToWatch?: string[];
}

interface BaseModels {
    Account: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    Event: Model<any>;
    Message: Model<any>;
    [key: string]: Model<any>;
}

interface Event {
    tokenId: number;
    svg?: string;
    background?: string;
    tail?: string;
    mane?: string;
    pattern?: string;
    headAccessory?: string;
    bodyAccessory?: string;
    utility?: string;
    maneColor?: string;
    patternColor?: string;
    hoofColor?: string;
    bodyColor?: string;
    [key: string]: any;
}

interface Module {
    Contracts: typeof Contracts;
    Models: BaseModels;
    deployed: number;
    increment: number;
    eventsToWatch: string[];
    logEvent: (event: any) => Promise<void>;
}

interface TokenAttribute {
    trait_type: string;
    value: string;
}

const processEvent = async (event: Event, web3: Web3): Promise<void> => {
    console.log('Processing NFT metadata for token:', event.tokenId);
    const contract = new web3.eth.Contract(Contracts.Core.abi, Contracts.Core.addr);
    
    try {
        const svg = await contract.methods.tokenSVG(event.tokenId).call();
        if (svg) {
            event.svg = svg.toString();
            console.log('Got SVG for token:', event.tokenId);
        }
        
        const info: string = await contract.methods.tokenURI(event.tokenId).call();
        if (info) {
            const parts = info.split(',');
            if (parts.length > 1) {
                const { attributes } = JSON.parse(decode(parts[1])) as { attributes: TokenAttribute[] };
                console.log('Got attributes for token:', event.tokenId, attributes);
                
                const findAttribute = (type: string) => 
                    attributes?.find(a => a.trait_type === type)?.value;
                
                event.background = findAttribute('background');
                event.tail = findAttribute('tail');
                event.mane = findAttribute('mane');
                event.pattern = findAttribute('pattern');
                event.headAccessory = findAttribute('head accessory');
                event.bodyAccessory = findAttribute('body accessory');
                event.utility = findAttribute('utility');
                event.maneColor = findAttribute('mane color');
                event.patternColor = findAttribute('pattern color');
                event.hoofColor = findAttribute('hoof color');
                event.bodyColor = findAttribute('body color');
            }
        }
    } catch (e) {
        console.error('Error processing NFT metadata:', e);
    }
};

const runModule = (options: ModuleOptions) => {
    const { 
        app, io, web3, db,
        name, prefix, 
        deployed = 0, 
        increment = 1000, 
        eventsToWatch = ['Transfer'] 
    } = options;

    const Models: BaseModels = {} as BaseModels;
    
    // Initialize models with db connection
    const modelCreators = createModels(prefix, db);
    Object.keys(modelCreators).forEach((modelName, index) => {
        Models[modelName] = modelCreators[modelName];
        if (index === Object.keys(modelCreators).length - 1) {
            // Routes(app, name, Models);
            Socket(io, web3, name || '', Models);
        }
    });

    // Set up contract watching if available
    if (Object.keys(Contracts).length && 
        Contracts[Object.keys(Contracts)[0]].abi && 
        Contracts[Object.keys(Contracts)[0]].addr) {
        
        // Wait for MongoDB connection before starting event processing
        setTimeout(async () => {
            try {
                // Test MongoDB connection with a simple query
                await Models.Event.findOne().exec();
                
                const module: Module = { 
                    Contracts, 
                    Models, 
                    deployed,
                    increment,
                    eventsToWatch,
                    logEvent: async (event: any) => {
                        console.log('Logging event:', {
                            event: event.event,
                            tokenId: event.returnValues?.tokenId,
                            from: event.returnValues?.from,
                            to: event.returnValues?.to
                        });
                        return handleStandardERC721Event(event, processEvent, Models, web3);
                    }
                };
                
                console.log(`Starting event processing for ${name || 'default module'} from block ${deployed}`);
                getContractHistory(name || 'default module', module, eventsToWatch, web3);
            } catch (error) {
                console.error('MongoDB not ready yet, skipping event processing:', error);
            }
        }, 2000); // Give MongoDB 2 seconds to establish connection
    } else {
        console.log('no contract found to observe');
    }
};

export default runModule;
