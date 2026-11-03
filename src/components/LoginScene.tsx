// Animated hero for the login page: a request travels along the ribbon from
// "filed" to "pending" to "approved". Pure SVG + CSS (no JS, no libraries);
// the moving token and plane use SVG <animateMotion>, everything else is
// keyframes in globals.css (.scene-*). All motion is disabled for people
// who ask their OS for reduced motion.

// One path drives both the ribbon and the travelling token, so they stay in
// sync. Coordinates are in a 160 x 100 box that matches the container's
// 16:10 aspect ratio, so the HTML cards can be placed with plain percentages.
const RIBBON = "M 14 74 C 30 54, 44 44, 62 50 S 96 60, 114 52 S 132 44, 140 42";

export default function LoginScene({ idPrefix = "scene" }: { idPrefix?: string }) {
  // SVG ids must be unique per page — the login page renders this twice
  // (desktop panel + mobile banner), so every id gets a prefix.
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <div className="scene" aria-hidden>
      <svg className="scene-svg" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={id("ribbon-grad")} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#5b8fe6" />
            <stop offset="100%" stopColor="#1f5fcf" />
          </linearGradient>
          <filter id={id("token-glow")} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ribbon: draws itself in once, then the arrowhead lands. */}
        <path id={id("ribbon-path")} d={RIBBON} className="scene-ribbon" pathLength={100} stroke={`url(#${id("ribbon-grad")})`} />
        <polygon points="138,33.5 153,41.6 139.5,51" className="scene-arrowhead" fill="#1f5fcf" />

        {/* A request token travelling the ribbon, on a loop. */}
        <g className="scene-motion">
          <circle r="2.1" fill="#ffffff" filter={`url(#${id("token-glow")})`}>
            <animateMotion dur="6s" begin="1.6s" repeatCount="indefinite" rotate="auto">
              <mpath href={`#${id("ribbon-path")}`} />
            </animateMotion>
          </circle>
        </g>

        {/* Dotted flight path + plane (Authority to Travel). */}
        <path
          id={id("flight-path")}
          d="M 22 92 C 34 84, 44 90, 54 84 S 70 76, 78 82"
          className="scene-flight"
        />
        <g className="scene-motion">
          <g>
            <path
              d="M0 0 L-3.2 -1.1 L-2.4 0 L-3.2 1.1 Z M-1.2 -0.4 L-2.2 -3 L-1.4 -3 L0.6 -0.4 Z M-1.2 0.4 L-2.2 3 L-1.4 3 L0.6 0.4 Z"
              fill="#2a6fd6"
              transform="scale(1.6)"
            />
            <animateMotion dur="7s" begin="0.8s" repeatCount="indefinite" rotate="auto" keyPoints="0;1" keyTimes="0;1">
              <mpath href={`#${id("flight-path")}`} />
            </animateMotion>
          </g>
        </g>
      </svg>

      {/* Card 1 — filed request */}
      <div className="scene-card-wrap" style={{ left: "14%", top: "40%", width: "14%", ["--bob" as string]: "0s" }}>
        <div className="scene-card scene-card--filed" style={{ ["--pass" as string]: "2.3s" }}>
          <span className="scene-doc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <rect x="4" y="5" width="16" height="15" rx="2.5" />
              <path strokeLinecap="round" d="M8 3v4M16 3v4M4 10h16" />
              <path strokeLinecap="round" d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
            </svg>
          </span>
          <span className="scene-line" />
          <span className="scene-line scene-line--short" />
        </div>
        <span className="scene-spark scene-spark--tl" />
      </div>

      {/* Card 2 — pending, with a ticking clock */}
      <div className="scene-card-wrap" style={{ left: "40%", top: "27%", width: "16%", ["--bob" as string]: "-1.2s" }}>
        <div className="scene-card scene-card--pending" style={{ ["--pass" as string]: "4.3s" }}>
          <span className="scene-count font-display">2</span>
          <span className="scene-label">Pending</span>
        </div>
        <span className="scene-clock">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
            <circle cx="12" cy="12" r="9.5" fill="#ffffff" />
            <path className="scene-clock-hand" strokeLinecap="round" d="M12 12V6.5" />
            <path strokeLinecap="round" d="M12 12l3.5 2" />
          </svg>
        </span>
      </div>

      {/* Card 3 — approved, the check redraws every loop */}
      <div className="scene-card-wrap" style={{ left: "66%", top: "30%", width: "13%", ["--bob" as string]: "-2.4s" }}>
        <div className="scene-card scene-card--approved" style={{ ["--pass" as string]: "5.9s" }}>
          <span className="scene-check">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path className="scene-check-path" pathLength={1} strokeLinecap="round" strokeLinejoin="round" d="M7 12.5l3.2 3.2L17 9" />
            </svg>
          </span>
          <span className="scene-label">Approved</span>
        </div>
        <span className="scene-spark scene-spark--tr" />
      </div>

      {/* Little floating calendar (visit schedule) */}
      <span className="scene-float-cal" style={{ left: "52%", top: "74%" }}>
        <svg viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="16" rx="3" fill="#ddd2fb" />
          <rect x="3" y="5" width="18" height="5" rx="2.5" fill="#7cb1f0" />
          <path d="M8 3v4M16 3v4" stroke="#7a5ad1" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="7" y="13" width="2.6" height="2.4" rx=".5" fill="#7a5ad1" />
          <rect x="10.7" y="13" width="2.6" height="2.4" rx=".5" fill="#7a5ad1" />
          <rect x="14.4" y="13" width="2.6" height="2.4" rx=".5" fill="#7a5ad1" />
          <rect x="7" y="16.6" width="2.6" height="2.4" rx=".5" fill="#7a5ad1" />
          <rect x="10.7" y="16.6" width="2.6" height="2.4" rx=".5" fill="#7a5ad1" />
        </svg>
      </span>
    </div>
  );
}
