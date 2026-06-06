import * as fcl from '@onflow/fcl';

const flowConfig = {
  testnet: {
    'accessNode.api': 'https://access-testnet.onflow.org',
    'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
    'discovery.authn.endpoint': 'https://fcl-discovery.onflow.org/api/testnet/authn',
    'discovery.authn.include': ['0x82ec283f88a62e65'], // Dapper Wallet testnet
    'app.detail.title': 'CryptoKitties on FLOW TESTNET',
    '0xFungibleToken': '0x9a0766d93b6608b7',
    '0xNonFungibleToken': '0x631e88ae7f1d7c20',
    '0xNFTCatalog': '0x324c34e1c517e4db',
    '0xMetadataViews': '0x631e88ae7f1d7c20',
    '0xNFTRetrieval': '0x324c34e1c517e4db',
  },
  mainnet: {
    'accessNode.api': 'https://rest-mainnet.onflow.org',
    'discovery.wallet': 'https://fcl-discovery.onflow.org/authn',
    'discovery.authn.endpoint': 'https://fcl-discovery.onflow.org/api/authn',
    'discovery.authn.include': ['0xead892083b3e2c6c'], // Dapper Wallet mainnet
    'app.detail.title': 'CryptoKitties on FLOW MAINNET',
    '0xFungibleToken': '0xf233dcee88fe0abe',
    '0xNonFungibleToken': '0x1d7e57aa55817448',
    '0xNFTCatalog': '0x49a7cda3a1eecc29',
    '0xMetadataViews': '0x1d7e57aa55817448',
    '0xNFTRetrieval': '0x49a7cda3a1eecc29',
  },
};

fcl.config({
  ...flowConfig['testnet'],
  'app.detail.icon': 'https://www.cryptokitties.co/images/icons/normal.svg',
});

export function getFcl() {
  return fcl;
}