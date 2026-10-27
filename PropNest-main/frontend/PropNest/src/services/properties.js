import { apiRequest } from './api.js'

export function getMyProperties() {
  return apiRequest('/properties/mine')
}

export function getOwnerDashboard() {
  return apiRequest('/properties/dashboard')
}

export function getPublicProperties() {
  return apiRequest('/properties')
}

export function createProperty(values) {
  return apiRequest('/properties', { method: 'POST', body: JSON.stringify(values) })
}

export function updateProperty(id, values) {
  return apiRequest(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(values) })
}

export function deleteProperty(id) {
  return apiRequest(`/properties/${id}`, { method: 'DELETE' })
}

export function uploadPropertyImages(id, files) {
  const body = new FormData()
  files.forEach((file) => body.append('images', file))
  return apiRequest(`/properties/${id}/images`, { method: 'POST', body })
}

export function deletePropertyImage(id, imageId) {
  return apiRequest(`/properties/${id}/images/${imageId}`, { method: 'DELETE' })
}

export function sendAssistantMessage(messages) {
  return apiRequest('/assistant/chat', { method: 'POST', body: JSON.stringify({ messages }) })
}
