import { NextResponse } from "next/server";
import { prisma } from "../../../../src/infrastructure/prisma";

const ON_TIME_STATUSES = new Set(["On Time", "Gate Closed", "Final Call", "Boarding", "Departed", "Landed"]);

export async function GET() {
  try {
    // Get latest collection batch
    const latest = await prisma.dxbFlightStatus.findFirst({
      orderBy: { collectedAt: "desc" },
      select: { collectedAt: true },
    });

    if (!latest) {
      return NextResponse.json({ airlines: [], ekRoutes: [], count: 0 });
    }

    const flights = await prisma.dxbFlightStatus.findMany({
      where: { collectedAt: latest.collectedAt },
    });

    // Airlines aggregation
    const airlineMap = new Map<string, { name: string; total: number; onTime: number; delayed: number; cancelled: number }>();
    for (const f of flights) {
      if (!airlineMap.has(f.airline)) {
        airlineMap.set(f.airline, { name: f.airline, total: 0, onTime: 0, delayed: 0, cancelled: 0 });
      }
      const a = airlineMap.get(f.airline)!;
      a.total++;
      if (ON_TIME_STATUSES.has(f.status)) a.onTime++;
      if (f.status === "Delayed" || f.status === "New Time") a.delayed++;
      if (f.status === "Cancelled") a.cancelled++;
    }

    const airlines = [...airlineMap.values()]
      .map((a) => ({
        code: a.name.slice(0, 2).toUpperCase(),
        name: a.name,
        flights: a.total,
        onTime: a.total > 0 ? Math.round((a.onTime / a.total) * 100) : 0,
        status: a.cancelled > 0 ? "disrupted" : a.delayed > a.total * 0.3 ? "delays" : "normal",
      }))
      .sort((a, b) => b.flights - a.flights);

    // EK routes
    const ekFlights = flights.filter((f) => f.flightCode.startsWith("EK"));
    const routeMap = new Map<string, { dest: string; flightCode: string; status: string }>();
    for (const f of ekFlights) {
      const dest = f.destination.split(" ")[0]; // First word = airport code
      if (!routeMap.has(dest)) {
        let routeStatus = "open";
        if (f.status === "Cancelled") routeStatus = "suspended";
        else if (f.status === "Delayed" || f.status === "New Time") routeStatus = "diverted";
        routeMap.set(dest, { dest, flightCode: f.flightCode, status: routeStatus });
      }
    }

    const ekRoutes = [...routeMap.values()];

    return NextResponse.json({ airlines, ekRoutes, count: flights.length });
  } catch (error) {
    console.error("[dxb-stats API]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
