# Dapper Wallet (legacy) Escape Hatch POC:

Run the following 2 commands to deploy the contracts to your local hardhat test net

`npx hardhat ignition deploy ./ignition/modules/CryptoKitties.js --network localhost`
`npx hardhat ignition deploy ./ignition/modules/DapperWallet.js --network localhost`

Run the poc script:

`npx hardhat run ./scripts/escape-hatch.js --network localhost`


`npx hardhat ignition deploy ./ignition/modules/CryptoKitties.js --network localhost && npx hardhat ignition deploy ./ignition/modules/DapperWallet.js --network localhost && npx hardhat run ./scripts/escape-hatch.js --network localhost`

## Dramatis Personae

The script uses the first 3 hardhat testnet accounts to represent:

- the contract deployer
- the _authorized wallet address e.g a CryptoKitties collector
- co-signer e.g. Dapper Labs api

It then deploys a new Dapper wallet and sends a CryptoKitty to it.

## available accounts:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

Account #3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 (10000 ETH)
Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6

Account #4: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 (10000 ETH)
Private Key: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a

Account #5: 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc (10000 ETH)
Private Key: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba

Account #6: 0x976EA74026E726554dB657fA54763abd0C3a0aa9 (10000 ETH)
Private Key: 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e

Account #7: 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955 (10000 ETH)
Private Key: 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356

Account #8: 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f (10000 ETH)
Private Key: 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97

Account #9: 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720 (10000 ETH)
Private Key: 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6

Account #10: 0xBcd4042DE499D14e55001CcbB24a551F3b954096 (10000 ETH)
Private Key: 0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897

Account #11: 0x71bE63f3384f5fb98995898A86B02Fb2426c5788 (10000 ETH)
Private Key: 0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82

Account #12: 0xFABB0ac9d68B0B445fB7357272Ff202C5651694a (10000 ETH)
Private Key: 0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1

Account #13: 0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec (10000 ETH)
Private Key: 0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd

Account #14: 0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097 (10000 ETH)
Private Key: 0xc526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa

Account #15: 0xcd3B766CCDd6AE721141F452C550Ca635964ce71 (10000 ETH)
Private Key: 0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61

Account #16: 0x2546BcD3c84621e976D8185a91A922aE77ECEc30 (10000 ETH)
Private Key: 0xea6c44ac03bff858b476bba40716402b03e41b8e97e276d1baec7c37d42484a0

Account #17: 0xbDA5747bFD65F08deb54cb465eB87D40e51B197E (10000 ETH)
Private Key: 0x689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd

Account #18: 0xdD2FD4581271e230360230F9337D5c0430Bf44C0 (10000 ETH)
Private Key: 0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0

Account #19: 0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199 (10000 ETH)
Private Key: 0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e
```


// Dapper Wallet (i.e. a deployed wallet)

```
Function: supportsInterface
  Inputs: interfaceID (bytes4)
  Outputs:  (bool)
Function: ERC223_ID
  Inputs: 
  Outputs:  (bytes4)
Function: onERC721Received
  Inputs: _operator (address), _from (address), _tokenId (uint256), _data (bytes)
  Outputs:  (bytes4)
Function: initialized
  Inputs: 
  Outputs:  (bool)
Function: isValidSignature
  Inputs: hash (bytes32), _signature (bytes)
  Outputs:  (bytes4)
Function: EIP191_VERSION_DATA
  Inputs: 
  Outputs:  (bytes1)
Function: authorizations
  Inputs:  (uint256)
  Outputs:  (uint256)
Function: invoke2
  Inputs: v (uint8[2]), r (bytes32[2]), s (bytes32[2]), nonce (uint256), authorizedAddress (address), data (bytes)
  Outputs: 
Function: init
  Inputs: _authorizedAddress (address), _cosigner (uint256), _recoveryAddress (address)
  Outputs: 
Function: setRecoveryAddress
  Inputs: _recoveryAddress (address)
  Outputs: 
Function: invoke1SignerSends
  Inputs: v (uint8), r (bytes32), s (bytes32), data (bytes)
  Outputs: 
Function: recoveryAddress
  Inputs: 
  Outputs:  (address)
Function: emergencyRecovery
  Inputs: _authorizedAddress (address), _cosigner (uint256)
  Outputs: 
Function: AUTH_VERSION_INCREMENTOR
  Inputs: 
  Outputs:  (uint256)
Function: nonces
  Inputs:  (address)
  Outputs:  (uint256)
Function: setDelegate
  Inputs: _interfaceId (bytes4), _delegate (address)
  Outputs: 
Function: authVersion
  Inputs: 
  Outputs:  (uint256)
Function: COMPOSITE_PLACEHOLDER
  Inputs: 
  Outputs:  (address)
Function: invoke1CosignerSends
  Inputs: v (uint8), r (bytes32), s (bytes32), nonce (uint256), authorizedAddress (address), data (bytes)
  Outputs: 
Function: delegates
  Inputs:  (bytes4)
  Outputs:  (address)
Function: invoke0
  Inputs: data (bytes)
  Outputs: 
Function: setAuthorized
  Inputs: _authorizedAddress (address), _cosigner (uint256)
  Outputs: 
Function: tokenFallback
  Inputs: _from (address), _value (uint256), _data (bytes)
  Outputs: 
Function: EIP191_PREFIX
  Inputs: 
  Outputs:  (bytes1)
Function: recoverGas
  Inputs: _version (uint256), _keys (address[])
  Outputs: 
Function: onERC721Received
  Inputs: _from (address), _tokenId (uint256), data (bytes)
  Outputs:  (bytes4)
Function: VERSION
  Inputs: 
  Outputs:  (string)
Constructor:
  Inputs: 
Fallback function:
Event: Authorized
  Inputs: authorizedAddress (address), cosigner (uint256)
Event: EmergencyRecovery
  Inputs: authorizedAddress (address), cosigner (uint256)
Event: RecoveryAddressChanged
  Inputs: previousRecoveryAddress (address), newRecoveryAddress (address)
Event: Received
  Inputs: from (address), value (uint256)
Event: InvocationSuccess
  Inputs: hash (bytes32), result (uint256), numOperations (uint256)
Event: DelegateUpdated
  Inputs: interfaceId (bytes4), delegate (address)
```

## Cloneable wallet methods & events:

```
Function: supportsInterface
  Inputs: interfaceID (bytes4)
  Outputs:  (bool)
Function: ERC223_ID
  Inputs: 
  Outputs:  (bytes4)
Function: onERC721Received
  Inputs: _operator (address), _from (address), _tokenId (uint256), _data (bytes)
  Outputs:  (bytes4)
Function: initialized
  Inputs: 
  Outputs:  (bool)
Function: isValidSignature
  Inputs: hash (bytes32), _signature (bytes)
  Outputs:  (bytes4)
Function: EIP191_VERSION_DATA
  Inputs: 
  Outputs:  (bytes1)
Function: authorizations
  Inputs:  (uint256)
  Outputs:  (uint256)
Function: invoke2
  Inputs: v (uint8[2]), r (bytes32[2]), s (bytes32[2]), nonce (uint256), authorizedAddress (address), data (bytes)
  Outputs: 
Function: init
  Inputs: _authorizedAddress (address), _cosigner (uint256), _recoveryAddress (address)
  Outputs: 
Function: setRecoveryAddress
  Inputs: _recoveryAddress (address)
  Outputs: 
Function: invoke1SignerSends
  Inputs: v (uint8), r (bytes32), s (bytes32), data (bytes)
  Outputs: 
Function: recoveryAddress
  Inputs: 
  Outputs:  (address)
Function: emergencyRecovery
  Inputs: _authorizedAddress (address), _cosigner (uint256)
  Outputs: 
Function: AUTH_VERSION_INCREMENTOR
  Inputs: 
  Outputs:  (uint256)
Function: nonces
  Inputs:  (address)
  Outputs:  (uint256)
Function: setDelegate
  Inputs: _interfaceId (bytes4), _delegate (address)
  Outputs: 
Function: authVersion
  Inputs: 
  Outputs:  (uint256)
Function: COMPOSITE_PLACEHOLDER
  Inputs: 
  Outputs:  (address)
Function: invoke1CosignerSends
  Inputs: v (uint8), r (bytes32), s (bytes32), nonce (uint256), authorizedAddress (address), data (bytes)
  Outputs: 
Function: delegates
  Inputs:  (bytes4)
  Outputs:  (address)
Function: invoke0
  Inputs: data (bytes)
  Outputs: 
Function: setAuthorized
  Inputs: _authorizedAddress (address), _cosigner (uint256)
  Outputs: 
Function: tokenFallback
  Inputs: _from (address), _value (uint256), _data (bytes)
  Outputs: 
Function: EIP191_PREFIX
  Inputs: 
  Outputs:  (bytes1)
Function: recoverGas
  Inputs: _version (uint256), _keys (address[])
  Outputs: 
Function: onERC721Received
  Inputs: _from (address), _tokenId (uint256), data (bytes)
  Outputs:  (bytes4)
Function: VERSION
  Inputs: 
  Outputs:  (string)
Constructor:
  Inputs: 
Fallback function:
Event: Authorized
  Inputs: authorizedAddress (address), cosigner (uint256)
Event: EmergencyRecovery
  Inputs: authorizedAddress (address), cosigner (uint256)
Event: RecoveryAddressChanged
  Inputs: previousRecoveryAddress (address), newRecoveryAddress (address)
Event: Received
  Inputs: from (address), value (uint256)
Event: InvocationSuccess
  Inputs: hash (bytes32), result (uint256), numOperations (uint256)
Event: DelegateUpdated
  Inputs: interfaceId (bytes4), delegate (address)
```

// ethers.js v6

```
{
  version: '6.13.2',
  decodeBytes32String: [Function: decodeBytes32String],
  encodeBytes32String: [Function: encodeBytes32String],
  AbiCoder: [class AbiCoder],
  ConstructorFragment: [class ConstructorFragment extends Fragment],
  ErrorFragment: [class ErrorFragment extends NamedFragment],
  EventFragment: [class EventFragment extends NamedFragment],
  Fragment: [class Fragment],
  FallbackFragment: [class FallbackFragment extends Fragment],
  FunctionFragment: [class FunctionFragment extends NamedFragment],
  NamedFragment: [class NamedFragment extends Fragment],
  ParamType: [class ParamType],
  StructFragment: [class StructFragment extends NamedFragment],
  checkResultErrors: [Function: checkResultErrors],
  ErrorDescription: [class ErrorDescription],
  Indexed: [class Indexed],
  Interface: [class Interface],
  LogDescription: [class LogDescription],
  Result: [class Result extends Array],
  TransactionDescription: [class TransactionDescription],
  Typed: [class Typed],
  getAddress: [Function: getAddress],
  getIcapAddress: [Function: getIcapAddress],
  getCreateAddress: [Function: getCreateAddress],
  getCreate2Address: [Function: getCreate2Address],
  isAddressable: [Function: isAddressable],
  isAddress: [Function: isAddress],
  resolveAddress: [Function: resolveAddress],
  ZeroAddress: '0x0000000000000000000000000000000000000000',
  WeiPerEther: 1000000000000000000n,
  MaxUint256: 115792089237316195423570985008687907853269984665640564039457584007913129639935n,
  MinInt256: -57896044618658097711785492504343953926634992332820282019728792003956564819968n,
  MaxInt256: 57896044618658097711785492504343953926634992332820282019728792003956564819967n,
  N: 115792089237316195423570985008687907852837564279074904382605163141518161494337n,
  ZeroHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  EtherSymbol: 'Ξ',
  MessagePrefix: '\x19Ethereum Signed Message:\n',
  BaseContract: [class BaseContract],
  Contract: [Function: Contract],
  ContractFactory: [class ContractFactory],
  ContractEventPayload: [class ContractEventPayload extends ContractUnknownEventPayload],
  ContractTransactionReceipt: [class ContractTransactionReceipt extends TransactionReceipt],
  ContractTransactionResponse: [class ContractTransactionResponse extends TransactionResponse],
  ContractUnknownEventPayload: [class ContractUnknownEventPayload extends EventPayload],
  EventLog: [class EventLog extends Log],
  UndecodedEventLog: [class UndecodedEventLog extends Log],
  computeHmac: [Function: computeHmac] {
    _: [Function: _computeHmac],
    lock: [Function (anonymous)],
    register: [Function (anonymous)]
  },
  randomBytes: [Function: randomBytes] {
    _: [Function: _randomBytes],
    lock: [Function (anonymous)],
    register: [Function (anonymous)]
  },
  defaultAbiCoder: [Function: keccak256] {
    _: [Function: _keccak256],
    lock: [Function (anonymous)],
    register: [Function (anonymous)]
  },
  ripemd160: [Function: ripemd160] {
    _: [Function: _ripemd160],
    lock: [Function (anonymous)],
    register: [Function (anonymous)]
  },
  sha256: [Function: sha256] {
    _: [Function: _sha256],
    lock: [Function (anonymous)],
    register: [Function (anonymous)]
  },
  sha512: [Function: sha512] {
    _: [Function: _sha512],
    lock: [Function (anonymous)],
    register: [Function (anonymous)]
  },
  pbkdf2: [Function: pbkdf2] {
    _: [Function: _pbkdf2],
    lock: [Function (anonymous)],
    register: [Function (anonymous)]
  },
  scrypt: [AsyncFunction: scrypt] {
    _: [AsyncFunction: _scryptAsync],
    lock: [Function (anonymous)],
    register: [Function (anonymous)]
  },
  scryptSync: [Function: scryptSync] {
    _: [Function: _scryptSync],
    lock: [Function (anonymous)],
    register: [Function (anonymous)]
  },
  lock: [Function: lock],
  Signature: [class Signature],
  SigningKey: [class SigningKey],
  id: [Function: id],
  ensNormalize: [Function: ensNormalize],
  isValidName: [Function: isValidName],
  namehash: [Function: namehash],
  dnsEncode: [Function: dnsEncode],
  hashMessage: [Function: hashMessage],
  verifyMessage: [Function: verifyMessage],
  solidityPacked: [Function: solidityPacked],
  solidityPackedKeccak256: [Function: solidityPackedKeccak256],
  solidityPackedSha256: [Function: solidityPackedSha256],
  TypedDataEncoder: [class TypedDataEncoder],
  verifyTypedData: [Function: verifyTypedData],
  getDefaultProvider: [Function: getDefaultProvider],
  Block: [class Block],
  FeeData: [class FeeData],
  Log: [class Log],
  TransactionReceipt: [class TransactionReceipt],
  TransactionResponse: [class TransactionResponse],
  AbstractSigner: [class AbstractSigner],
  NonceManager: [class NonceManager extends AbstractSigner],
  VoidSigner: [class VoidSigner extends AbstractSigner],
  AbstractProvider: [class AbstractProvider],
  FallbackProvider: [class FallbackProvider extends AbstractProvider],
  JsonRpcApiProvider: [class JsonRpcApiProvider extends AbstractProvider],
  JsonRpcProvider: [class JsonRpcProvider extends JsonRpcApiPollingProvider],
  JsonRpcSigner: [class JsonRpcSigner extends AbstractSigner],
  BrowserProvider: [class BrowserProvider extends JsonRpcApiPollingProvider],
  AlchemyProvider: [class AlchemyProvider extends JsonRpcProvider],
  AnkrProvider: [class AnkrProvider extends JsonRpcProvider],
  ChainstackProvider: [class ChainstackProvider extends JsonRpcProvider],
  CloudflareProvider: [class CloudflareProvider extends JsonRpcProvider],
  EtherscanProvider: [class EtherscanProvider extends AbstractProvider],
  InfuraProvider: [class InfuraProvider extends JsonRpcProvider],
  InfuraWebSocketProvider: [class InfuraWebSocketProvider extends WebSocketProvider],
  PocketProvider: [class PocketProvider extends JsonRpcProvider],
  QuickNodeProvider: [class QuickNodeProvider extends JsonRpcProvider],
  IpcSocketProvider: [class IpcSocketProvider extends SocketProvider],
  SocketProvider: [class SocketProvider extends JsonRpcApiProvider],
  WebSocketProvider: [class WebSocketProvider extends SocketProvider],
  EnsResolver: [class EnsResolver],
  Network: [class Network],
  EnsPlugin: [class EnsPlugin extends NetworkPlugin],
  EtherscanPlugin: [class EtherscanPlugin extends NetworkPlugin],
  FeeDataNetworkPlugin: [class FeeDataNetworkPlugin extends NetworkPlugin],
  FetchUrlFeeDataNetworkPlugin: [class FetchUrlFeeDataNetworkPlugin extends NetworkPlugin],
  GasCostPlugin: [class GasCostPlugin extends NetworkPlugin],
  NetworkPlugin: [class NetworkPlugin],
  MulticoinProviderPlugin: [class MulticoinProviderPlugin],
  SocketBlockSubscriber: [class SocketBlockSubscriber extends SocketSubscriber],
  SocketEventSubscriber: [class SocketEventSubscriber extends SocketSubscriber],
  SocketPendingSubscriber: [class SocketPendingSubscriber extends SocketSubscriber],
  SocketSubscriber: [class SocketSubscriber],
  UnmanagedSubscriber: [class UnmanagedSubscriber],
  copyRequest: [Function: copyRequest],
  showThrottleMessage: [Function: showThrottleMessage],
  accessListify: [Function: accessListify],
  computeAddress: [Function: computeAddress],
  recoverAddress: [Function: recoverAddress],
  Transaction: [class Transaction],
  decodeBase58: [Function: decodeBase58],
  encodeBase58: [Function: encodeBase58],
  decodeBase64: [Function: decodeBase64],
  encodeBase64: [Function: encodeBase64],
  concat: [Function: concat],
  dataLength: [Function: dataLength],
  dataSlice: [Function: dataSlice],
  getBytes: [Function: getBytes],
  getBytesCopy: [Function: getBytesCopy],
  hexlify: [Function: hexlify],
  isHexString: [Function: isHexString],
  isBytesLike: [Function: isBytesLike],
  stripZerosLeft: [Function: stripZerosLeft],
  zeroPadBytes: [Function: zeroPadBytes],
  zeroPadValue: [Function: zeroPadValue],
  defineProperties: [Function: defineProperties],
  resolveProperties: [AsyncFunction: resolveProperties],
  assert: [Function: assert],
  assertArgument: [Function: assertArgument],
  assertArgumentCount: [Function: assertArgumentCount],
  assertNormalize: [Function: assertNormalize],
  assertPrivate: [Function: assertPrivate],
  makeError: [Function: makeError],
  isCallException: [Function: isCallException],
  isError: [Function: isError],
  EventPayload: [class EventPayload],
  FetchRequest: [class FetchRequest],
  FetchResponse: [class FetchResponse],
  FetchCancelSignal: [class FetchCancelSignal],
  FixedNumber: [class FixedNumber],
  getBigInt: [Function: getBigInt],
  getNumber: [Function: getNumber],
  getUint: [Function: getUint],
  toBeArray: [Function: toBeArray],
  toBigInt: [Function: toBigInt],
  toBeHex: [Function: toBeHex],
  toNumber: [Function: toNumber],
  toQuantity: [Function: toQuantity],
  fromTwos: [Function: fromTwos],
  toTwos: [Function: toTwos],
  mask: [Function: mask],
  formatEther: [Function: formatEther],
  parseEther: [Function: parseEther],
  formatUnits: [Function: formatUnits],
  parseUnits: [Function: parseUnits],
  toUtf8Bytes: [Function: toUtf8Bytes],
  toUtf8CodePoints: [Function: toUtf8CodePoints],
  toUtf8String: [Function: toUtf8String],
  Utf8ErrorFuncs: {
    error: [Function: errorFunc],
    ignore: [Function: ignoreFunc],
    replace: [Function: replaceFunc]
  },
  decodeRlp: [Function: decodeRlp],
  encodeRlp: [Function: encodeRlp],
  uuidV4: [Function: uuidV4],
  Mnemonic: [class Mnemonic],
  BaseWallet: [class BaseWallet extends AbstractSigner],
  HDNodeWallet: [class HDNodeWallet extends BaseWallet],
  HDNodeVoidWallet: [class HDNodeVoidWallet extends VoidSigner],
  Wallet: [class Wallet extends BaseWallet],
  defaultPath: "m/44'/60'/0'/0/0",
  getAccountPath: [Function: getAccountPath],
  getIndexedAccountPath: [Function: getIndexedAccountPath],
  isCrowdsaleJson: [Function: isCrowdsaleJson],
  isKeystoreJson: [Function: isKeystoreJson],
  decryptCrowdsaleJson: [Function: decryptCrowdsaleJson],
  decryptKeystoreJsonSync: [Function: decryptKeystoreJsonSync],
  decryptKeystoreJson: [AsyncFunction: decryptKeystoreJson],
  encryptKeystoreJson: [AsyncFunction: encryptKeystoreJson],
  encryptKeystoreJsonSync: [Function: encryptKeystoreJsonSync],
  Wordlist: [class Wordlist],
  LangEn: [class LangEn extends WordlistOwl],
  WordlistOwl: [class WordlistOwl extends Wordlist],
  WordlistOwlA: [class WordlistOwlA extends WordlistOwl],
  wordlists: {
    cz: LangCz { locale: 'cz' },
    en: LangEn { locale: 'en' },
    es: LangEs { locale: 'es' },
    fr: LangFr { locale: 'fr' },
    it: LangIt { locale: 'it' },
    pt: LangPt { locale: 'pt' },
    ja: LangJa { locale: 'ja' },
    ko: LangKo { locale: 'ko' },
    zh_cn: LangZh { locale: 'zh_cn' },
    zh_tw: LangZh { locale: 'zh_tw' }
  },
  provider: HardhatEthersProvider {
    _hardhatProvider: LazyInitializationProviderAdapter {
      _providerFactory: [AsyncFunction (anonymous)],
      _emitter: [EventEmitter]
    },
    _networkName: 'localhost',
    _blockListeners: [],
    _transactionHashListeners: Map(0) {},
    _eventListeners: []
  },
  getSigner: [Function: getSigner],
  getSigners: [Function: getSigners],
  getImpersonatedSigner: [Function: getImpersonatedSigner],
  getContractFactory: [Function: bound getContractFactory] AsyncFunction,
  getContractFactoryFromArtifact: [Function: getContractFactoryFromArtifact],
  getContractAt: [Function: getContractAt],
  getContractAtFromArtifact: [Function: getContractAtFromArtifact],
  deployContract: [Function: bound deployContract] AsyncFunction
}
```

## available accounts:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

Account #3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 (10000 ETH)
Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6

Account #4: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 (10000 ETH)
Private Key: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a

Account #5: 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc (10000 ETH)
Private Key: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba

Account #6: 0x976EA74026E726554dB657fA54763abd0C3a0aa9 (10000 ETH)
Private Key: 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e

Account #7: 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955 (10000 ETH)
Private Key: 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356

Account #8: 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f (10000 ETH)
Private Key: 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97

Account #9: 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720 (10000 ETH)
Private Key: 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6

Account #10: 0xBcd4042DE499D14e55001CcbB24a551F3b954096 (10000 ETH)
Private Key: 0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897

Account #11: 0x71bE63f3384f5fb98995898A86B02Fb2426c5788 (10000 ETH)
Private Key: 0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82

Account #12: 0xFABB0ac9d68B0B445fB7357272Ff202C5651694a (10000 ETH)
Private Key: 0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1

Account #13: 0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec (10000 ETH)
Private Key: 0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd

Account #14: 0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097 (10000 ETH)
Private Key: 0xc526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa

Account #15: 0xcd3B766CCDd6AE721141F452C550Ca635964ce71 (10000 ETH)
Private Key: 0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61

Account #16: 0x2546BcD3c84621e976D8185a91A922aE77ECEc30 (10000 ETH)
Private Key: 0xea6c44ac03bff858b476bba40716402b03e41b8e97e276d1baec7c37d42484a0

Account #17: 0xbDA5747bFD65F08deb54cb465eB87D40e51B197E (10000 ETH)
Private Key: 0x689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd

Account #18: 0xdD2FD4581271e230360230F9337D5c0430Bf44C0 (10000 ETH)
Private Key: 0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0

Account #19: 0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199 (10000 ETH)
Private Key: 0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e
```
