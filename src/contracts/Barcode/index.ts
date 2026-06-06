import coreAbi from './core.json'

const { VITE_APP_CONTRACT_BARCODE } = import.meta.env

const Core = { abi: coreAbi, addr: VITE_APP_CONTRACT_BARCODE.toLowerCase() }

export default { Core }