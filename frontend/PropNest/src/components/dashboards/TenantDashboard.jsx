import { useCallback, useEffect, useState } from 'react'
import DashboardHeader from './DashboardHeader.jsx'
import AIAssistant from './AIAssistant.jsx'
import { getPublicProperty, searchPublicProperties } from '../../services/properties.js'
import { createRentalRequest, getTenantRequests } from '../../services/rental.js'

export default function TenantDashboard({ user, onLogout }) {
  const [properties, setProperties] = useState([])
  const [requests, setRequests] = useState([])
  const [filters, setFilters] = useState({ location: '', minPrice: '', maxPrice: '', propertyType: '', listingType: '', furnishing: '', bedrooms: '', sort: 'newest' })
  const [view, setView] = useState('discover')
  const [details, setDetails] = useState(null)
  const [requestProperty, setRequestProperty] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const search = useCallback(async (nextFilters = filters) => {
    setLoading(true)
    try {
      const data = await searchPublicProperties(nextFilters)
      setProperties(data.properties)
    } catch (reason) { setError(reason.message) }
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(() => {
      search().catch(() => {})
      getTenantRequests(user.accessToken).then((data) => setRequests(data.requests)).catch((reason) => setError(reason.message))
    }, 0)
    return () => clearTimeout(timer)
  }, [search, user.accessToken])

  const change = (key) => (event) => setFilters({ ...filters, [key]: event.target.value })
  const openDetails = async (property) => {
    try {
      setDetails(await getPublicProperty(property._id))
    } catch (reason) { setError(reason.message) }
  }
  const submitRequest = async (event) => {
    event.preventDefault()
    try {
      await createRentalRequest(user.accessToken, requestProperty._id, message)
      setRequestProperty(null)
      setMessage('')
      setNotice('Rental request submitted.')
      setRequests((await getTenantRequests(user.accessToken)).requests)
    } catch (reason) { setError(reason.message) }
  }

  return <div className="role-dashboard">
    <DashboardHeader user={user} onLogout={onLogout} />
    <main className="role-main">
      <section className="role-intro"><p className="eyebrow">TENANT WORKSPACE</p><h1>Find a place, {user.name?.split(' ')[0]}.</h1><p>Search approved homes and manage your rental requests.</p></section>
      {notice && <p className="owner-notice">{notice}<button onClick={() => setNotice('')}>×</button></p>}
      {error && <p className="owner-error">{error}<button onClick={() => setError('')}>×</button></p>}
      <nav className="owner-tabs"><button className={view === 'discover' ? 'active' : ''} onClick={() => setView('discover')}>Discover Homes</button><button className={view === 'requests' ? 'active' : ''} onClick={() => setView('requests')}>My Requests</button></nav>
      {view === 'discover' ? <>
        <form className="tenant-search" onSubmit={(event) => { event.preventDefault(); search() }}>
          <input value={filters.location} onChange={change('location')} placeholder="City or location" />
          <input type="number" min="0" value={filters.minPrice} onChange={change('minPrice')} placeholder="Min rent" />
          <input type="number" min="0" value={filters.maxPrice} onChange={change('maxPrice')} placeholder="Max rent" />
          <select value={filters.propertyType} onChange={change('propertyType')}><option value="">Property type</option><option>Apartment</option><option>House</option><option>Villa</option><option>Studio</option><option>Commercial</option><option>Plot</option></select>
          <select value={filters.listingType} onChange={change('listingType')}><option value="">Rent or Sale</option><option>Rent</option><option>Sale</option></select>
          <select value={filters.furnishing} onChange={change('furnishing')}><option value="">Furnishing</option><option>Furnished</option><option>Semi-Furnished</option><option>Unfurnished</option></select>
          <select value={filters.bedrooms} onChange={change('bedrooms')}><option value="">Bedrooms</option>{[1,2,3,4,5].map((count) => <option key={count} value={count}>{count}+</option>)}</select>
          <select value={filters.sort} onChange={change('sort')}><option value="newest">Newest</option><option value="priceAsc">Price: low to high</option><option value="priceDesc">Price: high to low</option></select>
          <button type="submit">Search</button>
        </form>
        {loading ? <div className="role-empty"><h3>Loading homes…</h3></div> : properties.length ? <div className="role-home-grid">{properties.map((property) => <article className="role-home-card" key={property._id}><button className="card-image-button" onClick={() => openDetails(property)}><img src={property.images?.[0]?.url || 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85'} alt={property.title} /></button><div><p className="eyebrow">{property.propertyType}</p><h3>{property.title}</h3><p>{property.location}</p><strong>₹{Number(property.price).toLocaleString('en-IN')}{property.listingType === 'Rent' ? ' / month' : ''}</strong><span>{property.bedrooms} beds • {property.bathrooms} baths • {property.furnishing}</span><div className="card-actions"><button onClick={() => openDetails(property)}>View details</button><button onClick={() => setRequestProperty(property)}>Request visit</button></div></div></article>)}</div> : <div className="role-empty"><h3>No approved homes match</h3><p>Try a broader location or budget.</p></div>}
      </> : <section className="role-section"><div className="role-section-heading"><div><p className="eyebrow">MY ACTIVITY</p><h2>Rental requests</h2></div></div><div className="request-list">{requests.length ? requests.map((request) => <article key={request._id}><div><strong>{request.property?.title || 'Property'}</strong><p>{request.property?.location}</p></div><b>{request.status}</b></article>) : <div className="role-empty"><h3>No rental requests</h3></div>}</div></section>}
    </main>
    {details && <div className="modal-backdrop"><section className="property-details-modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={() => setDetails(null)}>×</button><div className="details-gallery">{details.images?.length ? details.images.map((image) => <img key={image.publicId} src={image.url} alt={details.title} />) : <img src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85" alt={details.title} />}</div><p className="eyebrow">{details.propertyType} • {details.furnishing}</p><h2>{details.title}</h2><strong>₹{Number(details.price).toLocaleString('en-IN')}{details.listingType === 'Rent' ? ' / month' : ''}</strong><p>{details.location} — {details.address}</p><p>{details.description}</p><p>{details.bedrooms} bedrooms • {details.bathrooms} bathrooms • {details.area} sq ft</p>{details.amenities?.length > 0 && <p><b>Amenities:</b> {details.amenities.join(', ')}</p>}<div className="details-actions"><button className="dark-button" onClick={() => setRequestProperty(details)}>Request a visit</button></div></section></div>}
    {requestProperty && <div className="modal-backdrop"><form className="delete-modal" onSubmit={submitRequest}><p className="eyebrow">RENTAL REQUEST</p><h2>{requestProperty.title}</h2><label>Message<textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength="1000" placeholder="Tell the owner about your preferred move-in date." /></label><div><button type="button" className="text-button" onClick={() => setRequestProperty(null)}>Cancel</button><button className="dark-button" type="submit">Send request</button></div></form></div>}
    <AIAssistant user={user} title="Your Smart Rental Assistant" welcome="Tell me your budget, city, bedroom count, furnishing, or required amenities." quickActions={['Properties under ₹15000', '2 bedroom homes in Delhi', 'Furnished property with parking']} />
  </div>
}
