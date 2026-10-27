const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { env } = require('../config/env')

async function authenticate(req, res, next) {
  try {
    const authorization = req.get('authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }

    const token = authorization.slice(7)
    const payload = jwt.verify(token, env.jwtSecret)
    const user = await User.findById(payload.sub)
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required' })

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' })
    }
    next(error)
  }
}

module.exports = { authenticate }