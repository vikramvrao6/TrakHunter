"""
main.py  –  TrakHunter FastAPI backend
──────────────────────────────────────
Start with:
    cd api && uvicorn main:app --reload

Endpoints
---------
GET  /api/health      Liveness check + engine availability
GET  /api/tracks      List available track names
POST /api/simulate    Run a lap simulation and return the result
"""

from __future__ import annotations

from typing import Annotated

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

import engine_bridge
from engine_bridge import EngineError

# ── App setup ──────────────────────────────────────────────────────────────────
app = FastAPI(
    title="TrakHunter API",
    description="Race engineering simulation backend — powered by a C++ physics engine.",
    version="0.1.0",
)

# Allow any origin in dev (tighten before any real deployment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ────────────────────────────────────────────────────────────

class VehicleSetup(BaseModel):
    mass: float = Field(..., ge=400, le=1200, description="Vehicle mass in kg")
    tire_grip: float = Field(..., ge=0.5, le=2.0, description="Friction coefficient μ")
    wing_angle: float = Field(..., ge=0.0, le=45.0, description="Wing angle in degrees")
    drag_coefficient: float = Field(..., ge=0.1, le=1.5, description="Aerodynamic drag Cd")
    brake_bias: float = Field(..., ge=0.3, le=0.9, description="Front brake bias (0–1)")
    gear_ratio_preset: int = Field(..., ge=1, le=3, description="1=short, 2=medium, 3=long")

    @field_validator("gear_ratio_preset")
    @classmethod
    def gear_must_be_1_2_or_3(cls, v: int) -> int:
        if v not in (1, 2, 3):
            raise ValueError("gear_ratio_preset must be 1, 2, or 3")
        return v

    def to_engine_dict(self) -> dict:
        """Return a dict the C++ engine can parse from its setup JSON."""
        return {
            "mass":             self.mass,
            "tire_grip":        self.tire_grip,
            "wing_angle":       self.wing_angle,
            "drag_coefficient": self.drag_coefficient,
            "brake_bias":       self.brake_bias,
            "gear_ratio_preset": self.gear_ratio_preset,
        }


class SimulationRequest(BaseModel):
    track_name: str = Field(..., description="Track name matching a file in tracks/")
    setup: VehicleSetup
    full_telemetry: bool = Field(
        False,
        description="If true, include the full telemetry array in the response."
    )


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/api/health", tags=["meta"])
def health() -> dict:
    """
    Liveness check.  Also verifies the C++ binary is reachable.
    """
    engine_ok = engine_bridge._ENGINE_BIN.exists()
    return {
        "status": "ok",
        "engine": "available" if engine_ok else "missing",
    }


@app.get("/api/tracks", tags=["meta"])
def list_tracks() -> dict:
    """
    Return the names of all track JSON files found in the tracks/ directory.
    """
    try:
        tracks = engine_bridge.available_tracks()
    except EngineError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"tracks": tracks}


@app.post("/api/simulate", tags=["simulation"])
def simulate(request: SimulationRequest) -> dict:
    """
    Run the C++ simulator for the given track and vehicle setup.

    - **track_name**: must match a JSON file in `tracks/` (e.g. `"circuit_alpha"`)
    - **setup**: vehicle configuration parameters
    - **full_telemetry**: set `true` to include the per-point telemetry array
    """
    try:
        result = engine_bridge.run_simulation(
            track_name=request.track_name,
            setup=request.setup.to_engine_dict(),
            full=request.full_telemetry,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except EngineError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return result
