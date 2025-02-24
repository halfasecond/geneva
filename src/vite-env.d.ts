/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENDPOINT: string
  readonly VITE_APP_CHAIN_ID: string
  readonly VITE_APP_TOKEN_NAME: string
  readonly VITE_APP_NODE_ENV: string
  readonly VITE_APP_GAME_SERVER_URL: string
  readonly VITE_APP_GITHUB_PROJECT_NUMBER: string
  readonly VITE_SERVERLESS: string
  readonly BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

type EthereumEventMap = {
  accountsChanged: string[];
  chainChanged: string;
  connect: { chainId: string };
  disconnect: { code: number; message: string };
};

type EthereumEventHandler<K extends keyof EthereumEventMap> = (payload: EthereumEventMap[K]) => void;

interface Ethereum {
  isMetaMask?: boolean;
  isDapper?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  enable: () => Promise<string[]>;
  on<K extends keyof EthereumEventMap>(event: K, handler: EthereumEventHandler<K>): void;
  off<K extends keyof EthereumEventMap>(event: K, handler: EthereumEventHandler<K>): void;
  removeListener<K extends keyof EthereumEventMap>(event: K, handler: EthereumEventHandler<K>): void;
  addListener<K extends keyof EthereumEventMap>(event: K, handler: EthereumEventHandler<K>): void;
  chainId?: string;
}

interface Window {
  ethereum?: Ethereum;
}
