import express, { Router } from 'express'
import mongoose from 'mongoose'
import { Models } from './index'

const routes = (Models: Models): Router => {
    const router = express.Router()

    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ success: false, error: 'Invalid id' })
            }

            const tank = await Models.Aquarium
                .findById(id)
                .select('-__v -_id -account -createdAt -updatedAt')
                .lean()

            if (!tank) {
                return res.status(404).json({ success: false })
            }

            return res.status(200).json({ success: true, tank })
        } catch (err) {
            res.status(500).json({ success: false, error: (err as Error).message })
        }
    })

    return router
}

export default routes
