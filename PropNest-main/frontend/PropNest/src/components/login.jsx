import { useState } from 'react'
import Brand from './Brand.jsx'
import Button from './Button.jsx'
import Input from './Input.jsx'
import { loginUser } from '../services/auth.js'

export default function Login({ onModeChange, onBack, onComplete }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const change = (key) => (event) => setForm({ ...form, [key]: event.target.value })
  const submit = (event) => {
    event.preventDefault()
    const next = {}
    if (!form.email.includes('@')) next.email = 'Enter a valid email address'
    if (form.password.length < 8) next.password = 'Use at least 8 characters'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    loginUser(form)
      .then(({ user, accessToken }) => onComplete({ ...user, accessToken }))
      .catch((error) => setErrors({ form: error.message }))
      .finally(() => setLoading(false))
  }

  return <AuthLayout onBack={onBack}>
    <AuthHeading eyebrow="WELCOME BACK" title="Good to see you." description="Log in to continue your rental journey." />
    <form onSubmit={submit} noValidate>
      {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
      <Input id="email" label="Email address" type="email" value={form.email} onChange={change('email')} error={errors.email} placeholder="you@example.com" autoComplete="email" />
      <Input id="password" label="Password" type="password" value={form.password} onChange={change('password')} error={errors.password} placeholder="At least 6 characters" autoComplete="current-password" />
      <Button type="submit" className="auth-submit" disabled={loading}>{loading ? 'Logging in...' : 'Log in'} <span>↗</span></Button>
    </form>
    <p className="auth-switch">New to PropNest? <button type="button" onClick={() => onModeChange('signup')}>Create an account</button></p>
  </AuthLayout>
}

export function AuthLayout({ children, onBack }) {
  return <div className="auth-page"><div className="auth-visual"><button className="back-public" onClick={onBack}>← Back to PropNest</button><Brand light /><div className="auth-visual-copy"><p className="eyebrow">A PLACE TO BEGIN</p><h1>Make yourself<br /><em>at home.</em></h1><p>Join a more considered way to rent, manage, and belong.</p></div><div className="auth-quote">“The whole rental journey finally feels human.”<small>— Neha, PropNest resident</small></div></div><div className="auth-panel"><div className="auth-mobile-brand"><Brand /></div><div className="auth-card">{children}</div></div></div>
}

export function AuthHeading({ eyebrow, title, description }) {
  return <div className="auth-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div>
}