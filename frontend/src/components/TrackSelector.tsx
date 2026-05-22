// Converts a track key like "circuit_alpha" → "Circuit Alpha"
export function trackDisplayName(key: string): string {
  return key
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface Props {
  tracks: string[];
  selected: string;
  onChange: (track: string) => void;
  disabled?: boolean;
}

export default function TrackSelector({ tracks, selected, onChange, disabled }: Props) {
  return (
    <div className="track-selector-wrapper">
      <select
        className="track-selector"
        value={selected}
        disabled={disabled || tracks.length === 0}
        onChange={e => onChange(e.target.value)}
        aria-label="Select track"
      >
        {tracks.length === 0 ? (
          <option value="">Loading tracks…</option>
        ) : (
          tracks.map(t => (
            <option key={t} value={t}>
              {trackDisplayName(t)}
            </option>
          ))
        )}
      </select>
      <span className="track-selector-arrow">▾</span>
    </div>
  );
}
