"""
engine_bridge.py
────────────────
Thin wrapper around the C++ trakhunter_sim binary.

Responsibilities:
  - Locate the executable and the tracks directory relative to this file.
  - Write the caller-supplied setup dict to a NamedTemporaryFile.
  - Invoke the binary as a subprocess (summary mode by default, full when requested).
  - Parse and return the JSON result, or raise a descriptive exception.
"""

import json
import subprocess
import tempfile
from pathlib import Path

# ── Path resolution ────────────────────────────────────────────────────────────
# api/ lives at  <root>/api/
# binary lives at <root>/engine/build/trakhunter_sim
# tracks live at  <root>/tracks/
_API_DIR    = Path(__file__).parent.resolve()
_ROOT       = _API_DIR.parent
_ENGINE_BIN = _ROOT / "engine" / "build" / "trakhunter_sim"
_TRACKS_DIR = _ROOT / "tracks"


class EngineError(RuntimeError):
    """Raised for any failure originating in the C++ engine subprocess."""


def _require_binary() -> Path:
    if not _ENGINE_BIN.exists():
        raise EngineError(
            f"Simulator binary not found at '{_ENGINE_BIN}'. "
            "Build it with: cd engine && clang++ -std=c++17 -O2 -I include -I build "
            "src/*.cpp -o build/trakhunter_sim"
        )
    return _ENGINE_BIN


def available_tracks() -> list[str]:
    """Return track names (stems) for every .json file in the tracks/ directory."""
    if not _TRACKS_DIR.is_dir():
        raise EngineError(f"Tracks directory not found: '{_TRACKS_DIR}'")
    return sorted(p.stem for p in _TRACKS_DIR.glob("*.json"))


def track_path(track_name: str) -> Path:
    """Resolve and validate a track name → absolute path."""
    path = _TRACKS_DIR / f"{track_name}.json"
    if not path.exists():
        known = available_tracks()
        raise FileNotFoundError(
            f"Track '{track_name}' not found. Available tracks: {known}"
        )
    return path


def run_simulation(track_name: str, setup: dict, full: bool = False) -> dict:
    """
    Run the C++ simulator for the given track and setup.

    Parameters
    ----------
    track_name : str   e.g. "circuit_alpha"
    setup      : dict  VehicleSetup fields
    full       : bool  If True, request the full telemetry array from the engine.

    Returns
    -------
    dict  Parsed LapResult JSON.

    Raises
    ------
    FileNotFoundError  – track not found
    EngineError        – binary missing, subprocess crash, or invalid output
    """
    binary    = _require_binary()
    trk_path  = track_path(track_name)

    # Write setup to a temp file; deleted automatically on context exit.
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".json", delete=True
    ) as tmp:
        json.dump(setup, tmp)
        tmp.flush()

        cmd = [str(binary), str(trk_path), tmp.name]
        if full:
            cmd.append("--full")

        try:
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=15,          # hard ceiling; a lap sim runs in <10 ms
            )
        except subprocess.TimeoutExpired:
            raise EngineError("Simulator timed out after 15 s")
        except OSError as exc:
            raise EngineError(f"Failed to launch simulator: {exc}") from exc

        if proc.returncode != 0:
            stderr = proc.stderr.strip() or "(no stderr)"
            raise EngineError(
                f"Simulator exited with code {proc.returncode}: {stderr}"
            )

        stdout = proc.stdout.strip()
        if not stdout:
            raise EngineError("Simulator produced no output")

        try:
            return json.loads(stdout)
        except json.JSONDecodeError as exc:
            raise EngineError(
                f"Simulator output is not valid JSON: {exc}\n"
                f"Raw output (first 200 chars): {stdout[:200]}"
            ) from exc
