export default function Button({ children, variant = 'dark', className = '', ...props }) {
  return <button className={`ui-button ${variant} ${className}`} {...props}>{children}</button>
}