#pragma once
#include <string>
#include <vector>

enum class SegmentType { STRAIGHT, CORNER };

struct TrackSegment {
    SegmentType type;
    double      length;         // meters
    double      corner_radius;  // meters (0.0 for STRAIGHT)
    int         sector;
};

struct Track {
    std::string              name;
    std::vector<TrackSegment> segments;
    double                   total_length;  // computed on load
};

Track load_track(const std::string& filepath);
