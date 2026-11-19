const express = require('express')
const { body } = require('express-validator')
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware')
const { validateRequest } = require('../middleware/validationMiddleware')
const { getAdminSummary, listUsers, updateUserRole, listPropertiesForModeration, moderateProperty } = require('../controllers/adminController')

const router = express.Router()
router.use(authenticate, authorizeRoles('Admin'))

router.get('/summary', getAdminSummary)
router.get('/users', listUsers)
router.patch('/users/:id/role', [body('role').isIn(['Tenant', 'Property Owner', 'Admin']), validateRequest], updateUserRole)
router.get('/properties', listPropertiesForModeration)
router.patch('/properties/:id/moderate', [
  body('status').isIn(['active', 'rejected', 'pending']),
  body('reason').optional().trim().isLength({ max: 500 }),
  validateRequest,
], moderateProperty)

module.exports = router
