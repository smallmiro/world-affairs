import type { AirportRepositoryPort } from "../../domain/airport/ports";
import type {
  AirportStatus,
  FlightPosition,
  AirportEvent,
  AirlineOps,
  EmiratesRoute,
} from "../../domain/airport/entities";
import type { PrismaClient } from "../../generated/prisma/client";

function toAirportStatus(row: Record<string, unknown>): AirportStatus {
  return {
    id: row.id as string,
    light: row.light as AirportStatus["light"],
    totalFlights: row.totalFlights as number,
    onTimePercent: row.onTimePercent as number,
    delayedFlights: row.delayedFlights as number,
    cancelledFlights: row.cancelledFlights as number,
    collectedAt: new Date(row.collectedAt as string | Date),
  };
}

function toFlightPosition(row: Record<string, unknown>): FlightPosition {
  return {
    id: row.id as string,
    icao24: row.icao24 as string,
    callsign: row.callsign as string,
    lat: row.lat as number,
    lon: row.lon as number,
    altitude: row.altitude as number,
    speed: row.speed as number,
    heading: row.heading as number,
    onGround: row.onGround as boolean,
    airlineIata: (row.airlineIata as string) ?? null,
    aircraftClass: row.aircraftClass as FlightPosition["aircraftClass"],
    depAirport: (row.depAirport as string) ?? null,
    arrAirport: (row.arrAirport as string) ?? null,
    depTime: (row.depTime as string) ?? null,
    arrTime: (row.arrTime as string) ?? null,
    flightStatus: (row.flightStatus as string) ?? null,
    collectedAt: new Date(row.collectedAt as string | Date),
  };
}

function toAirportEvent(row: Record<string, unknown>): AirportEvent {
  return {
    id: row.id as string,
    sourceId: row.sourceId as string,
    source: row.source as string,
    url: row.url as string,
    title: {
      en: row.titleEn as string,
      ko: row.titleKo as string,
      ja: row.titleJa as string,
    },
    description:
      row.descEn || row.descKo || row.descJa
        ? {
            en: (row.descEn as string) ?? "",
            ko: (row.descKo as string) ?? "",
            ja: (row.descJa as string) ?? "",
          }
        : null,
    eventType: row.eventType as AirportEvent["eventType"],
    eventDate: new Date(row.eventDate as string | Date),
    collectedAt: new Date(row.collectedAt as string | Date),
  };
}

function toAirlineOps(row: Record<string, unknown>): AirlineOps {
  return {
    id: row.id as string,
    airlineIata: row.airlineIata as string,
    airlineName: row.airlineName as string,
    totalFlights: row.totalFlights as number,
    onTimePercent: row.onTimePercent as number,
    status: row.status as AirlineOps["status"],
    collectedAt: new Date(row.collectedAt as string | Date),
  };
}

function toEmiratesRoute(row: Record<string, unknown>): EmiratesRoute {
  return {
    id: row.id as string,
    destination: row.destination as string,
    flightCode: row.flightCode as string,
    status: row.status as EmiratesRoute["status"],
    collectedAt: new Date(row.collectedAt as string | Date),
  };
}

export class AirportRepository implements AirportRepositoryPort {
  constructor(private prisma: PrismaClient) {}

  // ─── Status (upsert — always keep latest) ───────────────────

  async saveStatus(status: AirportStatus): Promise<void> {
    await this.prisma.airportStatus.create({
      data: {
        id: status.id,
        light: status.light,
        totalFlights: status.totalFlights,
        onTimePercent: status.onTimePercent,
        delayedFlights: status.delayedFlights,
        cancelledFlights: status.cancelledFlights,
      },
    });
  }

  async findLatestStatus(): Promise<AirportStatus | null> {
    const row = await this.prisma.airportStatus.findFirst({
      orderBy: { collectedAt: "desc" },
    });
    if (!row) return null;
    return toAirportStatus(row as unknown as Record<string, unknown>);
  }

  // ─── Flights (time-series, always insert) ───────────────────

  async saveFlights(flights: FlightPosition[]): Promise<void> {
    await this.prisma.$transaction(
      flights.map((f) =>
        this.prisma.flightPosition.create({
          data: {
            id: f.id,
            icao24: f.icao24,
            callsign: f.callsign,
            lat: f.lat,
            lon: f.lon,
            altitude: f.altitude,
            speed: f.speed,
            heading: f.heading,
            onGround: f.onGround,
            airlineIata: f.airlineIata,
            aircraftClass: f.aircraftClass,
            depAirport: f.depAirport,
            arrAirport: f.arrAirport,
            depTime: f.depTime,
            arrTime: f.arrTime,
            flightStatus: f.flightStatus,
          },
        }),
      ),
    );
  }

  async findLatestFlights(limit: number): Promise<FlightPosition[]> {
    // Get unique airborne flights from the last 30 minutes
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);
    const rows = await this.prisma.flightPosition.findMany({
      where: { collectedAt: { gt: cutoff }, onGround: false },
      distinct: ["callsign"],
      orderBy: { collectedAt: "desc" },
      take: limit,
    });
    return rows.map((r) => toFlightPosition(r as unknown as Record<string, unknown>));
  }

  // ─── Events (dedup by sourceId + source) ────────────────────

  async saveEvents(events: AirportEvent[]): Promise<void> {
    await this.prisma.$transaction(
      events.map((e) =>
        this.prisma.airportEvent.create({
          data: {
            id: e.id,
            sourceId: e.sourceId,
            source: e.source,
            url: e.url,
            titleEn: e.title.en,
            titleKo: e.title.ko,
            titleJa: e.title.ja,
            descEn: e.description?.en ?? null,
            descKo: e.description?.ko ?? null,
            descJa: e.description?.ja ?? null,
            eventType: e.eventType,
            eventDate: e.eventDate,
          },
        }),
      ),
    );
  }

  async updateEvent(event: AirportEvent): Promise<void> {
    await this.prisma.airportEvent.update({
      where: { id: event.id },
      data: {
        titleEn: event.title.en,
        titleKo: event.title.ko,
        titleJa: event.title.ja,
        descEn: event.description?.en ?? null,
        descKo: event.description?.ko ?? null,
        descJa: event.description?.ja ?? null,
      },
    });
  }

  async findLatestEvents(limit: number): Promise<AirportEvent[]> {
    const rows = await this.prisma.airportEvent.findMany({
      orderBy: { eventDate: "desc" },
      take: limit,
    });
    return rows.map((r) => toAirportEvent(r as unknown as Record<string, unknown>));
  }

  async filterExistingSourceIds(ids: { sourceId: string; source: string }[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();

    const sourceIds = ids.map((i) => i.sourceId);
    const sources = [...new Set(ids.map((i) => i.source))];
    const existing = await this.prisma.airportEvent.findMany({
      where: {
        sourceId: { in: sourceIds },
        source: { in: sources },
      },
      select: { sourceId: true },
    });

    return new Set(existing.map((r) => r.sourceId));
  }

  // ─── Airline Ops (batch replace per collection) ─────────────

  async saveAirlineOps(ops: AirlineOps[]): Promise<void> {
    await this.prisma.$transaction(
      ops.map((o) =>
        this.prisma.airlineOps.create({
          data: {
            id: o.id,
            airlineIata: o.airlineIata,
            airlineName: o.airlineName,
            totalFlights: o.totalFlights,
            onTimePercent: o.onTimePercent,
            status: o.status,
          },
        }),
      ),
    );
  }

  async findLatestAirlineOps(): Promise<AirlineOps[]> {
    const latestCollectedAt = await this.prisma.airlineOps.findFirst({
      orderBy: { collectedAt: "desc" },
      select: { collectedAt: true },
    });
    if (!latestCollectedAt) return [];

    const rows = await this.prisma.airlineOps.findMany({
      where: { collectedAt: latestCollectedAt.collectedAt },
    });
    return rows.map((r) => toAirlineOps(r as unknown as Record<string, unknown>));
  }

  // ─── Emirates Routes (batch replace per collection) ─────────

  async saveEmiratesRoutes(routes: EmiratesRoute[]): Promise<void> {
    await this.prisma.$transaction(
      routes.map((r) =>
        this.prisma.emiratesRoute.create({
          data: {
            id: r.id,
            destination: r.destination,
            flightCode: r.flightCode,
            status: r.status,
          },
        }),
      ),
    );
  }

  async findLatestEmiratesRoutes(): Promise<EmiratesRoute[]> {
    const latestCollectedAt = await this.prisma.emiratesRoute.findFirst({
      orderBy: { collectedAt: "desc" },
      select: { collectedAt: true },
    });
    if (!latestCollectedAt) return [];

    const rows = await this.prisma.emiratesRoute.findMany({
      where: { collectedAt: latestCollectedAt.collectedAt },
    });
    return rows.map((r) => toEmiratesRoute(r as unknown as Record<string, unknown>));
  }

  // ─── Cleanup ────────────────────────────────────────────────

  async deleteOlderThan(days: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const results = await this.prisma.$transaction([
      this.prisma.airportStatus.deleteMany({ where: { collectedAt: { lt: cutoff } } }),
      this.prisma.flightPosition.deleteMany({ where: { collectedAt: { lt: cutoff } } }),
      this.prisma.airportEvent.deleteMany({ where: { collectedAt: { lt: cutoff } } }),
      this.prisma.airlineOps.deleteMany({ where: { collectedAt: { lt: cutoff } } }),
      this.prisma.emiratesRoute.deleteMany({ where: { collectedAt: { lt: cutoff } } }),
      this.prisma.dxbFlightStatus.deleteMany({ where: { collectedAt: { lt: cutoff } } }),
    ]);

    return results.reduce((sum, r) => sum + r.count, 0);
  }
}
