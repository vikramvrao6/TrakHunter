#pragma once
#include <string>

enum class GearPreset { SHORT = 1, MEDIUM = 2, LONG = 3 };

struct VehicleSetup {
    double    mass;               // kg        (600–900)
    double    tire_grip;          // μ          (0.8–1.6)
    double    wing_angle;         // degrees   (0–30)
    double    drag_coefficient;   // Cd base   (0.25–0.65)
    double    brake_bias;         // front %   (0.50–0.75)
    GearPreset gear_ratio_preset; // 1/2/3
};

VehicleSetup load_setup(const std::string& filepath);
