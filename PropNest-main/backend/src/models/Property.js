const mongoose = require('mongoose')

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  format: { type: String, default: '' },
  bytes: { type: Number, default: 0 },
  originalName: { type: String, default: '' },
}, { _id: true })

const propertySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 4, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  propertyType: { type: String, enum: ['Apartment', 'House', 'Villa', 'Studio', 'Townhouse', 'Other'], required: true },
  listingType: { type: String, enum: ['Rent', 'Sale'], required: true },
  price: { type: Number, required: true, min: 1 },
  location: {
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    postalCode: { type: String, trim: true, maxlength: 20, default: '' },
  },
  address: { type: String, required: true, trim: true, maxlength: 300 },
  bedrooms: { type: Number, required: true, min: 0, max: 100 },
  bathrooms: { type: Number, required: true, min: 0, max: 100 },
  area: { type: Number, required: true, min: 1 },
  amenities: { type: [String], default: [] },
  status: { type: String, enum: ['Pending', 'Active', 'Rented', 'Sold'], default: 'Pending', index: true },
  images: { type: [imageSchema], default: [] },
}, { timestamps: true })

propertySchema.index({ status: 1, createdAt: -1 })

module.exports = mongoose.model('Property', propertySchema)
