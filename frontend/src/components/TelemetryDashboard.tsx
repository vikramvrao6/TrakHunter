import type { LapResult, TelemetryPoint, VehicleSetup } from '../api';
import SpeedChart from './SpeedChart';
import BrakeChart from './BrakeChart';
import ComparisonTable from './ComparisonTable';
import LiveTelemetry from './LiveTelemetry';

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
}

function MetricCard({ label, value, sub }: MetricCardProps) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      {sub && <span className="metric-sub">{sub}</span>}
    </div>
  );
}

function formatLapTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3).padStart(6, '0');
  return `${m}:${sec}`;
}

interface Props {
  result: LapResult | null;
  error: string | null;
  loading: boolean;
  baseline: LapResult | null;
  baselineSetup: VehicleSetup | null;
  currentPoint: TelemetryPoint | null;
  isPlaying: boolean;
  displayedTelemetry: TelemetryPoint[];
}

export default function TelemetryDashboard({
  result, error, loading, baseline, baselineSetup,
  currentPoint, isPlaying, displayedTelemetry,
}: Props) {
  if (loading) {
    return (
      <div className="dashboard-placeholder">
        <div className="spinner" />
        <p>Running simulation…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-placeholder error">
        <p>⚠ {error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="dashboard-placeholder">
        <p>Configure setup and press <strong>Run Simulation</strong></p>
      </div>
    );
  }

  const { lap_time, top_speed, avg_corner_speed, braking_distance, sector_times, telemetry } = result;

  // Fixed x-axis domain derived from the FULL telemetry so gridlines never
  // move as the displayed slice grows during playback.
  const totalLapDist = telemetry.length > 0
    ? Math.ceil(telemetry[telemetry.length - 1].distance)
    : 0;

  return (
    <div className="dashboard">
      {/* ── Summary metrics ─────────────────────────────────────── */}
      <div className="metrics-row">
        <MetricCard
          label="Lap Time"
          value={formatLapTime(lap_time)}
        />
        <MetricCard
          label="Top Speed"
          value={`${(top_speed * 3.6).toFixed(1)}`}
          sub="km/h"
        />
        <MetricCard
          label="Avg Corner Speed"
          value={`${(avg_corner_speed * 3.6).toFixed(1)}`}
          sub="km/h"
        />
        <MetricCard
          label="Max Braking"
          value={`${braking_distance.toFixed(0)}`}
          sub="m"
        />
      </div>

      {/* ── Sector times ────────────────────────────────────────── */}
      <div className="sector-row">
        {sector_times.map((t, i) => (
          <div key={i} className="sector-badge">
            <span className="sector-label">S{i + 1}</span>
            <span className="sector-time">{t.toFixed(3)}s</span>
          </div>
        ))}
      </div>

      {/* ── Live telemetry strip (visible whenever playback position is set) */}
      {currentPoint && (
        <LiveTelemetry point={currentPoint} isPlaying={isPlaying} />
      )}

      {/* ── Charts — slice grows during playback; axis domain stays fixed ── */}
      <SpeedChart data={displayedTelemetry} totalDistance={totalLapDist} />
      <BrakeChart data={displayedTelemetry} totalDistance={totalLapDist} />

      {/* ── Comparison ──────────────────────────────────────────── */}
      {baseline
        ? <ComparisonTable current={result} baseline={baseline} baselineSetup={baselineSetup} />
        : (
          <div className="cmp-empty">
            <span className="cmp-empty-icon">◎</span>
            <p>No baseline saved yet — run a simulation and click <strong>Save as Baseline</strong></p>
          </div>
        )
      }
    </div>
  );
}
