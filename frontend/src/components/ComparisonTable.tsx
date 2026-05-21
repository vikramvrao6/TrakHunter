import type { LapResult, VehicleSetup } from '../api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatLapTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3).padStart(6, '0');
  return `${m}:${sec}`;
}

function fmtSpeed(ms: number)   { return `${(ms * 3.6).toFixed(1)} km/h`; }
function fmtDist(m: number)     { return `${m.toFixed(1)} m`; }
function fmtSector(s: number)   { return `${s.toFixed(3)} s`; }

// ── Delta row ─────────────────────────────────────────────────────────────────

interface DeltaRowProps {
  label:         string;
  baselineStr:   string;
  currentStr:    string;
  delta:         number;          // current − baseline
  deltaStr:      string;          // formatted absolute delta
  lowerIsBetter: boolean;
}

function DeltaRow({ label, baselineStr, currentStr, delta, deltaStr, lowerIsBetter }: DeltaRowProps) {
  const eps     = 1e-4;
  const neutral = Math.abs(delta) < eps;
  const improved = lowerIsBetter ? delta < -eps : delta > eps;

  const badge = neutral
    ? <span className="delta-badge delta-neutral">—</span>
    : improved
      ? <span className="delta-badge delta-good">{delta < 0 ? '' : '+'}{deltaStr}</span>
      : <span className="delta-badge delta-bad">{delta < 0 ? '' : '+'}{deltaStr}</span>;

  return (
    <tr className="cmp-row">
      <td className="cmp-label">{label}</td>
      <td className="cmp-cell cmp-baseline">{baselineStr}</td>
      <td className="cmp-cell cmp-current">{currentStr}</td>
      <td className="cmp-cell cmp-delta-cell">{badge}</td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  current:       LapResult;
  baseline:      LapResult;
  baselineSetup: VehicleSetup | null;
}

export default function ComparisonTable({ current, baseline, baselineSetup }: Props) {
  const b = baseline;
  const c = current;

  // Sector count — use whichever result has more sectors
  const numSectors = Math.max(b.sector_times.length, c.sector_times.length);

  // Baseline setup summary line
  const setupSummary = baselineSetup
    ? `Wing ${baselineSetup.wing_angle}° · Grip ${baselineSetup.tire_grip.toFixed(2)} μ · Bias ${baselineSetup.brake_bias.toFixed(2)}`
    : null;

  return (
    <div className="cmp-card">
      <div className="cmp-header">
        <span className="cmp-title">Setup Comparison</span>
        {setupSummary && (
          <span className="cmp-baseline-tag">
            Baseline: {setupSummary}
          </span>
        )}
      </div>

      <table className="cmp-table">
        <thead>
          <tr>
            <th className="cmp-th cmp-th-metric">Metric</th>
            <th className="cmp-th">Baseline</th>
            <th className="cmp-th">Current</th>
            <th className="cmp-th">Delta</th>
          </tr>
        </thead>
        <tbody>
          <DeltaRow
            label="Lap Time"
            baselineStr={formatLapTime(b.lap_time)}
            currentStr={formatLapTime(c.lap_time)}
            delta={c.lap_time - b.lap_time}
            deltaStr={`${Math.abs(c.lap_time - b.lap_time).toFixed(3)} s`}
            lowerIsBetter={true}
          />
          <DeltaRow
            label="Top Speed"
            baselineStr={fmtSpeed(b.top_speed)}
            currentStr={fmtSpeed(c.top_speed)}
            delta={c.top_speed - b.top_speed}
            deltaStr={`${Math.abs((c.top_speed - b.top_speed) * 3.6).toFixed(1)} km/h`}
            lowerIsBetter={false}
          />
          <DeltaRow
            label="Avg Corner Speed"
            baselineStr={fmtSpeed(b.avg_corner_speed)}
            currentStr={fmtSpeed(c.avg_corner_speed)}
            delta={c.avg_corner_speed - b.avg_corner_speed}
            deltaStr={`${Math.abs((c.avg_corner_speed - b.avg_corner_speed) * 3.6).toFixed(1)} km/h`}
            lowerIsBetter={false}
          />
          <DeltaRow
            label="Braking Distance"
            baselineStr={fmtDist(b.braking_distance)}
            currentStr={fmtDist(c.braking_distance)}
            delta={c.braking_distance - b.braking_distance}
            deltaStr={`${Math.abs(c.braking_distance - b.braking_distance).toFixed(1)} m`}
            lowerIsBetter={true}
          />

          {/* ── Sector times ─────────────────────────────────────── */}
          {Array.from({ length: numSectors }, (_, i) => {
            const bt = b.sector_times[i] ?? 0;
            const ct = c.sector_times[i] ?? 0;
            return (
              <DeltaRow
                key={i}
                label={`Sector ${i + 1}`}
                baselineStr={fmtSector(bt)}
                currentStr={fmtSector(ct)}
                delta={ct - bt}
                deltaStr={`${Math.abs(ct - bt).toFixed(3)} s`}
                lowerIsBetter={true}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
