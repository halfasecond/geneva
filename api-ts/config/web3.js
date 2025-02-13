import Web3 from 'web3';

const createWeb3Connection = (provider) => {
  const web3 = new Web3(new Web3.providers.WebsocketProvider(provider, {
    clientConfig: {
      maxReceivedFrameSize: 100000000,
      maxReceivedMessageSize: 100000000,
    },
    reconnect: {
      auto: true,
      delay: 5000, // Adjust the delay as needed
      maxAttempts: Infinity, // Retry indefinitely or set a specific number of attempts
      onTimeout: false,
    },
  }));

  web3.currentProvider.on('error', (error) => {
    console.error('WebSocket Connection Error:', error);
    // Handle error or reconnect logic here
  });

  web3.currentProvider.on('connect', () => {
    console.log('WebSocket Connection Established');
  });

  return web3;
};

export default createWeb3Connection;