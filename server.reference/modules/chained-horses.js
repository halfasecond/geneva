import { decode } from 'js-base64'

import Models from '../models/chained-horse'
import Routes from '../routes/chained-horse'
import Contracts from '../contracts/chained-horse'

const increment = 2500 // how many blocks per query when looking for past events
const Deployed = 13504887 // 13504887 = deployed.

const logEvent = async (event, web3, saveEvent) => {
    const contract = new web3.eth.Contract(Contracts.Core.abi, Contracts.Core.addr)
    const { Event, Birth, Owner } = Models
    const _event = {
        logIndex: Number(event.logIndex),
        transactionIndex: Number(event.transactionIndex),
        transactionHash: event.transactionHash,
        blockHash: event.blockHash,
        blockNumber: Number(event.blockNumber),
        address: event.address,
        id: event.id,
        signature: event.signature,
        data: event.raw && event.raw.data ? event.raw.data : event.data,
        topics: event.raw && event.raw.topics ? event.raw.topics : event.topics,
    }
  
    if (event.returnValues.tokenId !== undefined && event.returnValues.tokenId !== null) { _event.tokenId = Number(event.returnValues.tokenId) }
    console.log(_event.tokenId, typeof _event.tokenId)
    if (event.returnValues.from) { _event.from = event.returnValues.from.toLowerCase() }
    if (event.returnValues.to) { _event.to = event.returnValues.to.toLowerCase() }
    if (event.returnValues.owner) { _event.owner = event.returnValues.owner }
    if (event.returnValues.operator) { _event.owner = event.returnValues.operator }
    if (event.returnValues.approved) { _event.approved = event.returnValues.approved }
    const { timestamp } = await web3.eth.getBlock(_event.blockNumber);
    _event.timestamp = Number(timestamp);
    if (event.event === "Transfer") {
      if (_event.from === '0x0000000000000000000000000000000000000000') {
          _event.owner = _event.to
          _event.owners = [_event.to];
          const svg = await contract.methods.tokenSVG(_event.tokenId).call().catch(e => console.log(e))
          _event.svg = svg
          const info = await contract.methods.tokenURI(_event.tokenId).call().catch(e => console.log(e))
          const { attributes }  = JSON.parse(decode(info.split(',')[1]))
          if (attributes.find(a => a.trait_type === 'background')) {
              _event.background = attributes.find(a => a.trait_type === 'background').value
              _event.tail= attributes.find(a => a.trait_type === 'tail').value
              _event.mane = attributes.find(a => a.trait_type === 'mane').value
              _event.pattern = attributes.find(a => a.trait_type === 'pattern').value
              _event.headAccessory = attributes.find(a => a.trait_type === 'head accessory').value
              _event.bodyAccessory = attributes.find(a => a.trait_type === 'body accessory').value
              _event.utility = attributes.find(a => a.trait_type === 'utility').value
              _event.maneColor = attributes.find(a => a.trait_type === 'mane color').value
              _event.patternColor = attributes.find(a => a.trait_type === 'pattern color').value
              _event.hoofColor = attributes.find(a => a.trait_type === 'hoof color').value
              _event.bodyColor = attributes.find(a => a.trait_type === 'body color').value
          }
          await new Birth(_event).save();
          const record = await Owner.findOneAndUpdate(
              { owner: _event.to },
              { $inc: { balance: 1 }},
              { upsert: true }
          ).exec();
      } else {
        if (_event.from !== '0x0000000000000000000000000000000000000000') {
          const record = await Birth.findOneAndUpdate(
              { tokenId: _event.tokenId },
              { owner: _event.to, $addToSet: { owners: _event.to } },
              { upsert: false }
          ).exec();
          const record2 = await Owner.findOneAndUpdate(
              { owner: _event.from },
              { $inc: { balance: -1 }},
              { upsert: false }
          ).exec();
          const record3 = await Owner.findOneAndUpdate(
              { owner: _event.to },
              { $inc: { balance: 1 }},
              { upsert: true }
          ).exec();
        }
      }
      
      
    }
    if (saveEvent) {
        _event.event = event.event // yup...
        const _Event = new Event(_event) // :/
        const record = await _Event.save();
    }
};

export default { Models, Routes, Contracts, Deployed, increment, logEvent }