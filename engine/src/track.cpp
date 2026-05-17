#include "track.h"
#include <fstream>
#include <stdexcept>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

Track load_track(const std::string& filepath) {
    std::ifstream f(filepath);
    if (!f.is_open())
        throw std::runtime_error("Cannot open track file: " + filepath);

    json j;
    try {
        f >> j;
    } catch (const json::parse_error& e) {
        throw std::runtime_error(std::string("Track JSON parse error: ") + e.what());
    }

    Track track;
    track.name = j.at("name").get<std::string>();
    track.total_length = 0.0;

    for (const auto& seg_j : j.at("segments")) {
        TrackSegment seg{};

        const std::string type_str = seg_j.at("type").get<std::string>();
        if (type_str == "straight") {
            seg.type = SegmentType::STRAIGHT;
            seg.corner_radius = 0.0;
        } else if (type_str == "corner") {
            seg.type = SegmentType::CORNER;
            seg.corner_radius = seg_j.at("corner_radius").get<double>();
            if (seg.corner_radius <= 0.0)
                throw std::runtime_error("corner_radius must be > 0");
        } else {
            throw std::runtime_error("Unknown segment type: " + type_str);
        }

        seg.length = seg_j.at("length").get<double>();
        if (seg.length <= 0.0)
            throw std::runtime_error("Segment length must be > 0");

        seg.sector = seg_j.at("sector").get<int>();
        if (seg.sector < 1)
            throw std::runtime_error("Sector number must be >= 1");

        track.total_length += seg.length;
        track.segments.push_back(seg);
    }

    if (track.segments.empty())
        throw std::runtime_error("Track must have at least one segment");

    return track;
}
