const Property = require('../models/Property')
const { uploadImage, deleteImage } = require('../utils/cloudinary')

function parseBody(body) {
  const amenities = Array.isArray(body.amenities) ? body.amenities : (typeof body.amenities === 'string' ? body.amenities.split(',').map((item) => item.trim()).filter(Boolean) : [])
  return {
    title: body.title,
    description: body.description,
    propertyType: body.propertyType,
    listingType: body.listingType,
    price: body.price,
    location: body.location,
    address: body.address,
    bedrooms: body.bedrooms,
    bathrooms: body.bathrooms,
    area: body.area,
    amenities,
    status: body.status,
    furnishing: body.furnishing,
  }
}

async function createProperty(req, res, next) {
  try {
    const data = parseBody(req.body)
    const images = req.files?.length ? await Promise.all(req.files.map(uploadImage)) : []
    const property = await Property.create({ ...data, owner: req.user._id, status: 'pending', images })
    res.status(201).json({ success: true, message: 'Property created', data: { property } })
  } catch (error) { next(error) }
}

async function listMyProperties(req, res, next) {
  try {
    const filter = { owner: req.user._id }
    if (req.query.status) filter.status = req.query.status
    const properties = await Property.find(filter).sort({ createdAt: -1 })
    res.status(200).json({ success: true, data: { properties } })
  } catch (error) { next(error) }
}

async function listPublicProperties(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12))
    const filter = { status: 'active' }
    if (req.query.location) filter.location = { $regex: String(req.query.location).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
    if (req.query.propertyType) filter.propertyType = req.query.propertyType
    if (req.query.listingType) filter.listingType = req.query.listingType
    if (req.query.furnishing) filter.furnishing = req.query.furnishing
    if (req.query.bedrooms) filter.bedrooms = Number(req.query.bedrooms)
    if (req.query.bathrooms) filter.bathrooms = Number(req.query.bathrooms)
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {}
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice)
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice)
    }
    if (req.query.amenities) {
      const amenities = String(req.query.amenities).split(',').map((item) => item.trim()).filter(Boolean).slice(0, 20)
      if (amenities.length) filter.amenities = { $all: amenities }
    }
    const sortMap = {
      priceAsc: { price: 1 },
      priceDesc: { price: -1 },
      newest: { createdAt: -1 },
    }
    const sort = sortMap[req.query.sort] || { createdAt: -1 }
    const [properties, total] = await Promise.all([
      Property.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).populate('owner', 'name'),
      Property.countDocuments(filter),
    ])
    res.status(200).json({ success: true, data: { properties, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } })
  } catch (error) { next(error) }
}

async function getDashboard(req, res, next) {
  try {
    const totals = await Property.aggregate([
      { $match: { owner: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])
    const counts = { total: 0, active: 0, rented: 0, sold: 0, pending: 0 }
    totals.forEach(({ _id, count }) => { counts[_id] = count; counts.total += count })
    res.status(200).json({ success: true, data: { summary: counts } })
  } catch (error) { next(error) }
}

async function getProperty(req, res, next) {
  try {
    const property = await Property.findOne({ _id: req.params.id, owner: req.user._id })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })
    res.status(200).json({ success: true, data: { property } })
  } catch (error) { next(error) }
}

async function updateProperty(req, res, next) {
  try {
    const property = await Property.findOne({ _id: req.params.id, owner: req.user._id })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })
    const ownerStatus = property.status
    Object.assign(property, parseBody({ ...property.toObject(), ...req.body }))
    property.status = ownerStatus === 'rejected' ? 'pending' : ownerStatus
    if (req.files?.length) {
      if (property.images.length + req.files.length > 5) return res.status(400).json({ success: false, message: 'A property can have at most 5 images' })
      property.images.push(...await Promise.all(req.files.map(uploadImage)))
    }
    await property.save()
    res.status(200).json({ success: true, message: 'Property updated', data: { property } })
  } catch (error) { next(error) }
}

async function deleteProperty(req, res, next) {
  try {
    const property = await Property.findOne({ _id: req.params.id, owner: req.user._id })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })
    await Promise.all(property.images.map((image) => deleteImage(image.publicId)))
    await property.deleteOne()
    res.status(200).json({ success: true, message: 'Property deleted' })
  } catch (error) { next(error) }
}

async function deletePropertyImage(req, res, next) {
  try {
    const property = await Property.findOne({ _id: req.params.id, owner: req.user._id })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })
    const image = property.images.find((item) => item.publicId === req.params.publicId)
    if (!image) return res.status(404).json({ success: false, message: 'Image not found' })
    await deleteImage(image.publicId)
    property.images = property.images.filter((item) => item.publicId !== req.params.publicId)
    await property.save()
    res.status(200).json({ success: true, message: 'Image deleted', data: { property } })
  } catch (error) { next(error) }
}

async function getPublicProperty(req, res, next) {
  try {
    const property = await Property.findOne({ _id: req.params.id, status: 'active' }).populate('owner', 'name')
    if (!property) return res.status(404).json({ success: false, message: 'Approved property not found' })
    res.status(200).json({ success: true, data: { property } })
  } catch (error) { next(error) }
}

module.exports = { createProperty, listMyProperties, listPublicProperties, getDashboard, getProperty, getPublicProperty, updateProperty, deleteProperty, deletePropertyImage }
