export interface RequestArguments {
  method: string;
  params?: unknown[] | object;
}

export interface ProviderRpcError extends Error {
  code: number;
  data?: unknown;
}

export interface ProviderMessage {
  type: string;
  data: unknown;
}

// Base provider interface matching the minimum required functionality
export interface EIP1193Provider {
  request(args: RequestArguments): Promise<unknown>;
  on(eventName: string, handler: (payload: any) => void): void;
  off(eventName: string, handler: (payload: any) => void): void;
}

// Extended provider interface including optional wallet-specific features
export interface ExtendedProvider extends EIP1193Provider {
  enable?: () => Promise<string[]>;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  chainId?: string;
}

export interface EIP1193Events {
  connect: { chainId: string };
  disconnect: ProviderRpcError;
  chainChanged: string;
  accountsChanged: string[];
  message: ProviderMessage;
}

// Standard Ethereum JSON-RPC methods
export enum RpcMethod {
  RequestAccounts = 'eth_requestAccounts',
  Accounts = 'eth_accounts',
  ChainId = 'eth_chainId',
  PersonalSign = 'personal_sign'
}

// Standard Ethereum events
export enum ProviderEvent {
  Connect = 'connect',
  Disconnect = 'disconnect',
  ChainChanged = 'chainChanged',
  AccountsChanged = 'accountsChanged',
  Message = 'message'
}

// Chain IDs for common networks
export enum ChainId {
  Mainnet = '0x1',
  Goerli = '0x5',
  Sepolia = '0xaa36a7'
}

// Type guard to check if a provider implements the EIP-1193 interface
export function isEIP1193Provider(provider: any): provider is EIP1193Provider {
  return (
    provider &&
    typeof provider.request === 'function' &&
    typeof provider.on === 'function' &&
    typeof provider.off === 'function'
  );
}