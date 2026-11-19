import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { chatWithAssistant } from '../../services/ai.js'

export default function AIAssistant({ user, title, welcome, quickActions = [] }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', content: welcome }])

  const send = async (event) => {
    event?.preventDefault()
    const message = input.trim()
    if (!message || loading) return
    const history = [...messages, { role: 'user', content: message }]
    setMessages(history)
    setInput('')
    setLoading(true)
    try {
      const data = await chatWithAssistant(user.accessToken, message, history)
      setMessages((current) => [...current, { role: 'assistant', content: data.reply, properties: data.properties || [] }])
    } catch (reason) {
      setMessages((current) => [...current, { role: 'assistant', content: `Error: ${reason.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const runQuickAction = (message) => {
    setInput(message)
  }

  return <>
    <motion.button className="ai-launch" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => setOpen((current) => !current)} aria-label={`Open ${title}`}>✦</motion.button>
    <AnimatePresence>{open && <motion.section className="ai-panel" initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
      <header><div><p className="eyebrow">PROP NEST AI</p><strong>{title}</strong></div><button onClick={() => setOpen(false)} aria-label="Close assistant">×</button></header>
      {quickActions.length > 0 && <div className="ai-quick-actions">{quickActions.map((action) => <button key={action} onClick={() => runQuickAction(action)}>{action}</button>)}</div>}
      <div className="ai-messages">{messages.map((message, index) => <motion.div key={index} className={`ai-message ${message.role}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}><p>{message.content}</p>{message.properties?.length > 0 && <div className="ai-property-results">{message.properties.slice(0, 3).map((property) => <a className="ai-property-card" href={`/dashboard?property=${property._id}`} key={property._id}><img src={property.images?.[0]?.url || '/favicon.svg'} alt="" /><span><strong>{property.title}</strong><small>{property.location}</small><b>₹{Number(property.price).toLocaleString('en-IN')} {property.listingType === 'Rent' ? '/ month' : ''}</b></span></a>)}</div>}</motion.div>)}</div>
      {loading && <motion.p className="ai-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Thinking…</motion.p>}
      <form onSubmit={send}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask PropNest AI…" /><button type="submit" disabled={loading}>Send</button></form>
    </motion.section>}</AnimatePresence>
  </>
}
