import coreAbi from './core.json'
import saleAbi from './sale.json'
import sireAbi from './sire.json'

const { VITE_APP_CONTRACT_CRYPTOKITTIES } = import.meta.env

const Core = { abi: coreAbi, addr: VITE_APP_CONTRACT_CRYPTOKITTIES.toLowerCase() }
const Sale = { abi: saleAbi, addr: '0xb1690C08E213a35Ed9bAb7B318DE14420FB57d8C'.toLowerCase() }
const Sire = { abi: sireAbi, addr: '0xC7af99Fe5513eB6710e6D5f44F9989dA40F27F26'.toLowerCase() }


export default { Core, Sale, Sire }