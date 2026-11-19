const mongoose = require('mongoose')

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  originalName: { type: String, default: '' },
  format: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false })

const propertySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
  propertyType: { type: String, required: true, enum: ['Apartment', 'House', 'Villa', 'Studio', 'Commercial', 'Plot'] },
  listingType: { type: String, required: true, enum: ['Rent', 'Sale'], default: 'Rent' },
  price: { type: Number, required: true, min: 0 },
  location: { type: String, required: true, trim: true, maxlength: 120 },
  address: { type: String, required: true, trim: true, maxlength: 300 },
  bedrooms: { type: Number, required: true, min: 0, max: 100 },
  bathrooms: { type: Number, required: true, min: 0, max: 100 },
  area: { type: Number, required: true, min: 1 },
  amenities: [{ type: String, trim: true, maxlength: 100 }],
  status: { type: String, enum: ['active', 'rented', 'sold', 'pending', 'rejected'], default: 'pending', index: true },
  furnishing: { type: String, enum: ['Furnished', 'Semi-Furnished', 'Unfurnished'], default: 'Unfurnished' },
  rejectionReason: { type: String, trim: true, maxlength: 500, default: '' },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  moderatedAt: { type: Date, default: null },
  images: { type: [imageSchema], default: [] },
}, { timestamps: true })

propertySchema.index({ owner: 1, status: 1 })

module.exports = mongoose.model('Property', propertySchema)
