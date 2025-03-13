import abi from './Core';

interface Contract {
    abi: any[];
    addr: string;
}

interface Contracts {
    Core: Contract;
}

const Core: Contract = { 
    abi, 
    addr: "0xf7503bea549e73c0f260e42c088568fd865a358a" 
};

const contracts: Contracts = { Core };

export default contracts;
