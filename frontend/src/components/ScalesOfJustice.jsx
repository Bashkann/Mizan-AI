export default function ScalesOfJustice({ className = '', size = 120 }) {
  const height = size * (140 / 120);
  return (
    <div className={className} style={{ width: size, height: height, margin: '0 auto' }}>
      <svg width={size} height={height} viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
        {/* Base/Stand */}
        <rect x="55" y="120" width="10" height="15" fill="#C9A84C" rx="2"/>
        <rect x="35" y="132" width="50" height="6" fill="#C9A84C" rx="3"/>
        
        {/* Vertical pole */}
        <rect x="58.5" y="20" width="3" height="105" fill="#C9A84C"/>
        
        {/* Top pivot circle */}
        <circle cx="60" cy="18" r="5" fill="#C9A84C"/>
        
        {/* Horizontal beam */}
        <rect x="10" y="16" width="100" height="4" fill="#C9A84C" rx="2"/>
        
        {/* Left chain */}
        <line x1="20" y1="20" x2="20" y2="75" stroke="#C9A84C" strokeWidth="1.5" strokeDasharray="3,2"/>
        
        {/* Right chain */}  
        <line x1="100" y1="20" x2="100" y2="75" stroke="#C9A84C" strokeWidth="1.5" strokeDasharray="3,2"/>
        
        {/* Left pan */}
        <ellipse cx="20" cy="80" rx="18" ry="6" fill="none" stroke="#C9A84C" strokeWidth="2"/>
        <path d="M 2 80 Q 20 90 38 80" fill="rgba(201,168,76,0.15)" stroke="#C9A84C" strokeWidth="1.5"/>
        
        {/* Right pan */}
        <ellipse cx="100" cy="80" rx="18" ry="6" fill="none" stroke="#C9A84C" strokeWidth="2"/>
        <path d="M 82 80 Q 100 90 118 80" fill="rgba(201,168,76,0.15)" stroke="#C9A84C" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}
