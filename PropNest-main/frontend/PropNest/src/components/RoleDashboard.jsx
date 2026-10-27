import { useCallback, useEffect, useState } from 'react'
import Brand from './Brand.jsx'
import Button from './Button.jsx'
import AssistantChat from './AssistantChat.jsx'
import {
  createProperty,
  deleteProperty,
  deletePropertyImage,
  getMyProperties,
  getOwnerDashboard,
  getPublicProperties,
  updateProperty,
  uploadPropertyImages,
} from '../services/properties.js'

const emptyForm = {
  title: '',
  description: '',
  propertyType: 'Apartment',
  listingType: 'Rent',
  price: '',
  city: '',
  state: '',
  postalCode: '',
  address: '',
  bedrooms: '1',
  bathrooms: '1',
  area: '',
  amenities: '',
  status: 'Pending',
}

function priceLabel(property) {
  const price = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(property.price)
  return `₹${price}${property.listingType === 'Rent' ? ' / month' : ''}`
}

function locationLabel(property) {
  return [property.location?.city, property.location?.state].filter(Boolean).join(', ')
}

function formValues(property) {
  return property ? {
    title: property.title,
    description: property.description,
    propertyType: property.propertyType,
    listingType: property.listingType,
    price: String(property.price),
    city: property.location.city,
    state: property.location.state,
    postalCode: property.location.postalCode || '',
    address: property.address,
    bedrooms: String(property.bedrooms),
    bathrooms: String(property.bathrooms),
    area: String(property.area),
    amenities: (property.amenities || []).join(', '),
    status: property.status,
  } : emptyForm
}

function PropertyCard({ property, owner, onEdit, onDelete, onDetails }) {
  return <article className="role-home-card">
    <button className="property-card-image" type="button" onClick={onDetails} aria-label={`View ${property.title}`}>
      {property.images?.[0]?.url
        ? <img src={property.images[0].url} alt={property.title} />
        : <span className="property-image-placeholder">⌂</span>}
    </button>
    <div>
      <div className="property-card-status"><p className="eyebrow">{property.propertyType} · FOR {property.listingType.toUpperCase()}</p>{owner && <span className={`status-pill status-${property.status.toLowerCase()}`}>{property.status}</span>}</div>
      <h3>{property.title}</h3>
      <p>{locationLabel(property)}</p>
      <strong>{priceLabel(property)}</strong>
      <span>{property.bedrooms} beds · {property.bathrooms} baths · {property.area.toLocaleString('en-IN')} sq ft</span>
      {owner && <div className="property-card-actions"><button type="button" onClick={onDetails}>View details</button><button type="button" onClick={onEdit}>Edit</button><button type="button" onClick={onDelete}>Delete</button></div>}
    </div>
  </article>
}

function PropertyForm({ property, onCancel, onSaved, onNotice }) {
  const [values, setValues] = useState(() => formValues(property))
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [createdPropertyId, setCreatedPropertyId] = useState('')

  useEffect(() => () => files.forEach((file) => URL.revokeObjectURL(file.preview)), [files])

  function change(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function chooseImages(event) {
    const selected = Array.from(event.target.files || [])
    if (selected.length + files.length > 5 || selected.length + files.length + (property?.images?.length || 0) > 10) {
      setError('Choose up to 5 images at a time and no more than 10 images in total.')
      event.target.value = ''
      return
    }
    setError('')
    setFiles((current) => [
      ...current,
      ...selected.map((file) => Object.assign(file, { preview: URL.createObjectURL(file) })),
    ])
    event.target.value = ''
  }

  function removeSelectedImage(index) {
    setFiles((current) => current.filter((file, currentIndex) => {
      if (currentIndex !== index) return true
      URL.revokeObjectURL(file.preview)
      return false
    }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    const body = {
      title: values.title.trim(),
      description: values.description.trim(),
      propertyType: values.propertyType,
      listingType: values.listingType,
      price: Number(values.price),
      location: { city: values.city.trim(), state: values.state.trim(), postalCode: values.postalCode.trim() },
      address: values.address.trim(),
      bedrooms: Number(values.bedrooms),
      bathrooms: Number(values.bathrooms),
      area: Number(values.area),
      amenities: values.amenities.split(',').map((item) => item.trim()).filter(Boolean),
      status: values.status,
    }
    try {
      const propertyId = property?._id || createdPropertyId
      const { property: savedProperty } = propertyId
        ? await updateProperty(propertyId, body)
        : await createProperty(body)
      if (!propertyId) setCreatedPropertyId(savedProperty._id)
      if (files.length) {
        await uploadPropertyImages(savedProperty._id, files)
      }
      onSaved()
      onNotice(property || propertyId ? 'Property updated successfully.' : 'Property created successfully.')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  async function removeExistingImage(image) {
    if (!window.confirm('Delete this property image?')) return
    try {
      await deletePropertyImage(property._id, image._id)
      onSaved()
      onNotice('Property image deleted.')
    } catch (removeError) {
      setError(removeError.message)
    }
  }

  return <form className="owner-form" onSubmit={submit}>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="owner-form-grid">
      <label>Property title<input name="title" value={values.title} onChange={change} minLength="4" maxLength="120" required placeholder="e.g. Palm Grove Apartment" /></label>
      <label>Property type<select name="propertyType" value={values.propertyType} onChange={change}>{['Apartment', 'House', 'Villa', 'Studio', 'Townhouse', 'Other'].map((type) => <option key={type}>{type}</option>)}</select></label>
      <label>Listing type<select name="listingType" value={values.listingType} onChange={change}><option>Rent</option><option>Sale</option></select></label>
      <label>{values.listingType === 'Rent' ? 'Monthly rent (₹)' : 'Sale price (₹)'}<input name="price" type="number" min="1" value={values.price} onChange={change} required /></label>
      <label>City<input name="city" value={values.city} onChange={change} required /></label>
      <label>State<input name="state" value={values.state} onChange={change} required /></label>
      <label>Postal code<input name="postalCode" value={values.postalCode} onChange={change} maxLength="20" /></label>
      <label>Street address<input name="address" value={values.address} onChange={change} minLength="5" maxLength="300" required /></label>
      <label>Bedrooms<input name="bedrooms" type="number" min="0" max="100" step="1" value={values.bedrooms} onChange={change} required /></label>
      <label>Bathrooms<input name="bathrooms" type="number" min="0" max="100" step="0.5" value={values.bathrooms} onChange={change} required /></label>
      <label>Area (sq ft)<input name="area" type="number" min="1" value={values.area} onChange={change} required /></label>
      <label>Listing status<select name="status" value={values.status} onChange={change}>{['Pending', 'Active', 'Rented', 'Sold'].map((status) => <option key={status}>{status}</option>)}</select></label>
      <label className="owner-image-field">Amenities (comma separated)<input name="amenities" value={values.amenities} onChange={change} placeholder="Parking, balcony, swimming pool" /></label>
      <label className="owner-image-field">Description<textarea name="description" value={values.description} onChange={change} minLength="10" maxLength="5000" rows="5" required placeholder="Describe the property, its highlights, and what makes it special." /></label>
      <label className="owner-image-field">Property images (JPEG, PNG, WebP; up to 5 MB each)<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseImages} /></label>
    </div>
    {(property?.images?.length > 0 || files.length > 0) && <div className="property-image-previews">
      {property?.images?.map((image) => <div key={image._id}><img src={image.url} alt={image.originalName || property.title} /><button type="button" onClick={() => removeExistingImage(image)} aria-label="Delete saved image">×</button></div>)}
      {files.map((file, index) => <div key={`${file.name}-${index}`}><img src={file.preview} alt={file.name} /><button type="button" onClick={() => removeSelectedImage(index)} aria-label="Remove selected image">×</button></div>)}
    </div>}
    <div className="property-form-actions"><Button type="submit" disabled={saving}>{saving ? 'Saving...' : property ? 'Save changes' : 'Publish property'} <span>↗</span></Button><button className="button-secondary" type="button" onClick={onCancel} disabled={saving}>Cancel</button></div>
  </form>
}

function PropertyDetails({ property, onBack, onEdit, owner }) {
  const [imageIndex, setImageIndex] = useState(0)
  const images = property.images || []
  const selectedImage = images[imageIndex]

  return <section className="property-details">
    <button className="button-secondary details-back" type="button" onClick={onBack}>← Back to properties</button>
    <div className="property-gallery">
      {selectedImage ? <img className="property-gallery-main" src={selectedImage.url} alt={property.title} /> : <div className="property-gallery-main property-image-placeholder">⌂</div>}
      {images.length > 1 && <div className="property-gallery-controls"><button type="button" onClick={() => setImageIndex((imageIndex + images.length - 1) % images.length)} aria-label="Previous image">←</button><span>{imageIndex + 1} / {images.length}</span><button type="button" onClick={() => setImageIndex((imageIndex + 1) % images.length)} aria-label="Next image">→</button></div>}
    </div>
    {images.length > 1 && <div className="property-gallery-thumbnails">{images.map((image, index) => <button type="button" key={image._id} onClick={() => setImageIndex(index)} className={index === imageIndex ? 'selected' : ''}><img src={image.url} alt={`Property view ${index + 1}`} /></button>)}</div>}
    <div className="property-details-heading"><div><p className="eyebrow">{property.propertyType} · FOR {property.listingType.toUpperCase()}</p><h2>{property.title}</h2><p>{property.address}, {locationLabel(property)} {property.location.postalCode}</p></div><strong>{priceLabel(property)}</strong></div>
    <div className="property-detail-facts"><span>{property.bedrooms} bedrooms</span><span>{property.bathrooms} bathrooms</span><span>{property.area.toLocaleString('en-IN')} sq ft</span><span className={`status-pill status-${property.status.toLowerCase()}`}>{property.status}</span></div>
    <section><h3>About this property</h3><p className="property-description">{property.description}</p></section>
    {property.amenities?.length > 0 && <section><h3>Amenities</h3><div className="amenities-list">{property.amenities.map((amenity) => <span key={amenity}>{amenity}</span>)}</div></section>}
    {owner && <Button onClick={onEdit}>Edit property</Button>}
  </section>
}

function SummaryCards({ summary }) {
  const cards = [['Total properties', summary.total], ['Active listings', summary.active], ['Rented or sold', summary.rentedOrSold], ['Pending listings', summary.pending]]
  return <section className="owner-summary-grid" aria-label="Property summary">
    {cards.map(([label, value]) => <article key={label} className="owner-summary-card"><span>{label}</span><strong>{value ?? '—'}</strong></article>)}
  </section>
}

export default function RoleDashboard({ user, role, onLogout }) {
  const isOwner = role === 'Property Owner'
  const [properties, setProperties] = useState([])
  const [summary, setSummary] = useState({})
  const [busy, setBusy] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState(null)
  const [formMode, setFormMode] = useState(null)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const firstName = user?.name?.split(' ')[0] || 'there'

  const reload = useCallback(async () => {
    setBusy(true)
    setLoadError('')
    try {
      if (isOwner) {
        const [propertyData, dashboardData] = await Promise.all([getMyProperties(), getOwnerDashboard()])
        setProperties(propertyData.properties)
        setSummary(dashboardData)
      } else {
        const propertyData = await getPublicProperties()
        setProperties(propertyData.properties)
      }
    } catch (error) {
      setLoadError(error.message)
    } finally {
      setBusy(false)
    }
  }, [isOwner])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (isOwner) {
          const [propertyData, dashboardData] = await Promise.all([getMyProperties(), getOwnerDashboard()])
          if (cancelled) return
          setProperties(propertyData.properties)
          setSummary(dashboardData)
        } else {
          const propertyData = await getPublicProperties()
          if (cancelled) return
          setProperties(propertyData.properties)
        }
      } catch (error) {
        if (!cancelled) setLoadError(error.message)
      } finally {
        if (!cancelled) setBusy(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [isOwner])

  async function removeProperty(property) {
    if (!window.confirm(`Delete "${property.title}" and its stored images? This cannot be undone.`)) return
    try {
      await deleteProperty(property._id)
      setProperties((current) => current.filter((item) => item._id !== property._id))
      if (selectedProperty?._id === property._id) setSelectedProperty(null)
      await reload()
      setNotice('Property deleted successfully.')
    } catch (error) {
      setNotice({ text: error.message, isError: true })
      await reload()
    }
  }

  async function saveProperty() {
    setFormMode(null)
    setSelectedProperty(null)
    await reload()
  }

  return <div className="role-dashboard">
    <header className="role-header"><Brand /><div className="role-user"><span>{user?.name}</span><button onClick={onLogout}>Sign out ↗</button></div></header>
    <main className="role-main">
      <section className="role-intro"><p className="eyebrow">{isOwner ? 'PROPERTY OWNER WORKSPACE' : 'TENANT WORKSPACE'}</p><h1>{isOwner ? `Welcome, ${firstName}.` : `Find a place, ${firstName}.`}</h1><p>{isOwner ? 'Manage every listing, from its first draft to a new tenant.' : 'Explore verified homes currently available on PropNest.'}</p></section>
      {notice && <p className={`property-notice ${notice.isError ? 'property-notice-error' : ''}`} role={notice.isError ? 'alert' : 'status'}>{notice.text}<button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification">×</button></p>}
      {loadError && <p className="form-error" role="alert">{loadError} <button type="button" onClick={reload}>Try again</button></p>}
      {isOwner && <SummaryCards summary={summary} />}
      {formMode ? <section className="role-section add-home-section">            <div className="role-section-heading"><div><p className="eyebrow">{formMode === 'edit' ? 'EDIT LISTING' : 'CREATE A LISTING'}</p><h2>{formMode === 'edit' ? 'Update your property' : 'Add a property'}</h2></div></div><PropertyForm key={`${formMode}-${selectedProperty?._id || 'new'}`} property={formMode === 'edit' ? selectedProperty : null} onCancel={() => setFormMode(null)} onSaved={saveProperty} onNotice={(text) => setNotice({ text, isError: false })} /></section>
        : selectedProperty ? <PropertyDetails property={selectedProperty} owner={isOwner} onBack={() => setSelectedProperty(null)} onEdit={() => setFormMode('edit')} />
          : <section className="role-section">
            <div className="role-section-heading"><div><p className="eyebrow">{isOwner ? 'YOUR LISTINGS' : 'AVAILABLE HOMES'}</p><h2>{isOwner ? properties.length ? 'Homes you manage' : 'Your listings are empty' : 'Places worth seeing'}</h2></div>{isOwner && <Button onClick={() => { setSelectedProperty(null); setFormMode('create') }}>＋ Add property</Button>}</div>
            {busy ? <p className="property-loading">Loading properties...</p> : properties.length
              ? <div className="role-home-grid">{properties.map((property) => <PropertyCard key={property._id} property={property} owner={isOwner} onDetails={() => setSelectedProperty(property)} onEdit={() => { setSelectedProperty(property); setFormMode('edit') }} onDelete={() => removeProperty(property)} />)}</div>
              : <div className="role-empty"><span>＋</span><h3>{isOwner ? 'Add your first property' : 'No active homes yet'}</h3><p>{isOwner ? 'Create a listing to start managing your property.' : 'Check back soon for available properties.'}</p>{isOwner && <Button onClick={() => setFormMode('create')}>Add property <span>↗</span></Button>}</div>}
          </section>}
    </main>
    <AssistantChat />
  </div>
}
