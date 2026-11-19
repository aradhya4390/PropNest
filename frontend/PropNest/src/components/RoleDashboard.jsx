import AdminDashboard from './dashboards/AdminDashboard.jsx'
import OwnerDashboard from './dashboards/OwnerDashboard.jsx'
import TenantDashboard from './dashboards/TenantDashboard.jsx'

export default function RoleDashboard({ user, role, onLogout }) {
  if (role === 'Admin') return <AdminDashboard user={user} onLogout={onLogout} />
  if (role === 'Property Owner') return <OwnerDashboard user={user} onLogout={onLogout} />
  return <TenantDashboard user={user} onLogout={onLogout} />
}
