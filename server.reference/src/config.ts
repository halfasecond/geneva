export const config = {
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/paddock',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },
    server: {
        port: process.env.PORT || 3001,
        clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
    },
    game: {
        paddockSize: 5000,
        zoneSize: 1000,
        maxPlayersPerZone: 50,
        itemSpawnInterval: 60000, // 1 minute
        scareCityInterval: 3600000, // 1 hour
        inactivityTimeout: 300000, // 5 minutes
        cleanupInterval: 60000 // 1 minute
    },
    web3: {
        wsUrl: process.env.WEB3_SOCKET_URL || 'ws://localhost:8546',
        contractAddress: process.env.CONTRACT_ADDRESS || '',
        networkId: process.env.NETWORK_ID || '1'
    }
} as const

// Environment variable types
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production' | 'test'
            PORT?: string
            MONGODB_URI?: string
            CLIENT_URL?: string
            WEB3_SOCKET_URL?: string
            CONTRACT_ADDRESS?: string
            NETWORK_ID?: string
        }
    }
}
