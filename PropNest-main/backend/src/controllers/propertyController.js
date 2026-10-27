const mongoose = require('mongoose')
const Property = require('../models/Property')
const { deleteImage, uploadImage } = require('../utils/cloudinary')

const propertyFields = [
  'title', 'description', 'propertyType', 'listingType', 'price', 'location',
  'address', 'bedrooms', 'bathrooms', 'area', 'amenities', 'status',
]

function propertyInput(body) {
  return Object.fromEntries(propertyFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]))
}

async function listPublic(req, res, next) {
  try {
    const properties = await Property.find({ status: 'Active' }).sort({ createdAt: -1 }).limit(100)
    res.json({ success: true, data: { properties } })
  } catch (error) {
    next(error)
  }
}

async function listMine(req, res, next) {
  try {
    const properties = await Property.find({ owner: req.user._id }).sort({ updatedAt: -1 })
    res.json({ success: true, data: { properties } })
  } catch (error) {
    next(error)
  }
}

async function dashboard(req, res, next) {
  try {
    const [total, active, rented, sold, pending] = await Promise.all([
      Property.countDocuments({ owner: req.user._id }),
      Property.countDocuments({ owner: req.user._id, status: 'Active' }),
      Property.countDocuments({ owner: req.user._id, status: 'Rented' }),
      Property.countDocuments({ owner: req.user._id, status: 'Sold' }),
      Property.countDocuments({ owner: req.user._id, status: 'Pending' }),
    ])
    res.json({ success: true, data: { total, active, rentedOrSold: rented + sold, rented, sold, pending } })
  } catch (error) {
    next(error)
  }
}

async function create(req, res, next) {
  try {
    const property = await Property.create({ ...propertyInput(req.body), owner: req.user._id })
    res.status(201).json({ success: true, message: 'Property created', data: { property } })
  } catch (error) {
    next(error)
  }
}

async function getMineById(req, res, next) {
  try {
    const property = await Property.findOne({ _id: req.params.id, owner: req.user._id })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })
    res.json({ success: true, data: { property } })
  } catch (error) {
    next(error)
  }
}

async function getPublicById(req, res, next) {
  try {
    const property = await Property.findOne({ _id: req.params.id, status: 'Active' })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })
    res.json({ success: true, data: { property } })
  } catch (error) {
    next(error)
  }
}

async function update(req, res, next) {
  try {
    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      propertyInput(req.body),
      { new: true, runValidators: true },
    )
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })
    res.json({ success: true, message: 'Property updated', data: { property } })
  } catch (error) {
    next(error)
  }
}

async function addImages(req, res, next) {
  const uploadedImages = []
  try {
    const property = await Property.findOne({ _id: req.params.id, owner: req.user._id })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })
    if (!req.files?.length) return res.status(400).json({ success: false, message: 'Choose at least one image' })
    if (property.images.length + req.files.length > 10) {
      return res.status(400).json({ success: false, message: 'A property can have at most 10 images' })
    }
    for (const file of req.files) uploadedImages.push(await uploadImage(file))
    property.images.push(...uploadedImages)
    await property.save()
    res.status(201).json({ success: true, message: 'Images uploaded', data: { property } })
  } catch (error) {
    await Promise.all(uploadedImages.map((image) => deleteImage(image.publicId).catch((cleanupError) => console.error('Unable to clean up uploaded image:', cleanupError.message))))
    next(error)
  }
}

async function removeImage(req, res, next) {
  try {
    const property = await Property.findOne({ _id: req.params.id, owner: req.user._id })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })
    if (!mongoose.isValidObjectId(req.params.imageId)) return res.status(400).json({ success: false, message: 'Invalid image identifier' })
    const image = property.images.id(req.params.imageId)
    if (!image) return res.status(404).json({ success: false, message: 'Image not found' })
    await deleteImage(image.publicId)
    image.deleteOne()
    await property.save()
    res.json({ success: true, message: 'Image deleted', data: { property } })
  } catch (error) {
    next(error)
  }
}

async function remove(req, res, next) {
  try {
    const property = await Property.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })
    const failures = await Promise.allSettled(property.images.map((image) => deleteImage(image.publicId)))
    const rejected = failures.filter((result) => result.status === 'rejected')
    rejected.forEach((result) => console.error('Unable to delete Cloudinary image:', result.reason.message))
    if (rejected.length) {
      return res.status(502).json({ success: false, message: 'Property deleted, but some stored images could not be removed. Check the backend logs.' })
    }
    res.json({ success: true, message: 'Property deleted' })
  } catch (error) {
    next(error)
  }
}

module.exports = { addImages, create, dashboard, getMineById, getPublicById, listMine, listPublic, remove, removeImage, update }
