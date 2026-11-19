const mongoose = require('mongoose')

const rentalRequestSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: String, trim: true, maxlength: 1000, default: '' },
  visitDate: { type: Date, default: null },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'visit_scheduled'], default: 'pending', index: true },
}, { timestamps: true })

rentalRequestSchema.index({ property: 1, tenant: 1 }, { unique: true })

module.exports = mongoose.model('RentalRequest', rentalRequestSchema)
