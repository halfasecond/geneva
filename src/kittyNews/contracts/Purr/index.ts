import abi from './purr.json'
import claimAbi from './claim.json'
import claim2Abi from './claim2.json'

const { VITE_APP_CONTRACT_PURR, VITE_APP_CONTRACT_PURR_CLAIM, VITE_APP_CONTRACT_PURR_CLAIM2 } = import.meta.env
const MAINNET_PURR_CLAIM2 = '0x04ab1ffc02083acbd528ad782d564e2b19680edf'

const Purr = { abi, addr: VITE_APP_CONTRACT_PURR.toLowerCase() }
const PurrClaim = { abi: claimAbi, addr: VITE_APP_CONTRACT_PURR_CLAIM.toLowerCase() }
const PurrClaim2 = {
    abi: claim2Abi,
    addr: String(VITE_APP_CONTRACT_PURR_CLAIM2 || MAINNET_PURR_CLAIM2).toLowerCase(),
}

export default { Purr, PurrClaim, PurrClaim2 }