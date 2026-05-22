import type { TelemetryPoint } from '../api';

interface Props {
  point: TelemetryPoint;
  isPlaying: boolean;
}

interface Cell {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}

export default function LiveTelemetry({ point, isPlaying }: Props) {
  const cells: Cell[] = [
    {
      label: 'Speed',
      value: (point.speed * 3.6).toFixed(1),
      unit: 'km/h',
    },
    {
      label: 'Distance',
      value: point.distance.toFixed(0),
      unit: 'm',
    },
    {
      label: 'Sector',
      value: `S${point.sector}`,
      unit: '',
    },
    {
      label: 'Throttle',
      value: (point.throttle * 100).toFixed(0),
      unit: '%',
      highlight: point.throttle > 0.5,
    },
    {
      label: 'Brake',
      value: (point.brake * 100).toFixed(0),
      unit: '%',
      highlight: point.brake > 0.1,
    },
    {
      label: 'Lat G',
      value: Math.abs(point.lateral_g).toFixed(2),
      unit: 'g',
    },
  ];

  return (
    <div className="live-strip">
      <div className="live-strip-top">
        <span className="live-indicator">
          <span className="live-dot" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
          Live
        </span>
        <span className="live-time">{point.time.toFixed(2)} s</span>
      </div>
      <div className="live-grid">
        {cells.map(c => (
          <div key={c.label} className="live-cell">
            <span className="live-label">{c.label}</span>
            <span className={`live-value ${c.highlight ? 'live-value-hi' : ''}`}>
              {c.value}
              {c.unit && <span className="live-unit">{c.unit}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
