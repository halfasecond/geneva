import cors from 'cors'
import bodyParser from 'body-parser'
import { Express } from 'express'

const configureExpress = (app: Express): void => {
    const corsOptions: cors.CorsOptions = {
        origin: ['https://paddock.chainedhorse.com/'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Origin',
            'X-Requested-With',
            'Accept',
            'x-api-key',
            'Authorization',
            'x-agent-id'
        ],
        credentials: true
    }

    app.use((req, _res, next) => {
        console.log('Origin:', req.headers.origin)
        console.log('Access-Control-Request-Headers:', req.headers['access-control-request-headers'])
        next()
    })

    app.use(cors(corsOptions))

    // Explicitly handle preflight (optional but safe)
    app.options('*', cors(corsOptions))

    app.use(bodyParser.json({ limit: '50mb' }))
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
}

export default configureExpress