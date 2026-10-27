const express = require('express')
const cors = require('cors')
const { connectDatabase } = require('./src/config/database')
const { env } = require('./src/config/env')
const authRoutes = require('./src/routes/authRoutes')
const propertyRoutes = require('./src/routes/propertyRoutes')
const assistantRoutes = require('./src/routes/assistantRoutes')
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware')

const app = express()

app.use(cors({ origin: env.clientOrigin }))
app.use(express.json({ limit: '20kb' }))
app.use(express.urlencoded({ extended: false }))

app.get('/api/health', (req, res) => {
	res.status(200).json({ success: true, message: 'PropNest API is running' })
})
app.use('/api/auth', authRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/assistant', assistantRoutes)

app.use(notFound)
app.use(errorHandler)

async function startServer() {
	await connectDatabase()
	app.listen(env.port, () => {
		console.log(`PropNest API listening on port ${env.port}`)
	})
}

if (require.main === module) {
	startServer().catch((error) => {
		console.error('Unable to start server:', error.message)
		process.exit(1)
	})
}

module.exports = { app, startServer }
