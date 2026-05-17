#include "track.h"
#include "vehicle.h"
#include "simulator.h"
#include "telemetry.h"
#include <iostream>
#include <cstdlib>

int main(int argc, char* argv[]) {
    if (argc != 3) {
        std::cerr << "Usage: trakhunter_sim <track.json> <setup.json>\n";
        return EXIT_FAILURE;
    }

    try {
        const Track        track = load_track(argv[1]);
        const VehicleSetup setup = load_setup(argv[2]);
        const LapResult    result = simulate(track, setup);
        std::cout << lap_result_to_json(result) << '\n';
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << '\n';
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}
