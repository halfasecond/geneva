import abi from './purr.json'
import claimAbi from './claim.json'

const { VITE_APP_CONTRACT_PURR, VITE_APP_CONTRACT_PURR_CLAIM } = import.meta.env

const Purr = { abi, addr: VITE_APP_CONTRACT_PURR.toLowerCase() }
const PurrClaim = { abi: claimAbi, addr: VITE_APP_CONTRACT_PURR_CLAIM.toLowerCase() }

export default { Purr, PurrClaim }