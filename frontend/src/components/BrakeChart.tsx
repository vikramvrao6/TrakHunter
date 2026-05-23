import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { TelemetryPoint } from '../api';

interface Props {
  data: TelemetryPoint[];
  totalDistance: number;    // full lap length — fixes the x-axis domain
  cursorDistance: number;   // current playback position in metres
}

interface ChartPoint {
  distance: number;
  brake: number;
  throttle: number;
}

function thin(arr: TelemetryPoint[]): ChartPoint[] {
  return arr
    .filter((_, i) => i % 2 === 0)
    .map(p => ({
      distance: Math.round(p.distance),
      brake: parseFloat(p.brake.toFixed(2)),
      throttle: parseFloat(p.throttle.toFixed(2)),
    }));
}

function sectorBoundaries(data: TelemetryPoint[]): number[] {
  const bounds: number[] = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i].sector !== data[i - 1].sector) {
      bounds.push(Math.round(data[i].distance));
    }
  }
  return bounds;
}

const BRAKE_COLOR    = '#ff4444';
const THROTTLE_COLOR = '#22c55e';
const CURSOR_COLOR   = '#f59e0b';

export default function BrakeChart({ data, totalDistance, cursorDistance }: Props) {
  // All hooks MUST come before any conditional return (Rules of Hooks)
  const points     = useMemo(() => thin(data), [data]);
  const boundaries = useMemo(() => sectorBoundaries(data), [data]);

  if (!data.length) return null;

  return (
    <div className="chart-card">
      <h3 className="chart-title">
        Throttle / Brake
        <span className="chart-legend">
          <span style={{ color: THROTTLE_COLOR }}>━ Throttle</span>
          {'  '}
          <span style={{ color: BRAKE_COLOR }}>━ Brake</span>
        </span>
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={points} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="brakeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={BRAKE_COLOR}    stopOpacity={0.3} />
              <stop offset="95%" stopColor={BRAKE_COLOR}    stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="throttleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={THROTTLE_COLOR} stopOpacity={0.3} />
              <stop offset="95%" stopColor={THROTTLE_COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3044" />
          <XAxis
            dataKey="distance"
            type="number"
            domain={[0, totalDistance]}
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            label={{ value: 'Distance (m)', position: 'insideBottomRight', offset: -4, fill: '#6b7280', fontSize: 11 }}
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            domain={[0, 1]}
            width={40}
          />
          <Tooltip
            contentStyle={{ background: '#1a1d27', border: '1px solid #2d3044', borderRadius: 6 }}
            labelStyle={{ color: '#9ca3af', fontSize: 11 }}
            formatter={(v, name) => [
              Number(v).toFixed(2),
              name === 'brake' ? 'Brake' : 'Throttle',
            ]}
            labelFormatter={(d) => `${Number(d)} m`}
          />

          {/* Sector boundaries */}
          {boundaries.map(d => (
            <ReferenceLine key={d} x={d} stroke="#4b5563" strokeDasharray="4 2" />
          ))}

          {/* Full traces — always visible */}
          <Area
            type="monotone"
            dataKey="throttle"
            stroke={THROTTLE_COLOR}
            strokeWidth={1.5}
            fill="url(#throttleGrad)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="brake"
            stroke={BRAKE_COLOR}
            strokeWidth={1.5}
            fill="url(#brakeGrad)"
            dot={false}
          />

          {/* Playback cursor */}
          {cursorDistance > 0 && (
            <ReferenceLine
              x={cursorDistance}
              stroke={CURSOR_COLOR}
              strokeWidth={1.5}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
