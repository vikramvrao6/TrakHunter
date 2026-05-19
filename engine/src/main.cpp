#include "track.h"
#include "vehicle.h"
#include "simulator.h"
#include "telemetry.h"
#include <iostream>
#include <cstdlib>
#include <cstring>

static void print_usage() {
    std::cerr << "Usage: trakhunter_sim <track.json> <setup.json> [--full]\n"
              << "\n"
              << "  (no flag)  Print summary JSON: lap time, speeds, braking distance,\n"
              << "             sector times, and telemetry point count.\n"
              << "  --full     Print complete JSON including the full telemetry array.\n";
}

int main(int argc, char* argv[]) {
    // ── Argument parsing ──────────────────────────────────────────────────────
    if (argc < 3 || argc > 4) {
        print_usage();
        return EXIT_FAILURE;
    }

    bool full_output = false;
    if (argc == 4) {
        if (std::strcmp(argv[3], "--full") == 0) {
            full_output = true;
        } else {
            std::cerr << "Error: unknown flag '" << argv[3] << "'\n\n";
            print_usage();
            return EXIT_FAILURE;
        }
    }

    // ── Simulate ──────────────────────────────────────────────────────────────
    try {
        const Track        track  = load_track(argv[1]);
        const VehicleSetup setup  = load_setup(argv[2]);
        const LapResult    result = simulate(track, setup);
        std::cout << lap_result_to_json(result, full_output) << '\n';
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << '\n';
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}
