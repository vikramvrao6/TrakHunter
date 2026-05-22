import { useState, useEffect, useCallback } from 'react';
import SetupPanel from './components/SetupPanel';
import TelemetryDashboard from './components/TelemetryDashboard';
import TrackSelector from './components/TrackSelector';
import { runSimulation, getTracks } from './api';
import type { VehicleSetup, LapResult } from './api';

const DEFAULT_SETUP: VehicleSetup = {
  mass: 720,
  tire_grip: 1.2,
  wing_angle: 15,
  drag_coefficient: 0.40,
  brake_bias: 0.62,
  gear_ratio_preset: 2,
};

export default function App() {
  // ── Track list ─────────────────────────────────────────────────────────────
  const [tracks, setTracks]   = useState<string[]>([]);
  const [track, setTrack]     = useState<string>('circuit_alpha');

  // ── Simulation state ───────────────────────────────────────────────────────
  const [setup, setSetup]     = useState<VehicleSetup>(DEFAULT_SETUP);
  const [result, setResult]   = useState<LapResult | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Comparison baseline ────────────────────────────────────────────────────
  const [baseline, setBaseline]           = useState<LapResult | null>(null);
  const [baselineSetup, setBaselineSetup] = useState<VehicleSetup | null>(null);

  // ── Playback ───────────────────────────────────────────────────────────────
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying]         = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Fetch available tracks on mount
  useEffect(() => {
    getTracks()
      .then(list => {
        setTracks(list);
        if (list.length > 0 && !list.includes(track)) {
          setTrack(list[0]);
        }
      })
      .catch(() => setTracks(['circuit_alpha'])); // fallback
  }, []);

  // Derived playback values
  const telemetry      = result?.telemetry ?? [];
  const currentPoint   = telemetry[playbackIndex] ?? null;
  const totalLapDist   = telemetry.length > 0 ? telemetry[telemetry.length - 1].distance : 0;
  const playbackProgress =
    totalLapDist > 0 && currentPoint ? currentPoint.distance / totalLapDist : 0;

  // Reset playback when a new simulation result arrives
  useEffect(() => {
    setPlaybackIndex(0);
    setIsPlaying(false);
  }, [result]);

  // Playback engine: 50 ms tick, advance `playbackSpeed` indices per tick
  useEffect(() => {
    if (!isPlaying || telemetry.length === 0) return;
    const id = setInterval(() => {
      setPlaybackIndex(prev => {
        const next = prev + playbackSpeed;
        if (next >= telemetry.length - 1) {
          setIsPlaying(false);
          return telemetry.length - 1;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(id);
  }, [isPlaying, playbackSpeed, telemetry.length]);

  const handlePlay       = useCallback(() => setIsPlaying(true), []);
  const handlePause      = useCallback(() => setIsPlaying(false), []);
  const handleReset      = useCallback(() => { setPlaybackIndex(0); setIsPlaying(false); }, []);
  const handleJumpToEnd  = useCallback(() => {
    setPlaybackIndex(Math.max(0, telemetry.length - 1));
    setIsPlaying(false);
  }, [telemetry.length]);

  function patchSetup(patch: Partial<VehicleSetup>) {
    setSetup(prev => ({ ...prev, ...patch }));
  }

  async function simulate(trackName: string, vehicleSetup: VehicleSetup) {
    setLoading(true);
    setError(null);
    try {
      const res = await runSimulation(trackName, vehicleSetup);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handleRun() {
    simulate(track, setup);
  }

  function handleTrackChange(newTrack: string) {
    setTrack(newTrack);
    // Clear results and baseline — they belong to the previous track
    setResult(null);
    setBaseline(null);
    setBaselineSetup(null);
    setError(null);
    // Auto-run for the new track so charts update immediately
    simulate(newTrack, setup);
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
        <div className="header-right">
          <TrackSelector
            tracks={tracks}
            selected={track}
            onChange={handleTrackChange}
            disabled={loading}
          />
        </div>
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
          track={track}
          playback={{
            index:          playbackIndex,
            total:          telemetry.length,
            isPlaying,
            speed:          playbackSpeed,
            progress:       playbackProgress,
            disabled:       telemetry.length === 0,
            onPlay:         handlePlay,
            onPause:        handlePause,
            onReset:        handleReset,
            onJumpToEnd:    handleJumpToEnd,
            onSpeedChange:  setPlaybackSpeed,
          }}
        />
        <TelemetryDashboard
          result={result}
          error={error}
          loading={loading}
          baseline={baseline}
          baselineSetup={baselineSetup}
          currentPoint={currentPoint}
          isPlaying={isPlaying}
        />
      </main>
    </div>
  );
}
