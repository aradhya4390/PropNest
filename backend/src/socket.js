const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const User = require('./models/User')
const { env } = require('./config/env')

function userRoom(userId) {
  return `user:${userId.toString()}`
}

function emitUserNotification(io, userId, notification) {
  if (!io || !userId) return
  io.to(userRoom(userId)).emit('notification', {
    id: `${Date.now()}-${userId}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...notification,
  })
}

function attachSocket(server) {
  const io = new Server(server, {
    cors: { origin: env.clientOrigin, methods: ['GET', 'POST'] },
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('Authentication required'))
      const payload = jwt.verify(token, env.jwtSecret)
      const user = await User.findById(payload.sub).select('_id role name')
      if (!user) return next(new Error('Authentication required'))
      socket.user = user
      next()
    } catch (error) {
      next(new Error('Invalid or expired token'))
    }
  })

  io.on('connection', (socket) => {
    socket.join(userRoom(socket.user._id))
    socket.emit('connected', { userId: socket.user._id, role: socket.user.role })
  })

  return io
}

module.exports = { attachSocket, emitUserNotification, userRoom }
