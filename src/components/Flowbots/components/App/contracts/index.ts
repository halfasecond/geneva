import Core from './flowbots/Core.json'
import Auction from './flowbots/Auction.json'

const Contracts = {
    flowbots: {
        core: {
            addr: "0x04F339eC4D75Cf2833069e6e61b60eF56461CD7C".toLowerCase(),
            abi: Core.abi
        },
        auction: {
            addr: "0x3de00f44ce68FC56DB0e0E33aD4015C6e78eCB39".toLowerCase(),
            abi: Auction.abi
        }
    },
}

export default Contracts