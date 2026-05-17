#include "telemetry.h"
#include <nlohmann/json.hpp>
#include <iomanip>
#include <sstream>

using json = nlohmann::json;

std::string lap_result_to_json(const LapResult& r) {
    json j;

    j["lap_time"]         = std::round(r.lap_time * 1000.0) / 1000.0;
    j["top_speed"]        = std::round(r.top_speed * 100.0) / 100.0;
    j["avg_corner_speed"] = std::round(r.avg_corner_speed * 100.0) / 100.0;
    j["braking_distance"] = std::round(r.braking_distance * 10.0) / 10.0;

    j["sector_times"] = json::array();
    for (double st : r.sector_times)
        j["sector_times"].push_back(std::round(st * 1000.0) / 1000.0);

    j["telemetry"] = json::array();
    for (const auto& pt : r.telemetry) {
        json p;
        p["distance"]  = std::round(pt.distance  * 10.0)  / 10.0;
        p["time"]      = std::round(pt.time       * 1000.0) / 1000.0;
        p["speed"]     = std::round(pt.speed      * 100.0)  / 100.0;
        p["throttle"]  = std::round(pt.throttle   * 100.0)  / 100.0;
        p["brake"]     = std::round(pt.brake      * 100.0)  / 100.0;
        p["lateral_g"] = std::round(pt.lateral_g  * 1000.0) / 1000.0;
        p["tire_load"] = std::round(pt.tire_load  * 10.0)   / 10.0;
        p["sector"]    = pt.sector;
        j["telemetry"].push_back(p);
    }

    return j.dump(2);
}
