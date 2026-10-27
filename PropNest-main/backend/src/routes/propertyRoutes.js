const express = require('express')
const { body } = require('express-validator')
const { authenticate } = require('../middleware/authMiddleware')
const { requirePropertyOwner } = require('../middleware/ownerMiddleware')
const { uploadImages } = require('../middleware/uploadMiddleware')
const { validateRequest } = require('../middleware/validationMiddleware')
const controller = require('../controllers/propertyController')

const router = express.Router()
const propertyValidation = [
  body('title').trim().isLength({ min: 4, max: 120 }).withMessage('Title must be between 4 and 120 characters'),
  body('description').trim().isLength({ min: 10, max: 5000 }).withMessage('Description must be between 10 and 5000 characters'),
  body('propertyType').isIn(['Apartment', 'House', 'Villa', 'Studio', 'Townhouse', 'Other']).withMessage('Choose a valid property type'),
  body('listingType').isIn(['Rent', 'Sale']).withMessage('Choose Rent or Sale'),
  body('price').isFloat({ min: 1 }).withMessage('Price must be greater than zero').toFloat(),
  body('location').isObject().withMessage('Location is required'),
  body('location.city').trim().isLength({ min: 1, max: 100 }).withMessage('City is required'),
  body('location.state').trim().isLength({ min: 1, max: 100 }).withMessage('State is required'),
  body('location.postalCode').optional().isString().isLength({ max: 20 }),
  body('address').trim().isLength({ min: 5, max: 300 }).withMessage('Address must be between 5 and 300 characters'),
  body('bedrooms').isInt({ min: 0, max: 100 }).withMessage('Bedrooms must be a non-negative number').toInt(),
  body('bathrooms').isFloat({ min: 0, max: 100 }).withMessage('Bathrooms must be a non-negative number').toFloat(),
  body('area').isFloat({ min: 1 }).withMessage('Area must be greater than zero').toFloat(),
  body('amenities').optional().isArray({ max: 50 }).withMessage('Amenities must be an array'),
  body('amenities.*').optional().isString().trim().isLength({ max: 80 }),
  body('status').optional().isIn(['Pending', 'Active', 'Rented', 'Sold']).withMessage('Choose a valid listing status'),
  validateRequest,
]

router.get('/', controller.listPublic)
router.get('/mine', authenticate, requirePropertyOwner, controller.listMine)
router.get('/dashboard', authenticate, requirePropertyOwner, controller.dashboard)
router.get('/mine/:id', authenticate, requirePropertyOwner, controller.getMineById)
router.post('/', authenticate, requirePropertyOwner, propertyValidation, controller.create)
router.put('/:id', authenticate, requirePropertyOwner, propertyValidation, controller.update)
router.post('/:id/images', authenticate, requirePropertyOwner, uploadImages.array('images', 5), controller.addImages)
router.delete('/:id/images/:imageId', authenticate, requirePropertyOwner, controller.removeImage)
router.delete('/:id', authenticate, requirePropertyOwner, controller.remove)
router.get('/:id', controller.getPublicById)

module.exports = router
