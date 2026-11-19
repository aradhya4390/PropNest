const express = require('express')
const { body } = require('express-validator')
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware')
const { validateRequest } = require('../middleware/validationMiddleware')
const { upload } = require('../middleware/uploadMiddleware')
const { createProperty, listMyProperties, listPublicProperties, getDashboard, getProperty, getPublicProperty, updateProperty, deleteProperty, deletePropertyImage } = require('../controllers/propertyController')

const router = express.Router()
router.get('/public', listPublicProperties)
router.get('/public/:id', getPublicProperty)
router.use(authenticate, authorizeRoles('Property Owner', 'Admin'))

const propertyValidation = [
  body('title').optional().trim().isLength({ min: 3, max: 120 }),
  body('description').optional().trim().isLength({ min: 10, max: 5000 }),
  body('propertyType').optional().isIn(['Apartment', 'House', 'Villa', 'Studio', 'Commercial', 'Plot']),
  body('listingType').optional().isIn(['Rent', 'Sale']),
  body('price').optional().isFloat({ min: 0 }),
  body('location').optional().trim().isLength({ min: 1, max: 120 }),
  body('address').optional().trim().isLength({ min: 1, max: 300 }),
  body('bedrooms').optional().isInt({ min: 0, max: 100 }),
  body('bathrooms').optional().isInt({ min: 0, max: 100 }),
  body('area').optional().isFloat({ min: 1 }),
  body('status').optional().isIn(['active', 'rented', 'sold', 'pending', 'rejected']),
  body('furnishing').optional().isIn(['Furnished', 'Semi-Furnished', 'Unfurnished']),
  validateRequest,
]

router.post('/', upload.array('images', 5), [
  body('title').trim().isLength({ min: 3, max: 120 }),
  body('description').trim().isLength({ min: 10, max: 5000 }),
  body('propertyType').isIn(['Apartment', 'House', 'Villa', 'Studio', 'Commercial', 'Plot']),
  body('listingType').isIn(['Rent', 'Sale']),
  body('price').isFloat({ min: 0 }),
  body('location').trim().isLength({ min: 1, max: 120 }),
  body('address').trim().isLength({ min: 1, max: 300 }),
  body('bedrooms').isInt({ min: 0, max: 100 }),
  body('bathrooms').isInt({ min: 0, max: 100 }),
  body('area').isFloat({ min: 1 }),
  body('status').optional().isIn(['active', 'rented', 'sold', 'pending', 'rejected']),
  body('furnishing').optional().isIn(['Furnished', 'Semi-Furnished', 'Unfurnished']),
  validateRequest,
], createProperty)
router.get('/', listMyProperties)
router.get('/dashboard', getDashboard)
router.get('/:id', getProperty)
router.put('/:id', upload.array('images', 5), propertyValidation, updateProperty)
router.delete('/:id', deleteProperty)
router.delete('/:id/images/:publicId', deletePropertyImage)

module.exports = router
