import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../src/infrastructure/prisma";
import { AirportRepository } from "../../../src/adapters/repositories/airport-repository";

const repo = new AirportRepository(prisma);

type AirportSection = "status" | "flights" | "events" | "airlines" | "routes";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const section = searchParams.get("section") as AirportSection | null;
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);

  try {
    switch (section) {
      case "status": {
        const status = await repo.findLatestStatus();
        return NextResponse.json({ data: status, count: status ? 1 : 0 });
      }
      case "flights": {
        const flights = await repo.findLatestFlights(limit);
        return NextResponse.json({ data: flights, count: flights.length });
      }
      case "events": {
        const events = await repo.findLatestEvents(limit);
        return NextResponse.json({ data: events, count: events.length });
      }
      case "airlines": {
        const airlines = await repo.findLatestAirlineOps();
        return NextResponse.json({ data: airlines, count: airlines.length });
      }
      case "routes": {
        const routes = await repo.findLatestEmiratesRoutes();
        return NextResponse.json({ data: routes, count: routes.length });
      }
      default:
        return NextResponse.json(
          { error: "Invalid section. Use: status, flights, events, airlines, routes", code: 400 },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error(`[airport API] GET section=${section} failed:`, error);
    return NextResponse.json(
      { error: "Failed to fetch airport data", code: 500 },
      { status: 500 },
    );
  }
}
