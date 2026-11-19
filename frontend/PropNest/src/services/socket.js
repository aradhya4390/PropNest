import { io } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL.replace(/\/api\/?$/, '')

export function connectNotifications(accessToken, onNotification) {
  const socket = io(SOCKET_URL, { auth: { token: accessToken }, transports: ['websocket'] })
  socket.on('notification', onNotification)
  return () => socket.disconnect()
}
