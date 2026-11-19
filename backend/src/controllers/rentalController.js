const RentalRequest = require('../models/RentalRequest')
const Property = require('../models/Property')
const { emitUserNotification } = require('../socket')

async function createRentalRequest(req, res, next) {
  try {
    const property = await Property.findOne({ _id: req.body.propertyId, status: 'active' })
    if (!property) return res.status(404).json({ success: false, message: 'Approved property not found' })
    if (property.owner.toString() === req.user._id.toString()) return res.status(400).json({ success: false, message: 'You cannot request your own property' })
    const existing = await RentalRequest.findOne({ property: property._id, tenant: req.user._id })
    if (existing) return res.status(409).json({ success: false, message: 'You already submitted a request for this property' })
    const rental = await RentalRequest.create({ property: property._id, tenant: req.user._id, owner: property.owner, message: req.body.message })
    emitUserNotification(req.app.get('io'), property.owner, { type: 'NEW_RENTAL_REQUEST', title: 'New rental request', message: `${req.user.name} requested ${property.title}.` })
    res.status(201).json({ success: true, message: 'Rental request submitted', data: { request: rental } })
  } catch (error) { next(error) }
}

async function listTenantRequests(req, res, next) {
  try {
    const requests = await RentalRequest.find({ tenant: req.user._id }).populate('property').sort({ createdAt: -1 })
    res.status(200).json({ success: true, data: { requests } })
  } catch (error) { next(error) }
}

async function listOwnerRequests(req, res, next) {
  try {
    const requests = await RentalRequest.find({ owner: req.user._id }).populate('property').populate('tenant', 'name email').sort({ createdAt: -1 })
    res.status(200).json({ success: true, data: { requests } })
  } catch (error) { next(error) }
}

async function updateOwnerRequest(req, res, next) {
  try {
    if (!['accepted', 'rejected', 'visit_scheduled', 'pending'].includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid request status' })
    }
    const rental = await RentalRequest.findOne({ _id: req.params.id, owner: req.user._id })
    if (!rental) return res.status(404).json({ success: false, message: 'Rental request not found' })
    rental.status = req.body.status
    rental.visitDate = req.body.visitDate ? new Date(req.body.visitDate) : rental.visitDate
    await rental.save()
    emitUserNotification(req.app.get('io'), rental.tenant, { type: req.body.status === 'accepted' ? 'REQUEST_ACCEPTED' : req.body.status === 'rejected' ? 'REQUEST_REJECTED' : 'VISIT_CONFIRMED', title: 'Rental request updated', message: `Your request status is now ${req.body.status}.` })
    res.status(200).json({ success: true, message: 'Rental request updated', data: { request: rental } })
  } catch (error) { next(error) }
}

module.exports = { createRentalRequest, listTenantRequests, listOwnerRequests, updateOwnerRequest }
