const express = require('express')
const http = require('http')
const cors = require('cors')
const { connectDatabase } = require('./src/config/database')
const { env } = require('./src/config/env')
const authRoutes = require('./src/routes/authRoutes')
const propertyRoutes = require('./src/routes/propertyRoutes')
const aiRoutes = require('./src/routes/aiRoutes')
const adminRoutes = require('./src/routes/adminRoutes')
const rentalRoutes = require('./src/routes/rentalRoutes')
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware')
const { attachSocket } = require('./src/socket')

const app = express()
const server = http.createServer(app)
const io = attachSocket(server)
app.set('io', io)

app.use(cors({ origin: env.clientOrigin }))
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: false }))

app.get('/api/health', (req, res) => {
	res.status(200).json({ success: true, message: 'PropNest API is running' })
})
app.use('/api/auth', authRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/rental-requests', rentalRoutes)

app.use(notFound)
app.use(errorHandler)

async function startServer() {
	await connectDatabase()
	server.listen(env.port, () => {
		console.log(`PropNest API listening on port ${env.port}`)
	})
}

if (require.main === module) {
	startServer().catch((error) => {
		console.error('Unable to start server:', error.message)
		process.exit(1)
	})
}

module.exports = { app, server, io, startServer }
