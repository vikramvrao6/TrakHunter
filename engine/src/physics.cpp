#include "physics.h"
#include <cmath>
#include <algorithm>
#include <stdexcept>

double compute_downforce(double v, const VehicleSetup& setup) {
    // F_df = 0.5 * rho * A * K_LIFT * wing_angle * v²
    return K_DF * setup.wing_angle * v * v;
}

double compute_normal_force(double v, const VehicleSetup& setup) {
    return setup.mass * GRAVITY + compute_downforce(v, setup);
}

double compute_drag_force(double v, const VehicleSetup& setup) {
    // Total Cd = base Cd + induced drag from wing angle
    double total_cd = setup.drag_coefficient + K_WING_DRAG * setup.wing_angle;
    return 0.5 * AIR_DENSITY * FRONTAL_AREA * total_cd * v * v;
}

double compute_engine_force(double v, const VehicleSetup& setup) {
    double power{};
    switch (setup.gear_ratio_preset) {
        case GearPreset::SHORT:  power = POWER_SHORT;  break;
        case GearPreset::MEDIUM: power = POWER_MEDIUM; break;
        case GearPreset::LONG:   power = POWER_LONG;   break;
    }
    // Power-limited force; avoid div/0 at standstill
    double f_power = power / std::max(v, 5.0);
    // Traction-limited force (grip on driven wheels, rear ≈ 65 % of load)
    double f_traction = setup.tire_grip * setup.mass * GRAVITY * 0.65;
    return std::min(f_power, f_traction);
}

double compute_brake_force(const VehicleSetup& setup, double normal_force) {
    // Optimal bias ~0.62 (forward-biased for aero cars). Degrades parabolically away from optimum.
    double offset = setup.brake_bias - 0.62;
    double effectiveness = std::clamp(1.0 - 6.0 * offset * offset, 0.70, 1.0);
    return setup.tire_grip * normal_force * effectiveness;
}

double compute_max_corner_speed(double radius, const VehicleSetup& setup) {
    // Centripetal balance with downforce:
    //   tire_grip * (mass*g + K_DF * wing * v²) = mass * v² / radius
    //   => v² = tire_grip * mass * g / (mass/radius - tire_grip * K_DF * wing)
    double numerator   = setup.tire_grip * setup.mass * GRAVITY;
    double denominator = setup.mass / radius - setup.tire_grip * K_DF * setup.wing_angle;

    if (denominator <= 1e-6)
        return 120.0;  // downforce dominates — cap at ~432 km/h

    return std::sqrt(numerator / denominator);
}

double compute_braking_distance(double v0, double v1, const VehicleSetup& setup) {
    if (v0 <= v1) return 0.0;

    // Estimate forces at average speed for look-ahead accuracy
    double v_avg = (v0 + v1) * 0.5;
    double N      = compute_normal_force(v_avg, setup);
    double F_brake = compute_brake_force(setup, N);
    double F_drag  = compute_drag_force(v_avg, setup);
    double decel   = (F_brake + F_drag) / setup.mass;

    if (decel <= 0.0) return 1e9;

    return (v0 * v0 - v1 * v1) / (2.0 * decel);
}
