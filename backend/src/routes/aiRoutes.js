const express = require('express')
const rateLimit = require('express-rate-limit')
const { body } = require('express-validator')
const { authenticate } = require('../middleware/authMiddleware')
const { validateRequest } = require('../middleware/validationMiddleware')
const { env } = require('../config/env')
const Property = require('../models/Property')
const User = require('../models/User')
const RentalRequest = require('../models/RentalRequest')

const router = express.Router()
const aiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 15, standardHeaders: 'draft-7', legacyHeaders: false })

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function getAuthorizedContext(user, message) {
  if (user.role === 'Property Owner') {
    const [properties, requests] = await Promise.all([
      Property.find({ owner: user._id }).sort({ updatedAt: -1 }).lean(),
      RentalRequest.countDocuments({ owner: user._id }),
    ])
    const counts = properties.reduce((result, property) => {
      result[property.status] = (result[property.status] || 0) + 1
      return result
    }, {})
    return {
      properties,
      summary: { total: properties.length, pendingRentalRequests: await RentalRequest.countDocuments({ owner: user._id, status: 'pending' }), totalRentalRequests: requests, ...counts },
      system: 'Act as PropNest AI - Your Smart Property Manager. Use only the owner property records supplied below. Never access or mention another owner.',
    }
  }

  if (user.role === 'Admin') {
    const [users, tenants, owners, properties, pending, active, rejected, requests] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'Tenant' }),
      User.countDocuments({ role: 'Property Owner' }),
      Property.countDocuments(),
      Property.countDocuments({ status: 'pending' }),
      Property.countDocuments({ status: 'active' }),
      Property.countDocuments({ status: 'rejected' }),
      RentalRequest.countDocuments(),
    ])
    return {
      summary: { users, tenants, owners, properties, pending, active, rejected, requests },
      system: 'Act as PropNest AI - Admin Intelligence Assistant. Summarize only the authorized platform statistics supplied below. Do not claim you can independently execute moderation or payment actions.',
    }
  }

  const filter = { status: 'active' }
  const lower = message.toLowerCase()
  const underMatch = lower.match(/(?:under|below|less than)\s*(?:₹|rs\.?\s*)?(\d[\d,]*)/i)
  const bedroomMatch = lower.match(/(\d+)\s*(?:bhk|bed(?:room)?s?)\b/i)
  if (underMatch) filter.price = { $lte: Number(underMatch[1].replace(/,/g, '')) }
  if (bedroomMatch) filter.bedrooms = Number(bedroomMatch[1])
  if (/\bfurnished\b/i.test(message) && !/\bunfurnished\b/i.test(message)) filter.furnishing = 'Furnished'
  if (/\bsemi[- ]?furnished\b/i.test(message)) filter.furnishing = 'Semi-Furnished'
  if (/\bunfurnished\b/i.test(message)) filter.furnishing = 'Unfurnished'
  for (const knownLocation of ['delhi', 'noida', 'gurgaon', 'gurugram', 'pune', 'mumbai', 'bengaluru', 'bangalore', 'vadodara', 'hyderabad', 'chennai']) {
    if (lower.includes(knownLocation)) {
      filter.location = { $regex: escapeRegex(knownLocation), $options: 'i' }
      break
    }
  }
  const amenities = ['parking', 'gym', 'wifi', 'internet', 'balcony', 'lift', 'security', 'power backup']
    .filter((amenity) => lower.includes(amenity))
  if (amenities.length) filter.amenities = { $all: amenities.map((amenity) => new RegExp(`^${escapeRegex(amenity)}$`, 'i')) }
  const properties = await Property.find(filter).populate('owner', 'name').sort({ createdAt: -1 }).limit(12).lean()
  return {
    properties,
    summary: { matchingProperties: properties.length },
    system: 'Act as PropNest AI - Your Smart Rental Assistant. Use only the real approved active property records supplied below. Never invent images, prices, availability, or locations.',
  }
}

router.post('/chat', authenticate, aiLimiter, [
  body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters'),
  body('history').optional().isArray({ max: 20 }),
  validateRequest,
], async (req, res, next) => {
  try {
    if (!env.groqApiKey) return res.status(503).json({ success: false, message: 'AI assistant is not configured. Set GROQ_API_KEY on the server.' })
    const context = await getAuthorizedContext(req.user, req.body.message)
    const history = (req.body.history || [])
      .filter((item) => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
      .slice(-20)
    const safeContext = JSON.stringify({
      summary: context.summary,
      properties: (context.properties || []).map((property) => ({
        id: property._id,
        title: property.title,
        description: property.description,
        propertyType: property.propertyType,
        listingType: property.listingType,
        price: property.price,
        location: property.location,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        furnishing: property.furnishing,
        amenities: property.amenities,
        status: property.status,
        images: (property.images || []).map((image) => image.url),
      })),
    })
    const messages = [
      { role: 'system', content: `${context.system} Base every answer on this JSON only. If matching records are empty, say so clearly. JSON: ${safeContext}` },
      ...history.map((item) => ({ role: item.role, content: item.content.slice(0, 2000) })),
      { role: 'user', content: req.body.message },
    ]
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)
    let response
    try {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.groqApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: env.groqModel, messages, temperature: 0.4, max_tokens: 700 }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      if (response.status === 429) return res.status(429).json({ success: false, message: 'AI quota limit reached. Please try again later.' })
      if (response.status === 404) return res.status(503).json({ success: false, message: 'Configured Groq model is unavailable. Check GROQ_MODEL.' })
      return res.status(502).json({ success: false, message: payload.error?.message || 'The AI provider is temporarily unavailable.' })
    }
    const reply = payload.choices?.[0]?.message?.content
    if (!reply) return res.status(502).json({ success: false, message: 'The AI provider returned an empty response.' })
    res.status(200).json({
      success: true,
      data: { reply, properties: context.properties || [], summary: context.summary },
    })
  } catch (error) {
    if (error.name === 'AbortError' || error.cause?.code) return res.status(502).json({ success: false, message: 'Could not reach the AI provider. Please try again.' })
    next(error)
  }
})

router.get('/tenant/recommendations', authenticate, async (req, res, next) => {
  if (req.user.role !== 'Tenant') return res.status(403).json({ success: false, message: 'Tenant role required' })
  try {
    const context = await getAuthorizedContext(req.user, '')
    res.status(200).json({ success: true, data: { properties: context.properties || [] } })
  } catch (error) { next(error) }
})

module.exports = router
