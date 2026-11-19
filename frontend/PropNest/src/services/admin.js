const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function adminRequest(path, accessToken, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, ...(options.headers || {}) },
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'Something went wrong')
  return result.data
}

export function getAdminSummary(accessToken) {
  return adminRequest('/admin/summary', accessToken)
}
export function getAdminUsers(accessToken, params = {}) {
  const query = new URLSearchParams(params)
  return adminRequest(`/admin/users${query.toString() ? `?${query}` : ''}`, accessToken)
}
export function getModerationProperties(accessToken, params = {}) {
  const query = new URLSearchParams(params)
  return adminRequest(`/admin/properties${query.toString() ? `?${query}` : ''}`, accessToken)
}
export function moderateProperty(accessToken, id, status, reason) {
  return adminRequest(`/admin/properties/${id}/moderate`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason }),
  })
}
