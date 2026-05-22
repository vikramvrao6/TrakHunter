import type { VehicleSetup } from '../api';
import TrackMap from './TrackMap';

interface SliderRowProps {
  label: string;
  param: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
  onChange: (val: number) => void;
}

function SliderRow({ label, param, min, max, step, value, unit, onChange }: SliderRowProps) {
  return (
    <div className="slider-row">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">
          {value.toFixed(step < 1 ? 2 : 0)}{unit}
        </span>
      </div>
      <input
        id={param}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
      <div className="slider-bounds">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

interface SetupPanelProps {
  setup: VehicleSetup;
  onSetupChange: (patch: Partial<VehicleSetup>) => void;
  onRun: () => void;
  loading: boolean;
  canSaveBaseline: boolean;
  hasBaseline: boolean;
  onSaveBaseline: () => void;
  track: string;
}

export default function SetupPanel({
  setup, onSetupChange, onRun, loading,
  canSaveBaseline, hasBaseline, onSaveBaseline,
  track,
}: SetupPanelProps) {
  return (
    <aside className="setup-panel">
      <h2 className="panel-title">Vehicle Setup</h2>

      <SliderRow
        label="Wing Angle"
        param="wing_angle"
        min={0} max={45} step={1}
        value={setup.wing_angle}
        unit="°"
        onChange={v => onSetupChange({ wing_angle: v })}
      />

      <SliderRow
        label="Tire Grip"
        param="tire_grip"
        min={0.5} max={2.0} step={0.05}
        value={setup.tire_grip}
        unit=" μ"
        onChange={v => onSetupChange({ tire_grip: v })}
      />

      <SliderRow
        label="Brake Bias"
        param="brake_bias"
        min={0.30} max={0.90} step={0.01}
        value={setup.brake_bias}
        unit=""
        onChange={v => onSetupChange({ brake_bias: v })}
      />

      {/* Fixed params shown as read-only reference */}
      <div className="fixed-params">
        <div className="fixed-param">
          <span>Mass</span><span>{setup.mass} kg</span>
        </div>
        <div className="fixed-param">
          <span>Drag Cd</span><span>{setup.drag_coefficient}</span>
        </div>
        <div className="fixed-param">
          <span>Gear Preset</span>
          <span>
            {['', 'Short', 'Medium', 'Long'][setup.gear_ratio_preset]}
          </span>
        </div>
      </div>

      <button
        className="baseline-btn"
        onClick={onSaveBaseline}
        disabled={!canSaveBaseline || loading}
        title={!canSaveBaseline ? 'Run a simulation first' : ''}
      >
        {hasBaseline ? '◎  Update Baseline' : '◎  Save as Baseline'}
      </button>

      <TrackMap track={track} />

      <button
        className={`run-btn ${loading ? 'loading' : ''}`}
        onClick={onRun}
        disabled={loading}
      >
        {loading ? 'Simulating…' : '▶  Run Simulation'}
      </button>
    </aside>
  );
}
