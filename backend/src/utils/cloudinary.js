const cloudinary = require('cloudinary').v2
const { env } = require('../config/env')

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
})

function uploadImage(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'propnest/properties', resource_type: 'image', transformation: [{ width: 1600, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }] },
      (error, result) => error ? reject(error) : resolve({
        url: result.secure_url,
        publicId: result.public_id,
        originalName: file.originalname || '',
        format: result.format || '',
        uploadedAt: new Date(),
      }),
    )
    stream.end(file.buffer)
  })
}

function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
}

module.exports = { uploadImage, deleteImage }
