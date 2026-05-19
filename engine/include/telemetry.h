#pragma once
#include <string>
#include <vector>

struct TelemetryPoint {
    double distance;   // m along lap
    double time;       // s elapsed
    double speed;      // m/s
    double throttle;   // 0.0–1.0
    double brake;      // 0.0–1.0
    double lateral_g;  // g-force (corners only)
    double tire_load;  // N normal force
    int    sector;
};

struct LapResult {
    double lap_time;          // s
    double top_speed;         // m/s
    double avg_corner_speed;  // m/s
    double braking_distance;  // m (longest braking event)
    std::vector<double>        sector_times;  // s, indexed 0 = sector 1
    std::vector<TelemetryPoint> telemetry;
};

// Serialise LapResult to a JSON string (pretty-printed).
// full=false → summary only (no telemetry array, telemetry_points count instead).
// full=true  → complete output including the telemetry array.
std::string lap_result_to_json(const LapResult& result, bool full = false);
