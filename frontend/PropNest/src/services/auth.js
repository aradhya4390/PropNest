const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'Something went wrong')
  return result.data
}

export function registerUser(values) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify(values) })
}

export function loginUser(values) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(values) })
}