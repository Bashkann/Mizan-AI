/**
 * ScalesOfJustice renders an animated SVG scales of justice icon.
 * Pure CSS animation with gentle swaying motion.
 * Used on the landing page as a decorative element.
 */
export default function ScalesOfJustice({ className = '', size = 200 }) {
  return (
    <div className={`animate-float ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_30px_rgba(201,168,76,0.3)]"
      >
        {/* Pillar */}
        <line
          x1="100" y1="30" x2="100" y2="170"
          stroke="#C9A84C"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Base */}
        <rect
          x="65" y="165" width="70" height="10" rx="5"
          fill="#C9A84C"
          opacity="0.9"
        />
        <rect
          x="75" y="160" width="50" height="8" rx="4"
          fill="#E8C76A"
          opacity="0.6"
        />

        {/* Top circle */}
        <circle
          cx="100" cy="28" r="8"
          fill="#C9A84C"
          stroke="#E8C76A"
          strokeWidth="2"
        />
        <circle
          cx="100" cy="28" r="3"
          fill="#0A0F1E"
        />

        {/* Cross beam - animated sway */}
        <g className="animate-sway">
          {/* Main beam */}
          <line
            x1="35" y1="55" x2="165" y2="55"
            stroke="#C9A84C"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Left pan strings */}
          <line x1="35" y1="55" x2="25" y2="100" stroke="#C9A84C" strokeWidth="1.5" opacity="0.8" />
          <line x1="35" y1="55" x2="45" y2="100" stroke="#C9A84C" strokeWidth="1.5" opacity="0.8" />

          {/* Left pan */}
          <path
            d="M15 100 Q35 125 55 100"
            fill="none"
            stroke="#C9A84C"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Left pan inner glow */}
          <path
            d="M20 100 Q35 118 50 100"
            fill="rgba(201, 168, 76, 0.1)"
            stroke="none"
          />

          {/* Right pan strings */}
          <line x1="165" y1="55" x2="155" y2="100" stroke="#C9A84C" strokeWidth="1.5" opacity="0.8" />
          <line x1="165" y1="55" x2="175" y2="100" stroke="#C9A84C" strokeWidth="1.5" opacity="0.8" />

          {/* Right pan */}
          <path
            d="M145 100 Q165 125 185 100"
            fill="none"
            stroke="#C9A84C"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Right pan inner glow */}
          <path
            d="M150 100 Q165 118 180 100"
            fill="rgba(201, 168, 76, 0.1)"
            stroke="none"
          />
        </g>

        {/* Decorative dots on the pillar */}
        <circle cx="100" cy="80" r="2" fill="#C9A84C" opacity="0.4" />
        <circle cx="100" cy="100" r="2" fill="#C9A84C" opacity="0.3" />
        <circle cx="100" cy="120" r="2" fill="#C9A84C" opacity="0.2" />
        <circle cx="100" cy="140" r="2" fill="#C9A84C" opacity="0.15" />
      </svg>
    </div>
  );
}
