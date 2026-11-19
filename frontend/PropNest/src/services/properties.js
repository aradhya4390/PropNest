const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function propertyRequest(path, accessToken, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'Something went wrong')
  return result.data
}

export function getDashboard(accessToken) {
  return propertyRequest('/properties/dashboard', accessToken)
}

export function getProperties(accessToken) {
  return propertyRequest('/properties', accessToken)
}

export function getProperty(accessToken, id) {
  return propertyRequest(`/properties/${id}`, accessToken)
}

export async function searchPublicProperties(filters = {}) {
  const query = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value != null) query.set(key, value)
  })
  const response = await fetch(`${API_URL}/properties/public${query.toString() ? `?${query}` : ''}`)
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'Could not load properties')
  return result.data
}

export async function getPublicProperty(id) {
  const response = await fetch(`${API_URL}/properties/public/${id}`)
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'Could not load property')
  return result.data.property
}

export function createProperty(accessToken, form, files) {
  const body = new FormData()
  Object.entries(form).forEach(([key, value]) => body.append(key, Array.isArray(value) ? value.join(',') : value))
  Array.from(files || []).forEach((file) => body.append('images', file))
  return propertyRequest('/properties', accessToken, { method: 'POST', body })
}

export function updateProperty(accessToken, id, form, files) {
  const body = new FormData()
  Object.entries(form).forEach(([key, value]) => body.append(key, Array.isArray(value) ? value.join(',') : value))
  Array.from(files || []).forEach((file) => body.append('images', file))
  return propertyRequest(`/properties/${id}`, accessToken, { method: 'PUT', body })
}

export function deleteProperty(accessToken, id) {
  return propertyRequest(`/properties/${id}`, accessToken, { method: 'DELETE' })
}

export function deletePropertyImage(accessToken, id, publicId) {
  return propertyRequest(`/properties/${id}/images/${encodeURIComponent(publicId)}`, accessToken, { method: 'DELETE' })
}
