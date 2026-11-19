export default function Input({ id, label, type = 'text', value, onChange, error, placeholder, autoComplete }) {
  return <label className={`field ${error ? 'has-error' : ''}`} htmlFor={id}>
    <span>{label}</span>
    <input id={id} name={id} type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
    {error && <small id={`${id}-error`}>{error}</small>}
  </label>
}