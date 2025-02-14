import type Web3 from 'web3';

declare module '../../api-ts/config/web3.js' {
    export default function createWeb3Connection(socketUrl: string): Web3;
}

export {};
