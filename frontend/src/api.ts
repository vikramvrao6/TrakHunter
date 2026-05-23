// ── Types ──────────────────────────────────────────────────────────────────────

export interface VehicleSetup {
  mass: number;
  tire_grip: number;
  wing_angle: number;
  drag_coefficient: number;
  brake_bias: number;
  gear_ratio_preset: 1 | 2 | 3;
}

export interface SimulationRequest {
  track_name: string;
  setup: VehicleSetup;
  full_telemetry: boolean;
}

export interface TelemetryPoint {
  distance: number;   // m along lap
  time: number;       // s elapsed
  speed: number;      // m/s
  throttle: number;   // 0–1
  brake: number;      // 0–1
  lateral_g: number;  // g-force
  tire_load: number;  // N normal force
  sector: number;
}

export interface LapResult {
  lap_time: number;
  top_speed: number;
  avg_corner_speed: number;
  braking_distance: number;
  sector_times: number[];
  telemetry: TelemetryPoint[];
}

// ── API client ────────────────────────────────────────────────────────────────

const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export async function getTracks(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/tracks`);
  if (!res.ok) throw new Error(`Failed to fetch tracks: ${res.statusText}`);
  const data = await res.json() as { tracks: string[] };
  return data.tracks;
}

export async function runSimulation(
  trackName: string,
  setup: VehicleSetup
): Promise<LapResult> {
  const body: SimulationRequest = {
    track_name: trackName,
    setup,
    full_telemetry: true,   // always fetch the telemetry array for charts
  };

  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)
    );
  }

  return res.json() as Promise<LapResult>;
}
