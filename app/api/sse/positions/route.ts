import { prisma } from "../../../../src/infrastructure/prisma";

export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 5000; // 5초마다 DB 폴링
const HEARTBEAT_INTERVAL_MS = 30000; // 30초마다 heartbeat

export async function GET() {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        if (closed) return;
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, HEARTBEAT_INTERVAL_MS);

      let lastVesselTimestamp = new Date(0);
      let lastFlightTimestamp = new Date(0);

      const poll = async () => {
        if (closed) return;

        try {
          // Vessel positions (new since last check)
          const newVesselPositions = await prisma.vesselPosition.findMany({
            where: { timestamp: { gt: lastVesselTimestamp } },
            include: { vessel: true },
            orderBy: { timestamp: "desc" },
            take: 50,
          });

          if (newVesselPositions.length > 0) {
            lastVesselTimestamp = newVesselPositions[0].timestamp;
            send("vessels", newVesselPositions.map((p) => ({
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

          // Flight positions (latest batch)
          const latestFlight = await prisma.flightPosition.findFirst({
            orderBy: { collectedAt: "desc" },
            select: { collectedAt: true },
          });

          if (latestFlight && latestFlight.collectedAt > lastFlightTimestamp) {
            lastFlightTimestamp = latestFlight.collectedAt;
            const flights = await prisma.flightPosition.findMany({
              where: { collectedAt: latestFlight.collectedAt },
            });
            send("flights", flights.map((f) => ({
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
          console.error("[SSE] Poll error:", error instanceof Error ? error.message : error);
        }

        if (!closed) {
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      };

      // Initial data
      await poll();

      // Cleanup on close
      const cleanup = () => {
        closed = true;
        clearInterval(heartbeat);
      };

      // AbortSignal not available in start(), handle via cancel()
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Store cleanup for cancel
      (stream as unknown as { _cleanup: () => void })._cleanup = cleanup;
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
