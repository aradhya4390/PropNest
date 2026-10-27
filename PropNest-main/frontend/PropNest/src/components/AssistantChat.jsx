import { useState } from 'react'
import { sendAssistantMessage } from '../services/properties.js'

export default function AssistantChat() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    const content = message.trim()
    if (!content || loading) return
    const conversation = [...messages, { role: 'user', content }]
    setMessages(conversation)
    setMessage('')
    setError('')
    setLoading(true)
    try {
      const { reply } = await sendAssistantMessage(conversation.slice(-12))
      setMessages((current) => [...current, { role: 'assistant', content: reply }].slice(-24))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return <div className={`assistant-widget ${open ? 'assistant-open' : ''}`}>
    {open && <section className="assistant-panel" aria-label="PropNest AI assistant">
      <header><div><strong>PropNest Assistant</strong><span>Ask about properties or listings</span></div><button type="button" onClick={() => setOpen(false)} aria-label="Close assistant">×</button></header>
      <div className="assistant-messages" aria-live="polite">
        {!messages.length && <p className="assistant-welcome">Hi! I can help you write a listing, understand rental details, or get around PropNest. What can I help with?</p>}
        {messages.map((item, index) => <p key={`${item.role}-${index}`} className={`assistant-message assistant-${item.role}`}>{item.content}</p>)}
        {loading && <p className="assistant-message assistant-loading">Thinking…</p>}
      </div>
      {error && <p className="assistant-error" role="alert">{error}</p>}
      <form onSubmit={submit}><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength="4000" rows="2" placeholder="Ask a property question..." aria-label="Message the assistant" /><button type="submit" disabled={loading || !message.trim()} aria-label="Send message">Send</button></form>
    </section>}
    <button type="button" className="assistant-toggle" onClick={() => setOpen((current) => !current)} aria-expanded={open}>{open ? 'Close assistant' : '✦ Ask PropNest AI'}</button>
  </div>
}
