#pragma once
#include "track.h"
#include "vehicle.h"
#include "telemetry.h"

// Run a full lap simulation and return the aggregated result.
// Integration step: 1 ms. Telemetry sampled every 50 ms.
LapResult simulate(const Track& track, const VehicleSetup& setup);
