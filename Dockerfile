# ── TrakHunter API – Railway deployment image ─────────────────────────────────
#
# Layout expected by engine_bridge.py (paths are relative to _ROOT = /app):
#   /app/engine/build/trakhunter_sim   ← compiled C++ binary
#   /app/tracks/*.json                 ← track definitions
#   /app/api/main.py                   ← FastAPI app
#   /app/api/engine_bridge.py          ← bridge module
#
# uvicorn is launched from /app/api so that `import engine_bridge` resolves.
# Railway injects $PORT at runtime; falls back to 8000 for local docker run.
# ──────────────────────────────────────────────────────────────────────────────

FROM python:3.12-slim

# Build tools + nlohmann/json (header-only; installed to /usr/include/nlohmann/)
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
        g++ \
        make \
        nlohmann-json3-dev \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Python dependencies (own layer so it caches when only source changes) ─────
COPY api/requirements.txt api/requirements.txt
RUN pip install --no-cache-dir -r api/requirements.txt

# ── Application source ────────────────────────────────────────────────────────
COPY engine/ engine/
COPY tracks/  tracks/
COPY api/     api/

# ── Build C++ simulator ───────────────────────────────────────────────────────
# nlohmann/json.hpp is on the system include path; no extra -I flag needed.
RUN mkdir -p engine/build \
 && g++ -std=c++17 -O2 \
        -I engine/include \
        engine/src/main.cpp \
        engine/src/track.cpp \
        engine/src/vehicle.cpp \
        engine/src/physics.cpp \
        engine/src/simulator.cpp \
        engine/src/telemetry.cpp \
        -o engine/build/trakhunter_sim \
 && chmod +x engine/build/trakhunter_sim

# Quick smoke-test: binary must exist and be executable
RUN test -x engine/build/trakhunter_sim \
 && echo "✓ trakhunter_sim built successfully"

# ── Runtime ───────────────────────────────────────────────────────────────────
# Run from api/ so uvicorn finds main.py and engine_bridge.py as local modules.
WORKDIR /app/api

EXPOSE 8000

# Shell form intentional: allows ${PORT:-8000} expansion at container start.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
