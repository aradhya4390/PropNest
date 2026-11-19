import { useCallback, useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import DashboardHeader from './DashboardHeader.jsx'
import AIAssistant from './AIAssistant.jsx'
import { getAdminSummary, getAdminUsers, getModerationProperties, moderateProperty } from '../../services/admin.js'

export default function AdminDashboard({ user, onLogout }) {
  const [view, setView] = useState('overview')
  const [summary, setSummary] = useState({})
  const [properties, setProperties] = useState([])
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('pending')
  const [details, setDetails] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try {
      const [summaryData, propertyData, userData] = await Promise.all([
        getAdminSummary(user.accessToken),
        getModerationProperties(user.accessToken, { status }),
        getAdminUsers(user.accessToken),
      ])
      setSummary({ ...summaryData.summary, ...summaryData.rentals })
      setProperties(propertyData.properties)
      setUsers(userData.users)
    } catch (reason) { setError(reason.message) }
  }, [status, user.accessToken])

  useEffect(() => {
    const timer = setTimeout(() => { load().catch(() => {}) }, 0)
    return () => clearTimeout(timer)
  }, [load])

  const moderate = async () => {
    try {
      await moderateProperty(user.accessToken, confirm.property._id, confirm.status, reason)
      setConfirm(null)
      setDetails(null)
      setReason('')
      setNotice(`Property ${confirm.status}.`)
      await load()
    } catch (reason) { setError(reason.message) }
  }
  const chartData = [{ label: 'Tenants', value: summary.tenants || 0 }, { label: 'Owners', value: summary.owners || 0 }, { label: 'Properties', value: summary.properties || 0 }, { label: 'Pending', value: summary.pending || 0 }]

  return <div className="role-dashboard">
    <DashboardHeader user={user} onLogout={onLogout} />
    <main className="role-main">
      <section className="role-intro"><p className="eyebrow">ADMIN WORKSPACE</p><h1>Platform control.</h1><p>Moderate listings, review users, and monitor PropNest activity.</p></section>
      {notice && <p className="owner-notice">{notice}<button onClick={() => setNotice('')}>×</button></p>}
      {error && <p className="owner-error">{error}<button onClick={() => setError('')}>×</button></p>}
      <nav className="owner-tabs"><button className={view === 'overview' ? 'active' : ''} onClick={() => setView('overview')}>Overview</button><button className={view === 'properties' ? 'active' : ''} onClick={() => setView('properties')}>Property Moderation</button><button className={view === 'users' ? 'active' : ''} onClick={() => setView('users')}>Users</button></nav>
      {view === 'overview' && <><section className="owner-summary">{[['Users', summary.users], ['Tenants', summary.tenants], ['Owners', summary.owners], ['Properties', summary.properties], ['Pending', summary.pending], ['Active', summary.active], ['Rejected', summary.rejected], ['Rental requests', summary.pending ? (summary.pending + (summary.accepted || 0) + (summary.rejected || 0)) : 0]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value || 0}</strong></article>)}</section><section className="role-section analytics-card"><div className="role-section-heading"><div><p className="eyebrow">PLATFORM INVENTORY</p><h2>Marketplace health</h2></div></div><div className="analytics-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e5df" /><XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: '#f1f1eb' }} /><Bar dataKey="value" fill="#78bdb0" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></section></>}
      {view === 'properties' && <section className="role-section"><div className="role-section-heading"><div><p className="eyebrow">LISTING MODERATION</p><h2>Review properties</h2></div><select className="admin-filter" value={status} onChange={(event) => setStatus(event.target.value)}><option value="pending">Pending</option><option value="active">Active</option><option value="rejected">Rejected</option></select></div><div className="admin-property-list">{properties.length ? properties.map((property) => <article key={property._id}><img src={property.images?.[0]?.url || 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85'} alt={property.title} /><div><p className="eyebrow">{property.status}</p><h3>{property.title}</h3><p>{property.location}</p><span>Owner: {property.owner?.name} ({property.owner?.email})</span><div className="card-actions"><button onClick={() => setDetails(property)}>Inspect</button>{property.status !== 'active' && <button onClick={() => setConfirm({ property, status: 'active' })}>Approve</button>}{property.status !== 'rejected' && <button className="delete" onClick={() => setConfirm({ property, status: 'rejected' })}>Reject</button>}</div></div></article>) : <div className="role-empty"><h3>No properties in this status</h3></div>}</div></section>}
      {view === 'users' && <section className="role-section"><div className="role-section-heading"><div><p className="eyebrow">REGISTERED USERS</p><h2>Users</h2></div></div><div className="admin-user-list">{users.map((account) => <article key={account._id}><div><strong>{account.name}</strong><p>{account.email}</p></div><span>{account.role}</span></article>)}</div></section>}
    </main>
    {details && <div className="modal-backdrop"><section className="property-details-modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={() => setDetails(null)}>×</button><div className="details-gallery">{details.images?.length ? details.images.map((image) => <img key={image.publicId} src={image.url} alt={details.title} />) : <img src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85" alt={details.title} />}</div><p className="eyebrow">{details.propertyType} • {details.status}</p><h2>{details.title}</h2><p>{details.description}</p><p>{details.location} • ₹{Number(details.price).toLocaleString('en-IN')}</p><div className="details-actions"><button className="danger-button" onClick={() => setConfirm({ property: details, status: 'rejected' })}>Reject</button><button className="dark-button" onClick={() => setConfirm({ property: details, status: 'active' })}>Approve</button></div></section></div>}
    {confirm && <div className="modal-backdrop"><div className="delete-modal" role="dialog" aria-modal="true"><p className="eyebrow">CONFIRM ACTION</p><h2>{confirm.status === 'active' ? 'Approve' : 'Reject'} this property?</h2>{confirm.status === 'rejected' && <label>Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength="500" /></label>}<div><button className="text-button" onClick={() => setConfirm(null)}>Cancel</button><button className={confirm.status === 'active' ? 'dark-button' : 'danger-button'} onClick={moderate}>Confirm</button></div></div></div>}
    <AIAssistant user={user} title="Admin Intelligence Assistant" welcome="I can summarize platform statistics and pending moderation activity." quickActions={['How many properties need approval?', 'Summarize registered users', 'Summarize platform activity']} />
  </div>
}
