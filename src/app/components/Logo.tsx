export function CrystalLogo({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Crystal/prism shape */}
      <defs>
        <linearGradient id="crystalGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8F9BFF" />
          <stop offset="50%" stopColor="#5C6CF5" />
          <stop offset="100%" stopColor="#3A4AE8" />
        </linearGradient>
        <linearGradient id="crystalShine" x1="8" y1="4" x2="24" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C7D2FE" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#5C6CF5" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Background rounded square */}
      <rect x="2" y="2" width="28" height="28" rx="7" fill="url(#crystalGrad)" />
      {/* Crystal facets */}
      <path d="M16 5L24 13L16 27L8 13L16 5Z" fill="white" fillOpacity="0.25" />
      <path d="M16 5L24 13L16 15L8 13L16 5Z" fill="white" fillOpacity="0.4" />
      <path d="M16 15L24 13L16 27Z" fill="white" fillOpacity="0.15" />
      <path d="M16 15L8 13L16 27Z" fill="white" fillOpacity="0.2" />
      {/* Highlight line */}
      <path d="M12 8L16 5L20 8" stroke="white" strokeOpacity="0.6" strokeWidth="0.8" strokeLinecap="round" />
      {/* Shine overlay */}
      <rect x="2" y="2" width="28" height="28" rx="7" fill="url(#crystalShine)" />
    </svg>
  );
}
