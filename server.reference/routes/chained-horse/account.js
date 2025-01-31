const express = require('express')
const router = express.Router()
import jwt from 'jsonwebtoken'
const Account = require('../../models/chained-horse/accounts')
const JWT_SECRET = process.env.JWT_SECRET
// Middleware function to authenticate requests
const authenticate = (req, res, next) => {
    const token = req.header('Authorization')
    // Check if token is valid
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication token missing.' })
    }
  
    // Verify token
    try {
      const secret = JWT_SECRET
      const decoded = jwt.verify(token, secret)
      req.userId = decoded.userId
      next()
    } catch (error) {
      console.error(error)
      res.status(401).json({ success: false, message: 'Invalid authentication token.' })
    }
}

router.post('/main-horse', authenticate, async (req, res) => {
  const { address, avatar } = req.body
  try {
    const account = await Account.findOneAndUpdate({ address: address.toLowerCase() }, { avatar }, { new: true })
    res.status(200).json({ success: true, account })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Failed to update avatar.' })
  }
})

export default router