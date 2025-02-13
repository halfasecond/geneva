import { decode } from 'js-base64'
import _Models from './models'
import Routes from './routes'
import Contracts from './contracts'
import Socket from './socket'
import { getContractHistory, handleStandardERC721Event } from '../utils'

const processEvent = async (event, web3) => {
    const contract = new web3.eth.Contract(Contracts.Core.abi, Contracts.Core.addr)
    const svg = await contract.methods.tokenSVG(event.tokenId).call().catch(e => console.log(e))
    event.svg = svg
    const info = await contract.methods.tokenURI(event.tokenId).call().catch(e => console.log(e))
    const { attributes } = JSON.parse(decode(info.split(',')[1]))
    if (attributes.find(a => a.trait_type === 'background')) {
        event.background = attributes.find(a => a.trait_type === 'background').value
        event.tail= attributes.find(a => a.trait_type === 'tail').value
        event.mane = attributes.find(a => a.trait_type === 'mane').value
        event.pattern = attributes.find(a => a.trait_type === 'pattern').value
        event.headAccessory = attributes.find(a => a.trait_type === 'head accessory').value
        event.bodyAccessory = attributes.find(a => a.trait_type === 'body accessory').value
        event.utility = attributes.find(a => a.trait_type === 'utility').value
        event.maneColor = attributes.find(a => a.trait_type === 'mane color').value
        event.patternColor = attributes.find(a => a.trait_type === 'pattern color').value
        event.hoofColor = attributes.find(a => a.trait_type === 'hoof color').value
        event.bodyColor = attributes.find(a => a.trait_type === 'body color').value
    }
    return event
}

const logEvent = async (event, Models, web3) => handleStandardERC721Event(event, processEvent, Models, web3)

const runModule = (app, io, web3, config) => {
    const { name, prefix, deployed, increment, eventsToWatch } = config
    const Models = {}
    Object.keys(_Models).map((m, i) => {
        Models[m] = _Models[m](prefix)
        if (i === Object.keys(_Models).length - 1) {
            // Routes(app, name, Models)
            Socket(io, web3, name ? name : '', Models)
        }
    })
    if (Object.keys(Contracts) && Contracts[Object.keys(Contracts)[0]].abi && Contracts[Object.keys(Contracts)[0]].addr) {
        const module = { Contracts, Models, deployed, increment, eventsToWatch, logEvent: event => logEvent(event, Models, web3) }
        getContractHistory(name === undefined ? 'default module' : name, module, eventsToWatch, web3)
    } else {
        console.log('no contract found to observe')
    }
}

export default runModule