import { apiRequest } from './api.js'

export function registerUser(values) {
  return apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(values) })
}

export function loginUser(values) {
  return apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(values) })
}