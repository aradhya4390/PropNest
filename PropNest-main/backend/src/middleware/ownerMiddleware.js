function requirePropertyOwner(req, res, next) {
  if (req.user.role !== 'Property Owner') {
    return res.status(403).json({ success: false, message: 'Only property owners can manage listings' })
  }
  next()
}

module.exports = { requirePropertyOwner }
