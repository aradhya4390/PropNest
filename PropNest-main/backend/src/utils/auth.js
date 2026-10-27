const jwt = require('jsonwebtoken')
const { env } = require('../config/env')

function createAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, updatedAt: user.updatedAt }
}

module.exports = { createAccessToken, publicUser }