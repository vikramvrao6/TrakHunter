cmake_minimum_required(VERSION 3.16)
project(TrakHunter VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# ── Fetch nlohmann/json (header-only, no build step) ─────────────────────────
include(FetchContent)

FetchContent_Declare(
    nlohmann_json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG        v3.11.3
    GIT_SHALLOW    TRUE
)
FetchContent_MakeAvailable(nlohmann_json)

# ── Simulation engine binary ──────────────────────────────────────────────────
add_executable(trakhunter_sim
    src/main.cpp
    src/track.cpp
    src/vehicle.cpp
    src/physics.cpp
    src/simulator.cpp
    src/telemetry.cpp
)

target_include_directories(trakhunter_sim PRIVATE include)
target_link_libraries(trakhunter_sim PRIVATE nlohmann_json::nlohmann_json)

# Treat warnings as errors in CI; leave as warnings locally for fast iteration
target_compile_options(trakhunter_sim PRIVATE
    $<$<CXX_COMPILER_ID:GNU,Clang,AppleClang>:-Wall -Wextra -O2>
    $<$<CXX_COMPILER_ID:MSVC>:/W4 /O2>
)
