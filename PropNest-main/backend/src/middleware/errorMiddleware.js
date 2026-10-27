function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Route not found' })
}

function errorHandler(error, req, res, next) {
  if (error.code === 11000) return res.status(409).json({ success: false, message: 'Email is already registered' })
  if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: error.message })
  if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid resource identifier' })
  if (error.name === 'MulterError') {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'Each image must be 5 MB or smaller' : 'Invalid image upload'
    return res.status(400).json({ success: false, message })
  }
  if (error.status && error.status < 500) return res.status(error.status).json({ success: false, message: error.message })
  console.error(error)
  res.status(500).json({ success: false, message: 'Internal server error' })
}

module.exports = { notFound, errorHandler }