import abi from './purr.json'
import claimAbi from './claim.json'
import claim2Abi from './claim2.json'

const { VITE_APP_CONTRACT_PURR, VITE_APP_CONTRACT_PURR_CLAIM, VITE_APP_CONTRACT_PURR_CLAIM2 } = import.meta.env

// Mainnet fallbacks if env is unset.
const MAINNET_PURR = '0x74E9C7f23f11B72b8A7340E11Fe72D93D91fAe8e'
const MAINNET_PURR_CLAIM = '0x0822465a4Ab614bcC53Efc4AA426729bF5D4C65f'
const MAINNET_PURR_CLAIM2 = '0x04ab1ffc02083acbd528ad782d564e2b19680edf'

const Purr = { abi, addr: String(VITE_APP_CONTRACT_PURR || MAINNET_PURR).toLowerCase() }
const PurrClaim = { abi: claimAbi, addr: String(VITE_APP_CONTRACT_PURR_CLAIM || MAINNET_PURR_CLAIM).toLowerCase() }
const PurrClaim2 = { abi: claim2Abi, addr: String(VITE_APP_CONTRACT_PURR_CLAIM2 || MAINNET_PURR_CLAIM2).toLowerCase() }

export default { Purr, PurrClaim, PurrClaim2 }