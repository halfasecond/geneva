import abi from './Core'
import claimAbi from './PurrClaim'

const VITE_APP_CONTRACT_PURR = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
const VITE_APP_CONTRACT_PURR_CLAIM='0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'

const Core = { abi, addr: VITE_APP_CONTRACT_PURR.toLowerCase() }
const PurrClaim = { abi: claimAbi, addr: VITE_APP_CONTRACT_PURR_CLAIM.toLowerCase() }

export default { Core, PurrClaim }