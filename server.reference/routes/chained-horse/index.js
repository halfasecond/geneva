import jwt from 'jsonwebtoken'
import Account from '../../models/chained-horse/accounts'
import authRoutes from './auth'
import horseRoutes from './horse'
import horsesRoutes from './horses'
import accountRoutes from './account'

const routes = (app, web3) => {
    app.use('/chainedhorses/horse', horseRoutes)
    app.use('/chainedhorses/horses', horsesRoutes)
    app.use('/auth', authRoutes)
    app.use('/account', accountRoutes)
}

export default routes
