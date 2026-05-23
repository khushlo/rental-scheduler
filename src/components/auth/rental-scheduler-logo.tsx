interface LogoProps {
  size?: number;
  color?: string;
}

/**
 * Rental Scheduler SVG logo — a calendar with a price tag overlay.
 * Works on both light and dark backgrounds via the `color` prop.
 */
export function RentalSchedulerLogo({ size = 48, color = "#1e3a5f" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Rental Scheduler Logo"
    >
      {/* Calendar body */}
      <rect
        x="6"
        y="12"
        width="42"
        height="38"
        rx="5"
        fill={color}
        opacity="0.15"
        stroke={color}
        strokeWidth="3"
      />
      {/* Top bar */}
      <rect x="6" y="12" width="42" height="13" rx="5" fill={color} />
      {/* Calendar pins */}
      <rect x="16" y="6" width="4" height="12" rx="2" fill={color} />
      <rect x="34" y="6" width="4" height="12" rx="2" fill={color} />
      {/* Grid dots */}
      <circle cx="18" cy="36" r="2.5" fill={color} />
      <circle cx="27" cy="36" r="2.5" fill={color} />
      <circle cx="18" cy="44" r="2.5" fill={color} />
      <circle cx="27" cy="44" r="2.5" fill={color} />

      {/* Price tag badge (bottom-right) */}
      <circle cx="49" cy="47" r="12" fill={color} />
      <path
        d="M44 47 L49 41 L54 47 L54 53 L44 53 Z"
        fill="white"
        opacity="0.9"
      />
      <circle cx="49" cy="45" r="1.5" fill={color} />
    </svg>
  );
}
