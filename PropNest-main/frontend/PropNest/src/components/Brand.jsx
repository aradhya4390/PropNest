export default function Brand({ light = false }) {
  return <div className={`brand public-brand ${light ? 'brand-light' : ''}`}><span className="brand-mark">P</span><span>PropNest</span></div>
}