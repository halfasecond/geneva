import express from 'express'

const routes = (Models, db) => {
    const router = express.Router()
    router.get('/', async (req, res) => {
        const owners = await Models.Owner.find({ balance: { $gt: 0 }}, '-_id -__v')
        return res.status(200).json(owners)
    })

    return router
}

export default routes
