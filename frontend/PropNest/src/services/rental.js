const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function request(path, accessToken, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, ...(options.headers || {}) },
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'Something went wrong')
  return result.data
}

export function createRentalRequest(accessToken, propertyId, message) {
  return request('/rental-requests', accessToken, { method: 'POST', body: JSON.stringify({ propertyId, message }) })
}
export function getTenantRequests(accessToken) {
  return request('/rental-requests/tenant', accessToken)
}
export function getOwnerRequests(accessToken) {
  return request('/rental-requests/owner', accessToken)
}
export function updateOwnerRequest(accessToken, id, status, visitDate) {
  return request(`/rental-requests/owner/${id}`, accessToken, { method: 'PATCH', body: JSON.stringify({ status, visitDate }) })
}
