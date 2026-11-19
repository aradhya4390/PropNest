import { useEffect, useState } from 'react'
import Brand from '../Brand.jsx'
import { connectNotifications } from '../../services/socket.js'

export default function DashboardHeader({ user, onLogout }) {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => connectNotifications(user.accessToken, (notification) => {
    setNotifications((current) => [notification, ...current].slice(0, 20))
  }), [user.accessToken])

  return <header className="role-header">
    <Brand />
    <div className="role-user"><div className="notification-wrap"><button className="notification-bell" onClick={() => setOpen((current) => !current)} aria-label="Notifications">♧{notifications.length > 0 && <b>{notifications.length > 9 ? '9+' : notifications.length}</b>}</button>{open && <div className="role-notification-pop"><strong>Notifications</strong>{notifications.length ? notifications.map((notification) => <article key={notification.id}><b>{notification.title}</b><p>{notification.message}</p><small>{new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></article>) : <p>No new notifications.</p>}</div>}</div><span>{user.name}</span><button onClick={onLogout}>Sign out ↗</button></div>
  </header>
}
