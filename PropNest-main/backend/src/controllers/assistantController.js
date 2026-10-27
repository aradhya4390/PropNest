const { env } = require('../config/env')

async function chat(req, res, next) {
  const { messages } = req.body
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 12) {
    return res.status(400).json({ success: false, message: 'Send between 1 and 12 chat messages' })
  }
  if (messages.some((message) => !message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string' || !message.content.trim() || message.content.length > 4000)) {
    return res.status(400).json({ success: false, message: 'Each message must contain a valid role and 1–4000 characters of text' })
  }
  if (messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ success: false, message: 'The latest message must be from the user' })
  }
  if (!env.groqApiKey) {
    return res.status(503).json({ success: false, message: 'The AI assistant is not configured. Add GROQ_API_KEY on the server.' })
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.groqApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.groqModel,
        temperature: 0.7,
        max_tokens: 800,
        messages: [
          { role: 'system', content: 'You are PropNest Assistant. Help users with property listings, renting, buying, and using PropNest. Be clear, practical, and honest. Do not invent details about a specific listing; ask the user to share them when needed.' },
          ...messages.map(({ role, content }) => ({ role, content: content.trim() })),
        ],
      }),
      signal: AbortSignal.timeout(25000),
    })
    const result = await response.json()
    if (!response.ok) {
      if (response.status === 429) return res.status(429).json({ success: false, message: 'The AI service is busy or its usage limit was reached. Please try again shortly.' })
      if (response.status === 400 || response.status === 404) return res.status(503).json({ success: false, message: 'The configured AI model is unavailable. Check GROQ_MODEL on the server.' })
      console.error('Groq request failed:', result.error?.message || response.statusText)
      return res.status(502).json({ success: false, message: 'The AI assistant could not complete that request. Please try again.' })
    }
    const reply = result.choices?.[0]?.message?.content?.trim()
    if (!reply) return res.status(502).json({ success: false, message: 'The AI assistant returned an empty response. Please try again.' })
    res.json({ success: true, data: { reply } })
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ success: false, message: 'The AI assistant took too long to respond. Please try again.' })
    }
    if (error instanceof TypeError || error.name === 'FetchError') {
      return res.status(502).json({ success: false, message: 'The AI service could not be reached. Please try again.' })
    }
    next(error)
  }
}

module.exports = { chat }
