const express = require('express')
const { body } = require('express-validator')
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware')
const { validateRequest } = require('../middleware/validationMiddleware')
const { createRentalRequest, listTenantRequests, listOwnerRequests, updateOwnerRequest } = require('../controllers/rentalController')

const router = express.Router()
router.use(authenticate)

router.post('/', authorizeRoles('Tenant'), [
  body('propertyId').isMongoId(),
  body('message').optional().trim().isLength({ max: 1000 }),
  validateRequest,
], createRentalRequest)
router.get('/tenant', authorizeRoles('Tenant'), listTenantRequests)
router.get('/owner', authorizeRoles('Property Owner'), listOwnerRequests)
router.patch('/owner/:id', authorizeRoles('Property Owner'), [
  body('status').isIn(['pending', 'accepted', 'rejected', 'visit_scheduled']),
  body('visitDate').optional().isISO8601(),
  validateRequest,
], updateOwnerRequest)

module.exports = router
