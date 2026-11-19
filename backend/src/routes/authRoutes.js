const express = require('express')
const { body } = require('express-validator')
const { register, login, me, logout } = require('../controllers/authController')
const { authenticate } = require('../middleware/authMiddleware')
const { validateRequest } = require('../middleware/validationMiddleware')

const router = express.Router()
const email = body('email').isEmail().withMessage('A valid email is required').normalizeEmail()
const password = body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')

router.post('/register', [body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'), email, password, body('role').optional().isIn(['Tenant', 'Property Owner']).withMessage('Invalid role'), validateRequest], register)
router.post('/login', [email, body('password').notEmpty().withMessage('Password is required'), validateRequest], login)
router.get('/me', authenticate, me)
router.post('/logout', authenticate, logout)

module.exports = router