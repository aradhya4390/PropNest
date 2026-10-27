const User = require('../models/User')
const { createAccessToken, publicUser } = require('../utils/auth')

async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) return res.status(409).json({ success: false, message: 'Email is already registered' })

    const user = await User.create({ name, email, password, role })
    const token = createAccessToken(user)
    res.status(201).json({ success: true, message: 'Registration successful', data: { user: publicUser(user), accessToken: token } })
  } catch (error) {
    next(error)
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const token = createAccessToken(user)
    res.status(200).json({ success: true, message: 'Login successful', data: { user: publicUser(user), accessToken: token } })
  } catch (error) {
    next(error)
  }
}

function me(req, res) {
  res.status(200).json({ success: true, data: { user: publicUser(req.user) } })
}

function logout(req, res) {
  res.status(200).json({ success: true, message: 'Logout successful. Discard the access token on the client.' })
}

module.exports = { register, login, me, logout }