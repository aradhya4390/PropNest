const multer = require('multer')

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter(req, file, callback) {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error('Images must be JPEG, PNG, or WebP')
      error.status = 400
      return callback(error)
    }
    callback(null, true)
  },
})

module.exports = { uploadImages }
