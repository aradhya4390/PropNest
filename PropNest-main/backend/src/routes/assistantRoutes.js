const express = require('express')
const { authenticate } = require('../middleware/authMiddleware')
const { assistantRateLimit } = require('../middleware/rateLimitMiddleware')
const { chat } = require('../controllers/assistantController')

const router = express.Router()
router.post('/chat', authenticate, assistantRateLimit, chat)

module.exports = router
