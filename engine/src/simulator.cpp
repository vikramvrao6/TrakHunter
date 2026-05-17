#include "simulator.h"
#include "physics.h"
#include <algorithm>
#include <cmath>
#include <limits>

static constexpr double DT                = 0.001;  // integration step, s
static constexpr int    TELEMETRY_INTERVAL = 50;    // sample every 50 ms

LapResult simulate(const Track& track, const VehicleSetup& setup) {
    LapResult result;

    // ── Sector accounting ─────────────────────────────────────────────────────
    int max_sector = 0;
    for (const auto& seg : track.segments)
        max_sector = std::max(max_sector, seg.sector);
    result.sector_times.assign(max_sector, 0.0);

    // ── State variables ───────────────────────────────────────────────────────
    double elapsed      = 0.0;
    double total_dist   = 0.0;
    double speed        = 0.0;   // m/s
    double top_speed    = 0.0;
    double corner_speed_sum   = 0.0;
    int    corner_speed_count = 0;
    double max_braking_dist   = 0.0;

    int    current_sector     = track.segments[0].sector;
    double sector_start_time  = 0.0;

    bool   braking            = false;
    double braking_start_dist = 0.0;

    int telemetry_counter = 0;

    // ── Main loop ─────────────────────────────────────────────────────────────
    for (std::size_t seg_idx = 0; seg_idx < track.segments.size(); ++seg_idx) {
        const auto& seg = track.segments[seg_idx];

        // Sector boundary
        if (seg.sector != current_sector) {
            result.sector_times[current_sector - 1] = elapsed - sector_start_time;
            sector_start_time = elapsed;
            current_sector    = seg.sector;
        }

        // Speed limit for this segment
        double v_limit = std::numeric_limits<double>::max();
        if (seg.type == SegmentType::CORNER) {
            v_limit = compute_max_corner_speed(seg.corner_radius, setup);
            speed   = std::min(speed, v_limit);
        }

        // Look-ahead: required speed at exit of this segment.
        // Wraps around to handle the last segment → first segment boundary.
        std::size_t next_idx = (seg_idx + 1) % track.segments.size();
        const auto& next_seg = track.segments[next_idx];
        double v_exit_target = std::numeric_limits<double>::max();
        if (next_seg.type == SegmentType::CORNER)
            v_exit_target = compute_max_corner_speed(next_seg.corner_radius, setup);
        // Corner segments must not exit above their own limit
        if (seg.type == SegmentType::CORNER)
            v_exit_target = std::min(v_exit_target, v_limit);

        // ── Segment integration loop ──────────────────────────────────────────
        double seg_dist = 0.0;

        while (seg_dist < seg.length) {
            const double remaining = seg.length - seg_dist;

            // Decide: brake or accelerate?
            // Once braking is engaged, stay in it until the target speed is
            // reached. Without this stickiness, the shrinking brake_dist as
            // speed falls would cause premature early-exit and oscillation.
            bool should_brake = false;
            if (braking) {
                should_brake = speed > v_exit_target + 0.05;
            } else {
                const double brake_dist_needed =
                    compute_braking_distance(speed, v_exit_target, setup);
                should_brake = remaining <= brake_dist_needed + 1e-4 &&
                               speed > v_exit_target + 0.05;
            }

            double new_speed;
            double throttle_out, brake_out;

            if (should_brake) {
                // ── Braking ───────────────────────────────────────────────────
                if (!braking) {
                    braking            = true;
                    braking_start_dist = total_dist;
                }
                double N       = compute_normal_force(speed, setup);
                double F_brake = compute_brake_force(setup, N);
                double F_drag  = compute_drag_force(speed, setup);
                double decel   = (F_brake + F_drag) / setup.mass;
                new_speed      = std::max(speed - decel * DT, 0.0);
                throttle_out   = 0.0;
                brake_out      = 1.0;

            } else {
                // ── Accelerating ──────────────────────────────────────────────
                if (braking) {
                    double bd = total_dist - braking_start_dist;
                    max_braking_dist = std::max(max_braking_dist, bd);
                    braking = false;
                }
                double F_engine = compute_engine_force(speed, setup);
                double F_drag   = compute_drag_force(speed, setup);
                double accel    = (F_engine - F_drag) / setup.mass;
                new_speed       = std::min(speed + accel * DT, v_limit);
                new_speed       = std::max(new_speed, 0.0);
                throttle_out    = (accel > 0.0) ? 1.0 : 0.5;
                brake_out       = 0.0;
            }

            // Advance position using trapezoidal rule to avoid zero-step stall
            double step = (speed + new_speed) * 0.5 * DT;
            if (step < 1e-9) {
                // Fully stopped — shouldn't occur in normal driving
                elapsed += DT;
                seg_dist = seg.length;
                break;
            }
            step = std::min(step, remaining);

            seg_dist   += step;
            total_dist += step;
            elapsed    += DT;
            speed       = new_speed;

            // Stats
            top_speed = std::max(top_speed, speed);
            if (seg.type == SegmentType::CORNER) {
                corner_speed_sum += speed;
                ++corner_speed_count;
            }

            // Telemetry sample
            if (telemetry_counter++ % TELEMETRY_INTERVAL == 0) {
                TelemetryPoint pt;
                pt.distance  = total_dist;
                pt.time      = elapsed;
                pt.speed     = speed;
                pt.throttle  = throttle_out;
                pt.brake     = brake_out;
                pt.tire_load = compute_normal_force(speed, setup);
                pt.sector    = seg.sector;
                pt.lateral_g = (seg.type == SegmentType::CORNER && seg.corner_radius > 0.0)
                               ? (speed * speed) / (seg.corner_radius * GRAVITY)
                               : 0.0;
                result.telemetry.push_back(pt);
            }
        }
    }

    // Close last sector
    result.sector_times[current_sector - 1] = elapsed - sector_start_time;

    // Close any open braking event at lap end
    if (braking) {
        double bd = total_dist - braking_start_dist;
        max_braking_dist = std::max(max_braking_dist, bd);
    }

    result.lap_time         = elapsed;
    result.top_speed        = top_speed;
    result.avg_corner_speed = corner_speed_count > 0
                              ? corner_speed_sum / corner_speed_count
                              : 0.0;
    result.braking_distance = max_braking_dist;

    return result;
}
