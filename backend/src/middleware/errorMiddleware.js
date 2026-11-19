function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Route not found' })
}

function errorHandler(error, req, res, next) {
  if (error.code === 11000) return res.status(409).json({ success: false, message: 'Email is already registered' })
  if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Invalid request data' })
  if (error.name === 'MulterError') return res.status(400).json({ success: false, message: error.message })
  if (error.http_code) return res.status(error.http_code).json({ success: false, message: error.message })
  console.error(error)
  res.status(500).json({ success: false, message: 'Internal server error' })
}

module.exports = { notFound, errorHandler }