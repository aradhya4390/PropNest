const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function chatWithAssistant(accessToken, message, history) {
  const response = await fetch(`${API_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ message, history }),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'The AI assistant is unavailable')
  return result.data
}
