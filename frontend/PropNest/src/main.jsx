import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './index.css'
import { Landing } from './App.jsx'
import Login from './components/login.jsx'
import RoleDashboard from './components/RoleDashboard.jsx'
import Signup from './components/signup.jsx'

export function AppRoutes() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('propnest_user')) }
    catch { return null }
  })
  const [role, setRole] = useState(() => localStorage.getItem('propnest_role') || 'Tenant')
  const completeAuth = (account) => {
    setUser(account)
    setRole(account.role)
    localStorage.setItem('propnest_user', JSON.stringify(account))
    localStorage.setItem('propnest_role', account.role)
    navigate('/dashboard')
  }
  const logout = () => {
    setUser(null)
    localStorage.removeItem('propnest_user')
    localStorage.removeItem('propnest_role')
    navigate('/')
  }

  const protectedDashboard = user
    ? <RoleDashboard user={user} role={role} onLogout={logout} />
    : <Navigate to="/login" replace />

  return <Routes>
    <Route path="/" element={<Landing onLogin={() => navigate('/login')} onSignup={() => navigate('/signup')} />} />
    <Route path="/login" element={<Login onModeChange={(mode) => navigate(`/${mode}`)} onBack={() => navigate('/')} onComplete={completeAuth} />} />
    <Route path="/signup" element={<Signup onModeChange={(mode) => navigate(`/${mode}`)} onBack={() => navigate('/')} onComplete={completeAuth} />} />
    <Route path="/dashboard" element={protectedDashboard} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>,
)
