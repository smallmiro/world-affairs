import { prisma } from "./prisma";
import { pubsub } from "./pubsub";

const POLL_INTERVAL_MS = 5000;

let running = false;
let lastVesselTimestamp = new Date(0);
let lastFlightTimestamp = new Date(0);

async function poll() {
  try {
    // Vessel positions
    const newVessels = await prisma.vesselPosition.findMany({
      where: { timestamp: { gt: lastVesselTimestamp } },
      include: { vessel: true },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    if (newVessels.length > 0) {
      lastVesselTimestamp = newVessels[0].timestamp;
      pubsub.publish("vessels", newVessels.map((p) => ({
        mmsi: p.vessel.mmsi,
        name: p.vessel.name,
        type: p.vessel.type,
        flag: p.vessel.flag,
        lat: p.lat,
        lon: p.lon,
        speed: p.speed,
        course: p.course,
        zone: p.zone,
        status: p.status,
        timestamp: p.timestamp,
      })));
    }

    // Flight positions
    const latestFlight = await prisma.flightPosition.findFirst({
      orderBy: { collectedAt: "desc" },
      select: { collectedAt: true },
    });

    if (latestFlight && latestFlight.collectedAt > lastFlightTimestamp) {
      lastFlightTimestamp = latestFlight.collectedAt;
      const flights = await prisma.flightPosition.findMany({
        where: { collectedAt: latestFlight.collectedAt },
      });
      pubsub.publish("flights", flights.map((f) => ({
        icao24: f.icao24,
        callsign: f.callsign,
        lat: f.lat,
        lon: f.lon,
        altitude: f.altitude,
        speed: f.speed,
        heading: f.heading,
        onGround: f.onGround,
        aircraftClass: f.aircraftClass,
      })));
    }
  } catch (error) {
    console.error("[broadcaster] Poll error:", error instanceof Error ? error.message : error);
  }
}

export function startPositionBroadcaster() {
  if (running) return;
  running = true;

  const tick = () => {
    if (!running) return;
    poll().finally(() => {
      if (running) setTimeout(tick, POLL_INTERVAL_MS);
    });
  };

  tick();
  console.log("[broadcaster] Position broadcaster started (5s interval)");
}

export function stopPositionBroadcaster() {
  running = false;
}
