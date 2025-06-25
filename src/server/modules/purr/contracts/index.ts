import abi from './Core'
import claimAbi from './PurrClaim'

const VITE_APP_CONTRACT_PURR = '0x74E9C7f23f11B72b8A7340E11Fe72D93D91fAe8e'
const VITE_APP_CONTRACT_PURR_CLAIM='0x0822465a4Ab614bcC53Efc4AA426729bF5D4C65f'

const Core = { abi, addr: VITE_APP_CONTRACT_PURR.toLowerCase() }
const PurrClaim = { abi: claimAbi, addr: VITE_APP_CONTRACT_PURR_CLAIM.toLowerCase() }

export default { Core, PurrClaim }