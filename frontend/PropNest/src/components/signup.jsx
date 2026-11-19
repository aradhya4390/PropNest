import { useState } from 'react'
import Button from './Button.jsx'
import Input from './Input.jsx'
import { AuthHeading, AuthLayout } from './login.jsx'
import { registerUser } from '../services/auth.js'

export default function Signup({ onModeChange, onBack, onComplete }) {
  const [form, setForm] = useState({ role: 'Tenant', name: '', email: '', phone: '', password: '', confirm: '', terms: false })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const change = (key) => (event) => setForm({ ...form, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value })
  const submit = (event) => {
    event.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Please enter your name'
    if (!form.email.includes('@')) next.email = 'Enter a valid email address'
    if (form.phone.length < 10) next.phone = 'Enter a valid phone number'
    if (form.password.length < 8) next.password = 'Use at least 8 characters'
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match'
    if (!form.terms) next.terms = 'Please accept the terms to continue'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    registerUser({ name: form.name.trim(), email: form.email, password: form.password, role: form.role })
      .then(({ user, accessToken }) => onComplete({ ...user, accessToken }))
      .catch((error) => setErrors({ form: error.message }))
      .finally(() => setLoading(false))
  }

  return <AuthLayout onBack={onBack}>
    <AuthHeading eyebrow="CREATE YOUR ACCOUNT" title="Start with PropNest." description="Tell us a little about yourself to get started." />
    <div className="role-picker" aria-label="Choose your account type"><p>I’m here as a</p><div>{['Tenant', 'Property Owner'].map((item) => <button key={item} type="button" className={form.role === item ? 'selected' : ''} onClick={() => setForm({ ...form, role: item })}>{item}<span>{form.role === item ? '✓' : ''}</span></button>)}</div></div>
    <form onSubmit={submit} noValidate>
      {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
      <Input id="name" label="Full name" value={form.name} onChange={change('name')} error={errors.name} placeholder="Your name" autoComplete="name" />
      <Input id="email" label="Email address" type="email" value={form.email} onChange={change('email')} error={errors.email} placeholder="you@example.com" autoComplete="email" />
      <Input id="phone" label="Phone number" type="tel" value={form.phone} onChange={change('phone')} error={errors.phone} placeholder="10 digit mobile number" autoComplete="tel" />
      <Input id="password" label="Password" type="password" value={form.password} onChange={change('password')} error={errors.password} placeholder="At least 6 characters" autoComplete="new-password" />
      <Input id="confirm" label="Confirm password" type="password" value={form.confirm} onChange={change('confirm')} error={errors.confirm} placeholder="Repeat your password" autoComplete="new-password" />
      <label className={`terms-check ${errors.terms ? 'has-error' : ''}`}><input type="checkbox" checked={form.terms} onChange={change('terms')} /><span>I agree to the PropNest terms and privacy policy.</span></label>
      {errors.terms && <small className="terms-error">{errors.terms}</small>}
      <Button type="submit" className="auth-submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'} <span>↗</span></Button>
    </form>
    <p className="auth-switch">Already have an account? <button type="button" onClick={() => onModeChange('login')}>Log in</button></p>
  </AuthLayout>
}