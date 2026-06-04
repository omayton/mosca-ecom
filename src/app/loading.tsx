export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0b]">
      <svg className="animate-bounce" width="60" height="45" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Left wing */}
        <ellipse cx="25" cy="22" rx="14" ry="8" fill="#f59e0b" fillOpacity="0.4" stroke="#f59e0b" strokeOpacity="0.6" strokeWidth="0.8">
          <animate attributeName="ry" values="8;3;8" dur="0.15s" repeatCount="indefinite" />
        </ellipse>
        {/* Right wing */}
        <ellipse cx="55" cy="22" rx="14" ry="8" fill="#f59e0b" fillOpacity="0.4" stroke="#f59e0b" strokeOpacity="0.6" strokeWidth="0.8">
          <animate attributeName="ry" values="8;3;8" dur="0.15s" repeatCount="indefinite" />
        </ellipse>
        {/* Body */}
        <ellipse cx="40" cy="36" rx="10" ry="14" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
        {/* Head */}
        <circle cx="40" cy="20" r="7" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
        {/* Eyes */}
        <circle cx="37" cy="18" r="2.5" fill="#dc2626" opacity="0.8" />
        <circle cx="43" cy="18" r="2.5" fill="#dc2626" opacity="0.8" />
        {/* Eye shine */}
        <circle cx="37.8" cy="17.2" r="0.8" fill="white" opacity="0.6" />
        <circle cx="43.8" cy="17.2" r="0.8" fill="white" opacity="0.6" />
        {/* Stripes */}
        <ellipse cx="40" cy="33" rx="6" ry="2" fill="#333" opacity="0.5" />
        <ellipse cx="40" cy="38" rx="5" ry="1.5" fill="#333" opacity="0.5" />
      </svg>
      <p className="mt-4 text-white/40 text-xs font-medium tracking-widest uppercase">
        Carregando...
      </p>
    </div>
  )
}
