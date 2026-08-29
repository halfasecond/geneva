import abi from './Core'
const { VITE_APP_CONTRACT_BARCODE } = process.env
const Core = { abi, addr: (VITE_APP_CONTRACT_BARCODE || '0x0000000000000000000000000000000000000000').toLowerCase() }

export default { Core }