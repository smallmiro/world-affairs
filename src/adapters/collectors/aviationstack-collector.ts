import type { AviationStackCollectorPort } from "../../domain/airport/ports";
import type {
  RawAirportStatus,
  RawAirlineOps,
  RawEmiratesRoute,
} from "../../domain/airport/entities";
import type {
  CollectionResult,
  AirportLight,
  AirlineOpsStatus,
  RouteStatus,
} from "../../shared/types";

// ─── AviationStack API types ────────────────────────────────

interface AviationStackResponse {
  pagination: { limit: number; offset: number; count: number; total: number };
  data: AviationStackFlight[];
}

interface AviationStackFlight {
  flight_date: string;
  flight_status: string;
  departure: {
    airport: string;
    iata: string;
    delay: number | null;
    scheduled: string;
    actual: string | null;
  };
  arrival: {
    airport: string;
    iata: string;
    delay: number | null;
    scheduled: string;
    actual: string | null;
  };
  airline: {
    name: string;
    iata: string;
  };
  flight: {
    number: string;
    iata: string;
  };
}

// ─── Collector ──────────────────────────────────────────────

const BASE_URL = "http://api.aviationstack.com/v1/flights";
const SOURCE = "aviationstack";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export class AviationStackCollector implements AviationStackCollectorPort {
  private cachedResponse: AviationStackFlight[] | null = null;
  private cachedAt: Date | null = null;
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.AVIATIONSTACK_API_KEY ?? "";
  }

  async collectStatus(): Promise<CollectionResult<RawAirportStatus>> {
    const flights = await this.fetchOnce();
    const now = new Date();

    const totalFlights = flights.length;
    const cancelledFlights = flights.filter(
      (f) => f.flight_status === "cancelled",
    ).length;
    const delayedFlights = flights.filter((f) => isDelayed(f)).length;
    const onTimeFlights = totalFlights - delayedFlights - cancelledFlights;
    const onTimePercent =
      totalFlights > 0 ? Math.round((onTimeFlights / totalFlights) * 100) : 0;
    const light = determineLight(onTimePercent);

    return {
      data: {
        light,
        totalFlights,
        onTimePercent,
        delayedFlights,
        cancelledFlights,
      },
      collectedAt: now,
      source: SOURCE,
    };
  }

  async collectAirlineOps(): Promise<CollectionResult<RawAirlineOps[]>> {
    const flights = await this.fetchOnce();
    const now = new Date();

    const grouped = groupBy(flights, (f) => f.airline.iata);
    const ops: RawAirlineOps[] = [];

    for (const [airlineIata, airlineFlights] of Object.entries(grouped)) {
      if (!airlineIata) continue;

      const total = airlineFlights.length;
      const cancelled = airlineFlights.filter(
        (f) => f.flight_status === "cancelled",
      ).length;
      const delayed = airlineFlights.filter((f) => isDelayed(f)).length;
      const onTime = total - delayed - cancelled;
      const onTimePercent =
        total > 0 ? Math.round((onTime / total) * 100) : 0;
      const status = determineAirlineStatus(onTimePercent);

      ops.push({
        airlineIata,
        airlineName: airlineFlights[0].airline.name ?? airlineIata,
        totalFlights: total,
        onTimePercent,
        status,
      });
    }

    return {
      data: ops,
      collectedAt: now,
      source: SOURCE,
    };
  }

  async collectEmiratesRoutes(): Promise<
    CollectionResult<RawEmiratesRoute[]>
  > {
    const flights = await this.fetchOnce();
    const now = new Date();

    const ekFlights = flights.filter((f) => f.airline.iata === "EK");
    const grouped = groupBy(ekFlights, (f) => f.arrival.iata);
    const routes: RawEmiratesRoute[] = [];

    for (const [destination, destFlights] of Object.entries(grouped)) {
      if (!destination) continue;

      const status = determineRouteStatus(destFlights);
      const flightCode = destFlights[0].flight.iata;

      routes.push({
        destination,
        flightCode,
        status,
      });
    }

    return {
      data: routes,
      collectedAt: now,
      source: SOURCE,
    };
  }

  private async fetchOnce(): Promise<AviationStackFlight[]> {
    if (
      this.cachedResponse &&
      this.cachedAt &&
      Date.now() - this.cachedAt.getTime() < CACHE_TTL
    ) {
      return this.cachedResponse;
    }

    if (!this.apiKey) {
      throw new Error(
        "AviationStack API key is required. Set AVIATIONSTACK_API_KEY env variable.",
      );
    }

    const url = `${BASE_URL}?access_key=${this.apiKey}&dep_iata=DXB`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `AviationStack API error: ${response.status}`,
      );
    }

    const body = (await response.json()) as AviationStackResponse;
    const flights = body.data ?? [];

    this.cachedResponse = flights;
    this.cachedAt = new Date();

    return flights;
  }
}

// ─── Helper functions ───────────────────────────────────────

function isDelayed(flight: AviationStackFlight): boolean {
  return (
    flight.flight_status !== "cancelled" &&
    ((flight.departure.delay !== null && flight.departure.delay > 0) ||
      (flight.arrival.delay !== null && flight.arrival.delay > 0))
  );
}

function determineLight(onTimePercent: number): AirportLight {
  if (onTimePercent > 85) return "green";
  if (onTimePercent > 60) return "amber";
  return "red";
}

function determineAirlineStatus(onTimePercent: number): AirlineOpsStatus {
  if (onTimePercent > 90) return "normal";
  if (onTimePercent > 70) return "delays";
  return "disrupted";
}

function determineRouteStatus(flights: AviationStackFlight[]): RouteStatus {
  for (const flight of flights) {
    if (flight.flight_status === "cancelled") return "suspended";
    if (flight.flight_status === "diverted") return "diverted";
  }
  return "open";
}

function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string,
): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }
  return result;
}
