import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { TelemetryPoint } from '../api';

interface Props {
  data: TelemetryPoint[];
  totalDistance: number;   // full lap length — fixes the x-axis domain
}

interface ChartPoint {
  distance: number;
  speed_kmh: number;
  sector: number;
}

// Sample to keep Recharts responsive without dropping shape
function thin(arr: TelemetryPoint[], every: number): ChartPoint[] {
  return arr
    .filter((_, i) => i % every === 0)
    .map(p => ({
      distance: Math.round(p.distance),
      speed_kmh: parseFloat((p.speed * 3.6).toFixed(1)),
      sector: p.sector,
    }));
}

// Sector boundary distances for reference lines
function sectorBoundaries(data: TelemetryPoint[]): number[] {
  const bounds: number[] = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i].sector !== data[i - 1].sector) {
      bounds.push(Math.round(data[i].distance));
    }
  }
  return bounds;
}

const SPEED_COLOR = '#00d4ff';

export default function SpeedChart({ data, totalDistance }: Props) {
  // All hooks MUST come before any conditional return (Rules of Hooks)
  const points     = useMemo(() => thin(data, 2), [data]);
  const boundaries = useMemo(() => sectorBoundaries(data), [data]);

  if (!data.length) return null;

  return (
    <div className="chart-card">
      <h3 className="chart-title">Speed  <span className="chart-unit">km/h</span></h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={points} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
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
            width={40}
          />
          <Tooltip
            contentStyle={{ background: '#1a1d27', border: '1px solid #2d3044', borderRadius: 6 }}
            labelStyle={{ color: '#9ca3af', fontSize: 11 }}
            itemStyle={{ color: SPEED_COLOR }}
            formatter={(v: number) => [`${v} km/h`, 'Speed']}
            labelFormatter={(d: number) => `${d} m`}
          />
          {boundaries.map(d => (
            <ReferenceLine key={d} x={d} stroke="#4b5563" strokeDasharray="4 2" label={{ value: 'S', fill: '#6b7280', fontSize: 10 }} />
          ))}
          <Line
            type="monotone"
            dataKey="speed_kmh"
            stroke={SPEED_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: SPEED_COLOR }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
