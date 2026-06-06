import abi from './Core'
const { VITE_APP_CONTRACT_BARCODE } = process.env
const Core = { abi, addr: VITE_APP_CONTRACT_BARCODE.toLowerCase() }

export default { Core }