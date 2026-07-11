export default function Logo({ size = 30 }) {
  return (
    <svg className="brand-icon" width={size} height={size} viewBox="-50 -50 100 100">
      <circle cx="0" cy="0" r="40" fill="none" stroke="#eab308" strokeWidth="6" />
      <circle cx="0" cy="0" r="13" fill="#eab308" />
    </svg>
  )
}
