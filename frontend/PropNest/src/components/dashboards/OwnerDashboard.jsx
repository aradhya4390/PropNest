import { useCallback, useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Button from '../Button.jsx'
import DashboardHeader from './DashboardHeader.jsx'
import AIAssistant from './AIAssistant.jsx'
import { createProperty, deleteProperty, deletePropertyImage, getDashboard, getProperties, updateProperty } from '../../services/properties.js'
import { getOwnerRequests, updateOwnerRequest } from '../../services/rental.js'

const emptyForm = { title: '', description: '', propertyType: 'Apartment', listingType: 'Rent', price: '', location: '', address: '', bedrooms: '', bathrooms: '', area: '', amenities: '', furnishing: 'Unfurnished', status: 'pending' }

export default function OwnerDashboard({ user, onLogout }) {
  const [view, setView] = useState('dashboard')
  const [properties, setProperties] = useState([])
  const [summary, setSummary] = useState({ total: 0, active: 0, rented: 0, sold: 0, pending: 0 })
  const [requests, setRequests] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [imageError, setImageError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const [propertyData, dashboardData, requestData] = await Promise.all([
      getProperties(user.accessToken),
      getDashboard(user.accessToken),
      getOwnerRequests(user.accessToken),
    ])
    setProperties(propertyData.properties)
    setSummary(dashboardData.summary)
    setRequests(requestData.requests)
  }, [user.accessToken])

  useEffect(() => {
    const timer = setTimeout(() => { refresh().catch((reason) => setError(reason.message)) }, 0)
    return () => clearTimeout(timer)
  }, [refresh])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFiles([])
    setPreviews([])
    setExistingImages([])
    setImageError('')
    setView('create')
  }
  const openEdit = (property) => {
    setEditing(property)
    setForm({
      title: property.title, description: property.description, propertyType: property.propertyType,
      listingType: property.listingType, price: property.price, location: property.location,
      address: property.address, bedrooms: property.bedrooms, bathrooms: property.bathrooms,
      area: property.area, amenities: (property.amenities || []).join(', '),
      furnishing: property.furnishing || 'Unfurnished', status: property.status,
    })
    setFiles([])
    setPreviews([])
    setExistingImages(property.images || [])
    setImageError('')
    setView('create')
  }
  const change = (key) => (event) => setForm({ ...form, [key]: event.target.value })
  const addFiles = (incomingFiles) => {
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const incoming = Array.from(incomingFiles)
    const invalidType = incoming.find((file) => !acceptedTypes.includes(file.type))
    const invalidSize = incoming.find((file) => file.size > 5 * 1024 * 1024)
    const remaining = 5 - existingImages.length - files.length
    if (invalidType) return setImageError('Only JPG, PNG, and WebP images are supported.')
    if (invalidSize) return setImageError('Each image must be smaller than 5 MB.')
    if (remaining <= 0) return setImageError('A property can have at most 5 images.')
    const selected = incoming.slice(0, remaining)
    setImageError(selected.length < incoming.length ? 'Only five images can be attached to a property.' : '')
    setFiles((current) => [...current, ...selected])
    setPreviews((current) => [...current, ...selected.map((file) => URL.createObjectURL(file))])
  }
  const selectFiles = (event) => { addFiles(event.target.files); event.target.value = '' }
  const removeExistingImage = async (image) => {
    if (!editing) return
    setLoading(true)
    setImageError('')
    try {
      await deletePropertyImage(user.accessToken, editing._id, image.publicId)
      setExistingImages((current) => current.filter((item) => item.publicId !== image.publicId))
      setNotice('Image removed from the listing.')
    } catch (reason) { setImageError(reason.message) }
    finally { setLoading(false) }
  }
  const removeNewPreview = (index) => {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))
    setPreviews((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }
  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (editing) await updateProperty(user.accessToken, editing._id, form, files)
      else await createProperty(user.accessToken, form, files)
      await refresh()
      setNotice(editing ? 'Property updated successfully.' : 'Property submitted for review.')
      setView('properties')
    } catch (reason) {
      setError(reason.message)
    } finally {
      setLoading(false)
    }
  }
  const confirmDelete = async () => {
    try {
      await deleteProperty(user.accessToken, deleteTarget._id)
      await refresh()
      setDeleteTarget(null)
      setDetails(null)
      setNotice('Property deleted successfully.')
    } catch (reason) { setError(reason.message) }
  }
  const respondToRequest = async (request, status) => {
    try {
      await updateOwnerRequest(user.accessToken, request._id, status)
      await refresh()
      setNotice(`Rental request ${status}.`)
    } catch (reason) { setError(reason.message) }
  }
  const chartData = [['Active', summary.active], ['Pending', summary.pending], ['Rented', summary.rented], ['Sold', summary.sold]].map(([label, value]) => ({ label, value }))

  return <div className="role-dashboard">
    <DashboardHeader user={user} onLogout={onLogout} />
    <main className="role-main">
      <section className="role-intro"><p className="eyebrow">PROPERTY OWNER WORKSPACE</p><h1>Welcome, {user.name?.split(' ')[0]}.</h1><p>Manage listings, tenants, and your rental activity.</p></section>
      {notice && <p className="owner-notice" role="status">{notice}<button onClick={() => setNotice('')}>×</button></p>}
      {error && <p className="owner-error" role="alert">{error}<button onClick={() => setError('')}>×</button></p>}
      <nav className="owner-tabs">
        {[['dashboard', 'Dashboard'], ['properties', 'My Properties'], ['requests', 'Rental Requests']].map(([key, label]) => <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>{label}</button>)}
        <button onClick={openCreate}>Add Property</button>
      </nav>
      {view === 'dashboard' && <>
        <section className="owner-summary">{[['Total', summary.total], ['Active', summary.active], ['Pending', summary.pending], ['Rented', summary.rented], ['Sold', summary.sold]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
        <section className="role-section analytics-card"><div className="role-section-heading"><div><p className="eyebrow">LISTING HEALTH</p><h2>Your portfolio at a glance</h2></div></div><div className="analytics-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e5df" /><XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: '#f1f1eb' }} /><Bar dataKey="value" fill="#78bdb0" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
        <section className="role-section"><div className="role-section-heading"><div><p className="eyebrow">RECENT LISTINGS</p><h2>Your properties</h2></div><button className="text-button" onClick={openCreate}>Add property <span>＋</span></button></div><OwnerPropertyGrid properties={properties.slice(0, 6)} onDetails={setDetails} onEdit={openEdit} onDelete={setDeleteTarget} /></section>
      </>}
      {view === 'properties' && <section className="role-section"><div className="role-section-heading"><div><p className="eyebrow">YOUR LISTINGS</p><h2>My Properties</h2></div><button className="text-button" onClick={openCreate}>Add property <span>＋</span></button></div><OwnerPropertyGrid properties={properties} onDetails={setDetails} onEdit={openEdit} onDelete={setDeleteTarget} /></section>}
      {view === 'requests' && <section className="role-section"><div className="role-section-heading"><div><p className="eyebrow">TENANT ACTIVITY</p><h2>Rental requests</h2></div></div><div className="request-list">{requests.length ? requests.map((request) => <article key={request._id}><div><strong>{request.property?.title || 'Property'}</strong><p>{request.tenant?.name} • {request.tenant?.email}</p><span>{request.message || 'No message supplied'}</span></div><div className="request-actions"><b>{request.status}</b><button onClick={() => respondToRequest(request, 'accepted')}>Accept</button><button onClick={() => respondToRequest(request, 'rejected')}>Reject</button></div></article>) : <div className="role-empty"><h3>No rental requests</h3></div>}</div></section>}
      {view === 'create' && <section className="role-section add-home-section"><div className="role-section-heading"><div><p className="eyebrow">{editing ? 'EDIT LISTING' : 'CREATE A LISTING'}</p><h2>{editing ? 'Update property' : 'Share a property'}</h2></div></div>
        <form className="owner-form" onSubmit={submit}>
          <div className="owner-form-grid">
            <label>Property title<input required minLength="3" maxLength="120" value={form.title} onChange={change('title')} /></label>
            <label>Property type<select value={form.propertyType} onChange={change('propertyType')}><option>Apartment</option><option>House</option><option>Villa</option><option>Studio</option><option>Commercial</option><option>Plot</option></select></label>
            <label>Listing type<select value={form.listingType} onChange={change('listingType')}><option>Rent</option><option>Sale</option></select></label>
            <label>Price / Rent<input required type="number" min="0" value={form.price} onChange={change('price')} /></label>
            <label>Location<input required value={form.location} onChange={change('location')} /></label>
            <label>Address<input required value={form.address} onChange={change('address')} /></label>
            <label>Bedrooms<input required type="number" min="0" value={form.bedrooms} onChange={change('bedrooms')} /></label>
            <label>Bathrooms<input required type="number" min="0" value={form.bathrooms} onChange={change('bathrooms')} /></label>
            <label>Area (sq ft)<input required type="number" min="1" value={form.area} onChange={change('area')} /></label>
            <label>Furnishing<select value={form.furnishing} onChange={change('furnishing')}><option>Furnished</option><option>Semi-Furnished</option><option>Unfurnished</option></select></label>
            <label>Status<select value={form.status} onChange={change('status')}><option value="pending">Pending</option><option value="active">Active</option><option value="rented">Rented</option><option value="sold">Sold</option></select></label>
            <label className="owner-full">Amenities<input value={form.amenities} onChange={change('amenities')} placeholder="Parking, Gym, Balcony" /></label>
            <label className="owner-full">Description<textarea required minLength="10" maxLength="5000" value={form.description} onChange={change('description')} /></label>
            <label className="owner-full image-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files) }}>Property images (maximum 5)<span>Drop images here or choose files</span><small>JPG, PNG, WebP · up to 5 MB each</small><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectFiles} /></label>
          </div>
            {imageError && <p className="owner-error" role="alert">{imageError}</p>}
            {existingImages.length > 0 && <div className="image-previews existing-previews"><p className="eyebrow">UPLOADED IMAGES</p>{existingImages.map((image) => <div key={image.publicId}><img src={image.url} alt={image.originalName || 'Uploaded property'} /><button type="button" disabled={loading} onClick={() => removeExistingImage(image)}>×</button></div>)}</div>}
            {previews.length > 0 && <div className="image-previews"><p className="eyebrow">NEW IMAGES</p>{previews.map((src, index) => <div key={src + index}><img src={src} alt={`Preview ${index + 1}`} /><button type="button" onClick={() => removeNewPreview(index)}>×</button></div>)}</div>}
          <div className="owner-form-actions"><Button type="submit" disabled={loading}>{loading ? 'Saving...' : editing ? 'Update property' : 'Submit property'} <span>↗</span></Button><button type="button" className="text-button" onClick={() => setView('properties')}>Cancel</button></div>
        </form>
      </section>}
    </main>
    {details && <PropertyDetails property={details} onClose={() => setDetails(null)} onEdit={() => openEdit(details)} onDelete={() => setDeleteTarget(details)} />}
    {deleteTarget && <div className="modal-backdrop"><div className="delete-modal" role="dialog" aria-modal="true"><p className="eyebrow">CONFIRM DELETE</p><h2>Delete this property?</h2><p>This removes the listing and its uploaded images permanently.</p><div><button className="text-button" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="danger-button" onClick={confirmDelete}>Delete property</button></div></div></div>}
    <AIAssistant user={user} title="Your Smart Property Manager" welcome="I can analyze your listings or help write a stronger property description." quickActions={['Analyze my listings', 'Check pending properties', 'Improve property title', 'Generate rental management tips']} />
  </div>
}

function OwnerPropertyGrid({ properties, onDetails, onEdit, onDelete }) {
  if (!properties.length) return <div className="role-empty"><span>＋</span><h3>No properties yet</h3><p>Add a listing to see it here.</p></div>
  return <div className="role-home-grid">{properties.map((property) => <article className="role-home-card" key={property._id}>
    <button className="card-image-button" onClick={() => onDetails(property)}><img src={property.images?.[0]?.url || 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85'} alt={property.title} /></button>
    <div><p className="eyebrow">{property.status?.toUpperCase()}</p><h3>{property.title}</h3><p>{property.location}</p><strong>₹{Number(property.price).toLocaleString('en-IN')}{property.listingType === 'Rent' ? ' / month' : ''}</strong><span>{property.bedrooms} beds • {property.bathrooms} baths • {property.area} sq ft</span><div className="card-actions"><button onClick={() => onDetails(property)}>View</button><button onClick={() => onEdit(property)}>Edit</button><button className="delete" onClick={() => onDelete(property)}>Delete</button></div></div>
  </article>)}</div>
}

function PropertyDetails({ property, onClose, onEdit, onDelete }) {
  return <div className="modal-backdrop"><section className="property-details-modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose}>×</button><div className="details-gallery">{property.images?.length ? property.images.map((image) => <img key={image.publicId} src={image.url} alt={property.title} />) : <img src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85" alt={property.title} />}</div><p className="eyebrow">{property.propertyType} • {property.status?.toUpperCase()}</p><h2>{property.title}</h2><strong>₹{Number(property.price).toLocaleString('en-IN')}{property.listingType === 'Rent' ? ' / month' : ''}</strong><p>{property.location} — {property.address}</p><p>{property.description}</p><p>{property.bedrooms} bedrooms • {property.bathrooms} bathrooms • {property.area} sq ft • {property.furnishing}</p>{property.amenities?.length > 0 && <p><b>Amenities:</b> {property.amenities.join(', ')}</p>}<div className="details-actions"><button className="text-button" onClick={onEdit}>Edit property</button><button className="danger-button" onClick={onDelete}>Delete</button></div></section></div>
}
