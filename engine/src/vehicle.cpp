#include "vehicle.h"
#include <fstream>
#include <stdexcept>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

VehicleSetup load_setup(const std::string& filepath) {
    std::ifstream f(filepath);
    if (!f.is_open())
        throw std::runtime_error("Cannot open setup file: " + filepath);

    json j;
    try {
        f >> j;
    } catch (const json::parse_error& e) {
        throw std::runtime_error(std::string("Setup JSON parse error: ") + e.what());
    }

    VehicleSetup s{};
    s.mass             = j.at("mass").get<double>();
    s.tire_grip        = j.at("tire_grip").get<double>();
    s.wing_angle       = j.at("wing_angle").get<double>();
    s.drag_coefficient = j.at("drag_coefficient").get<double>();
    s.brake_bias       = j.at("brake_bias").get<double>();

    int preset = j.at("gear_ratio_preset").get<int>();
    switch (preset) {
        case 1:  s.gear_ratio_preset = GearPreset::SHORT;  break;
        case 2:  s.gear_ratio_preset = GearPreset::MEDIUM; break;
        case 3:  s.gear_ratio_preset = GearPreset::LONG;   break;
        default: throw std::runtime_error("gear_ratio_preset must be 1, 2, or 3");
    }

    // Basic range validation
    if (s.mass < 400.0 || s.mass > 1200.0)
        throw std::runtime_error("mass out of range [400, 1200] kg");
    if (s.tire_grip < 0.5 || s.tire_grip > 2.0)
        throw std::runtime_error("tire_grip out of range [0.5, 2.0]");
    if (s.wing_angle < 0.0 || s.wing_angle > 45.0)
        throw std::runtime_error("wing_angle out of range [0, 45] degrees");
    if (s.drag_coefficient < 0.1 || s.drag_coefficient > 1.5)
        throw std::runtime_error("drag_coefficient out of range [0.1, 1.5]");
    if (s.brake_bias < 0.3 || s.brake_bias > 0.9)
        throw std::runtime_error("brake_bias out of range [0.3, 0.9]");

    return s;
}
