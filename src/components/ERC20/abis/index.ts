import { abi as wckAbi } from './wck.json'

interface Abi {
    address: string;
    abi: any
  }

const abis: { [key: string]: Abi } = {
    'wck': {
        address: '0x09fE5f0236F0Ea5D930197DCE254d77B04128075',
        abi: wckAbi
    },
    'wg0': {
        address: '0xd00ed1098180b1d6ed42b066555ab065c4515493',
        abi: wckAbi
    },
    'wvg0': {
        address: '0x25c7b64a93eb1261e130ec21a3e9918caa38b611',
        abi: wckAbi
    }
}

export default abis