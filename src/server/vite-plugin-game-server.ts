import { Plugin } from 'vite'
import { setupSocketServer } from './socket'

export function gameServer(): Plugin {
    return {
        name: 'vite-plugin-game-server',
        configureServer(server) {
            setupSocketServer(server.httpServer!)

            // Log when server is ready
            server.httpServer?.once('listening', () => {
                const address = server.httpServer?.address()
                if (address && typeof address !== 'string') {
                    console.log(`Game server running on port ${address.port}`)
                }
            })
        }
    }
}
