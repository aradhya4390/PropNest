const crypto = require('crypto')
const { env } = require('../config/env')

function isConfigured() {
  return Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret)
}

function assertConfigured() {
  if (!isConfigured()) {
    const error = new Error('Property image storage is not configured. Set the Cloudinary environment variables.')
    error.status = 503
    throw error
  }
}

function isSupportedImage(buffer) {
  if (buffer.length < 12) return false
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  const png = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  const webp = buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
  return jpeg || png || webp
}

async function uploadImage(file) {
  assertConfigured()
  if (!isSupportedImage(file.buffer)) {
    const error = new Error('The uploaded file is not a valid JPEG, PNG, or WebP image')
    error.status = 400
    throw error
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'propnest/properties'
  const signature = crypto
    .createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${env.cloudinaryApiSecret}`)
    .digest('hex')
  const form = new FormData()
  form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname)
  form.append('api_key', env.cloudinaryApiKey)
  form.append('timestamp', String(timestamp))
  form.append('folder', folder)
  form.append('signature', signature)

  let response
  let result
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(30000),
    })
    result = await response.json()
  } catch (requestError) {
    const error = new Error('Image storage service could not be reached')
    error.status = 502
    error.cause = requestError
    throw error
  }
  if (!response.ok) {
    const error = new Error(result.error?.message || 'Image storage service rejected the upload')
    error.status = 502
    throw error
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format || '',
    bytes: result.bytes || 0,
    originalName: file.originalname.slice(0, 255),
  }
}

async function deleteImage(publicId) {
  assertConfigured()
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = crypto
    .createHash('sha1')
    .update(`public_id=${publicId}&timestamp=${timestamp}${env.cloudinaryApiSecret}`)
    .digest('hex')
  const form = new URLSearchParams({
    public_id: publicId,
    api_key: env.cloudinaryApiKey,
    timestamp: String(timestamp),
    signature,
  })
  let response
  let result
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/destroy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: AbortSignal.timeout(30000),
    })
    result = await response.json()
  } catch (requestError) {
    const error = new Error('Image storage service could not be reached')
    error.status = 502
    error.cause = requestError
    throw error
  }
  if (!response.ok || !['ok', 'not found'].includes(result.result)) {
    const error = new Error(result.error?.message || 'Unable to delete image from storage')
    error.status = 502
    throw error
  }
}

module.exports = { deleteImage, uploadImage }
