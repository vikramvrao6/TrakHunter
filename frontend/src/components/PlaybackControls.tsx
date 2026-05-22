export interface PlaybackProps {
  index: number;
  total: number;
  isPlaying: boolean;
  speed: number;
  progress: number;   // 0..1, passed through to TrackMap
  disabled: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onJumpToEnd: () => void;
  onSpeedChange: (s: number) => void;
}

const SPEEDS = [1, 2, 4, 8] as const;

export default function PlaybackControls({
  index, total, isPlaying, speed, disabled,
  onPlay, onPause, onReset, onJumpToEnd, onSpeedChange,
}: PlaybackProps) {
  const pct  = total > 1 ? (index / (total - 1)) * 100 : 0;
  const done = total > 0 && index >= total - 1;

  return (
    <div className="playback-card">
      <span className="playback-header">Playback</span>

      {/* Progress bar */}
      <div className="playback-progress-bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="playback-progress-fill" style={{ width: `${pct.toFixed(2)}%` }} />
      </div>

      <div className="playback-controls-row">
        {/* Transport buttons */}
        <div className="playback-transport">
          <button className="playback-btn" onClick={onReset}      disabled={disabled} title="Reset">⏮</button>
          <button
            className={`playback-btn playback-btn-play ${isPlaying ? 'active' : ''}`}
            onClick={isPlaying ? onPause : onPlay}
            disabled={disabled || done}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="playback-btn" onClick={onJumpToEnd} disabled={disabled || done} title="Jump to End">⏭</button>
        </div>

        {/* Speed toggles */}
        <div className="playback-speed-group">
          {SPEEDS.map(s => (
            <button
              key={s}
              className={`speed-btn ${speed === s ? 'active' : ''}`}
              onClick={() => onSpeedChange(s)}
              disabled={disabled}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
