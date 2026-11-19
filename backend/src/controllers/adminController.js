const User = require('../models/User')
const Property = require('../models/Property')
const RentalRequest = require('../models/RentalRequest')
const { emitUserNotification } = require('../socket')

async function getAdminSummary(req, res, next) {
  try {
    const [users, tenants, owners, propertyCounts, pending, active, rejected, rentalCounts] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'Tenant' }),
      User.countDocuments({ role: 'Property Owner' }),
      Property.countDocuments(),
      Property.countDocuments({ status: 'pending' }),
      Property.countDocuments({ status: 'active' }),
      Property.countDocuments({ status: 'rejected' }),
      RentalRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ])
    const rentals = rentalCounts.reduce((result, item) => ({ ...result, [item._id]: item.count }), {})
    res.status(200).json({
      success: true,
      data: {
        summary: { users, tenants, owners, properties: propertyCounts, pending, active, rejected },
        rentals,
      },
    })
  } catch (error) { next(error) }
}

async function listUsers(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Number(req.query.limit) || 20)
    const filter = {}
    if (req.query.role) filter.role = req.query.role
    if (req.query.search) filter.$or = [
      { name: { $regex: req.query.search.slice(0, 100), $options: 'i' } },
      { email: { $regex: req.query.search.slice(0, 100), $options: 'i' } },
    ]
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ])
    res.status(200).json({ success: true, data: { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } })
  } catch (error) { next(error) }
}

async function updateUserRole(req, res, next) {
  try {
    if (!['Tenant', 'Property Owner', 'Admin'].includes(req.body.role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' })
    }
    if (req.params.id === req.user.id) return res.status(400).json({ success: false, message: 'You cannot change your own role' })
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true, runValidators: true }).select('-password')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    res.status(200).json({ success: true, message: 'User role updated', data: { user } })
  } catch (error) { next(error) }
}

async function listPropertiesForModeration(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Number(req.query.limit) || 20)
    const filter = {}
    if (req.query.status) filter.status = req.query.status
    const [properties, total] = await Promise.all([
      Property.find(filter).populate('owner', 'name email role').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Property.countDocuments(filter),
    ])
    res.status(200).json({ success: true, data: { properties, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } })
  } catch (error) { next(error) }
}

async function moderateProperty(req, res, next) {
  try {
    if (!['active', 'rejected', 'pending'].includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Status must be active, rejected, or pending' })
    }
    const property = await Property.findById(req.params.id)
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })
    property.status = req.body.status
    property.rejectionReason = req.body.status === 'rejected' ? (req.body.reason || 'Rejected by administrator') : ''
    property.moderatedBy = req.user._id
    property.moderatedAt = new Date()
    await property.save()
    emitUserNotification(req.app.get('io'), property.owner, { type: req.body.status === 'active' ? 'PROPERTY_APPROVED' : 'PROPERTY_REJECTED', title: 'Listing moderation update', message: `${property.title} was ${req.body.status} by an administrator.` })
    res.status(200).json({ success: true, message: `Property ${req.body.status}`, data: { property } })
  } catch (error) { next(error) }
}

module.exports = { getAdminSummary, listUsers, updateUserRole, listPropertiesForModeration, moderateProperty }
