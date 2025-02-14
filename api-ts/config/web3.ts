import Web3 from 'web3';

const createWeb3Connection = (wsProvider: string): any => {
  const web3: any = new (Web3 as any)(
    new (Web3 as any).providers.WebsocketProvider(wsProvider, {
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
    })
  );

  web3.currentProvider.on('error', (error: any) => {
    console.error('WebSocket Connection Error:', error);
    // Handle error or reconnect logic here
  });

  web3.currentProvider.on('connect', () => {
    console.log('WebSocket Connection Established');
  });

  return web3;
};

export default createWeb3Connection;
