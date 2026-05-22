import { useRef, useEffect, useState } from 'react';

interface TrackConfig {
  viewBox: string;
  path: string;
  surfaceWidth: number;   // thick outer stroke — track surface
  lineWidth: number;      // thin accent stroke — centre line
  label: string;          // classification shown under map
}

// Each path is a closed, single-stroke circuit outline drawn at an
// approximate scale. Straight lengths are compressed so the whole
// layout fits in ~300 × 200 units while preserving the visual
// character of each track.
const TRACK_CONFIGS: Record<string, TrackConfig> = {
  // ── Oval ─────────────────────────────────────────────────────────────────
  // Two long straights joined by tight R=50 semicircles.
  oval_test: {
    viewBox: '0 0 310 160',
    path: 'M 65,25 L 245,25 A 50,50 0 0 1 245,125 L 65,125 A 50,50 0 0 0 65,25 Z',
    surfaceWidth: 12,
    lineWidth: 2.5,
    label: 'High-Speed Oval',
  },

  // ── Circuit Alpha ─────────────────────────────────────────────────────────
  // Compact 3-sector road course: hairpin at left, chicane kink across the
  // top, long sweeping corner on the right.
  circuit_alpha: {
    viewBox: '0 0 285 195',
    path:
      'M 195,170 L 70,170' +
      ' C 32,170 28,142 28,108' +
      ' C 28,74 48,58 78,58' +
      ' L 132,58' +
      ' C 146,58 150,42 166,42' +
      ' C 182,42 186,58 202,66' +
      ' L 236,84' +
      ' C 260,96 264,136 246,155' +
      ' C 237,166 220,174 205,174' +
      ' C 202,175 198,174 195,170 Z',
    surfaceWidth: 10,
    lineWidth: 2,
    label: 'Technical Road Course',
  },

  // ── Eifel Endurance ───────────────────────────────────────────────────────
  // Nürburgring-inspired: many direction changes, a top-right hairpin,
  // a right-side chicane, and a long opening straight.
  eifel_endurance: {
    viewBox: '0 0 285 215',
    path:
      'M 140,200 L 68,200' +
      ' C 40,200 30,180 30,154' +
      ' L 30,128' +
      ' C 30,108 44,98 62,102' +
      ' L 82,106' +
      ' C 98,110 106,94 112,82' +
      ' L 122,62' +
      ' C 130,46 148,40 163,52' +
      ' L 178,66' +
      ' C 188,76 202,74 212,62' +
      ' L 226,46' +
      ' C 238,32 258,40 258,58' +
      ' L 258,94' +
      ' C 260,114 246,126 230,124' +
      ' L 208,120' +
      ' C 194,118 188,133 192,149' +
      ' L 196,167' +
      ' C 200,186 186,198 168,198' +
      ' L 140,200 Z',
    surfaceWidth: 10,
    lineWidth: 2,
    label: 'Endurance Circuit',
  },

  // ── Sarthe Speedway ───────────────────────────────────────────────────────
  // Le Mans-inspired large triangle: short pit straight on the left,
  // a very long Mulsanne-equivalent across the top, fast sweeper on the
  // right, and a shorter return leg along the bottom.
  sarthe_speedway: {
    viewBox: '0 0 305 185',
    path:
      'M 30,158 L 30,76' +
      ' C 30,48 54,36 82,42' +
      ' L 258,66' +
      ' C 282,70 292,90 282,110' +
      ' L 260,146' +
      ' C 250,163 230,172 210,168' +
      ' L 78,162' +
      ' C 56,160 42,160 30,158 Z',
    surfaceWidth: 10,
    lineWidth: 2,
    label: 'High-Speed Prototype Circuit',
  },
};

const FALLBACK = TRACK_CONFIGS.circuit_alpha;

interface CarPos { x: number; y: number; angle: number; }

interface Props {
  track: string;
  playbackProgress?: number;   // 0..1; undefined = no car shown
}

export default function TrackMap({ track, playbackProgress }: Props) {
  const cfg     = TRACK_CONFIGS[track] ?? FALLBACK;
  const pathRef = useRef<SVGPathElement>(null);
  const [carPos, setCarPos] = useState<CarPos | null>(null);

  // Recompute car position whenever progress or track changes
  useEffect(() => {
    const el = pathRef.current;
    if (!el || playbackProgress == null) {
      setCarPos(null);
      return;
    }
    const total = el.getTotalLength();
    const t     = playbackProgress * total;
    const eps   = Math.max(1, total * 0.005);
    const pt    = el.getPointAtLength(t);
    const ptA   = el.getPointAtLength(Math.max(0, t - eps));
    const ptB   = el.getPointAtLength(Math.min(total, t + eps));
    const angle = Math.atan2(ptB.y - ptA.y, ptB.x - ptA.x) * (180 / Math.PI);
    setCarPos({ x: pt.x, y: pt.y, angle });
  }, [playbackProgress, track]);

  return (
    <div className="track-map-card">
      <span className="track-map-header">Track Map</span>

      <div className="track-map-svg-wrapper">
        <svg
          viewBox={cfg.viewBox}
          preserveAspectRatio="xMidYMid meet"
          width="100%"
          aria-label={`${track} circuit map`}
        >
          {/* Track surface — broad, very subtle */}
          <path
            d={cfg.path}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={cfg.surfaceWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Centre / outline — thin neon accent; ref used for path length */}
          <path
            ref={pathRef}
            d={cfg.path}
            fill="none"
            stroke="rgba(232,255,0,0.55)"
            strokeWidth={cfg.lineWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* ── Car icon ──────────────────────────────────────────────── */}
          {carPos && (
            <g
              transform={`translate(${carPos.x.toFixed(2)},${carPos.y.toFixed(2)}) rotate(${carPos.angle.toFixed(1)})`}
              aria-label="car position"
            >
              {/* Glow halo */}
              <ellipse cx="0" cy="0" rx="10" ry="6"
                fill="rgba(232,255,0,0.12)"
                stroke="none"
              />
              {/* Main body — pointed teardrop facing +x */}
              <path
                d="M 8,0 L 3,-2.5 L -5,-2 L -7,0 L -5,2 L 3,2.5 Z"
                fill="rgba(232,255,0,0.95)"
              />
              {/* Front wing — thin bar across nose */}
              <rect x="6.5" y="-4" width="2" height="8" rx="0.6"
                fill="rgba(232,255,0,0.55)"
              />
              {/* Rear wing — wider bar at tail */}
              <rect x="-9" y="-4.5" width="2.5" height="9" rx="0.6"
                fill="rgba(232,255,0,0.55)"
              />
            </g>
          )}
        </svg>
      </div>

      <span className="track-classification">{cfg.label}</span>
    </div>
  );
}
