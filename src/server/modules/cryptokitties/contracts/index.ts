import abi from './Core';
import saleAbi from './Sale';
import sireAbi from './Sire';

interface Contract {
    abi: unknown[];
    addr: string;
}

export interface CryptoKittiesContracts {
    Core: Contract;
    Sale: Contract;
    Sire: Contract;
}

const Core: Contract = {
    abi,
    addr: '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d'.toLowerCase(),
};

const Sale: Contract = {
    abi: saleAbi,
    addr: '0xb1690C08E213a35Ed9bAb7B318DE14420FB57d8C'.toLowerCase(),
};

const Sire: Contract = {
    abi: sireAbi,
    addr: '0xC7af99Fe5513eB6710e6D5f44F9989dA40F27F26'.toLowerCase(),
};

const Contracts: CryptoKittiesContracts = { Core, Sale, Sire };

export default Contracts;