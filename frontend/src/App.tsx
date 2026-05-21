import { useState } from 'react';
import SetupPanel from './components/SetupPanel';
import TelemetryDashboard from './components/TelemetryDashboard';
import { runSimulation } from './api';
import type { VehicleSetup, LapResult } from './api';

const DEFAULT_SETUP: VehicleSetup = {
  mass: 720,
  tire_grip: 1.2,
  wing_angle: 15,
  drag_coefficient: 0.40,
  brake_bias: 0.62,
  gear_ratio_preset: 2,
};

const TRACK = 'circuit_alpha';

export default function App() {
  const [setup, setSetup] = useState<VehicleSetup>(DEFAULT_SETUP);
  const [result, setResult] = useState<LapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [baseline, setBaseline] = useState<LapResult | null>(null);
  const [baselineSetup, setBaselineSetup] = useState<VehicleSetup | null>(null);

  function patchSetup(patch: Partial<VehicleSetup>) {
    setSetup(prev => ({ ...prev, ...patch }));
  }

  async function handleRun() {
    setLoading(true);
    setError(null);
    try {
      const res = await runSimulation(TRACK, setup);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function handleSaveBaseline() {
    if (!result) return;
    setBaseline(result);
    setBaselineSetup({ ...setup });
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">◈</span>
        <h1>TrakHunter</h1>
        <span className="app-track">Circuit Alpha</span>
      </header>

      <main className="app-body">
        <SetupPanel
          setup={setup}
          onSetupChange={patchSetup}
          onRun={handleRun}
          loading={loading}
          canSaveBaseline={!!result}
          hasBaseline={!!baseline}
          onSaveBaseline={handleSaveBaseline}
        />
        <TelemetryDashboard
          result={result}
          error={error}
          loading={loading}
          baseline={baseline}
          baselineSetup={baselineSetup}
        />
      </main>
    </div>
  );
}
