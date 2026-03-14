import type { CollectionResult } from "../../shared/types";
import type {
  RawFlightPosition,
  RawAirportStatus,
  RawAirlineOps,
  RawEmiratesRoute,
  RawAirportEvent,
  AirportStatus,
  FlightPosition,
  AirportEvent,
  AirlineOps,
  EmiratesRoute,
} from "./entities";

// ─── Collector Ports ──────────────────────────────────────────

export interface OpenSkyCollectorPort {
  collectFlights(): Promise<CollectionResult<RawFlightPosition[]>>;
}

export interface AviationStackCollectorPort {
  collectStatus(): Promise<CollectionResult<RawAirportStatus>>;
  collectAirlineOps(): Promise<CollectionResult<RawAirlineOps[]>>;
  collectEmiratesRoutes(): Promise<CollectionResult<RawEmiratesRoute[]>>;
}

export interface AirportEventCollectorPort {
  collectEvents(): Promise<CollectionResult<RawAirportEvent[]>>;
}

// ─── Repository Port ──────────────────────────────────────────

export interface AirportRepositoryPort {
  // Status
  saveStatus(status: AirportStatus): Promise<void>;
  findLatestStatus(): Promise<AirportStatus | null>;

  // Flights
  saveFlights(flights: FlightPosition[]): Promise<void>;
  findLatestFlights(limit: number): Promise<FlightPosition[]>;
  deleteFlightsByIcao24(icao24s: string[]): Promise<number>;
  deleteStaleFlights(activeIcao24s: string[]): Promise<number>;

  // Events
  saveEvents(events: AirportEvent[]): Promise<void>;
  updateEvent(event: AirportEvent): Promise<void>;
  findLatestEvents(limit: number): Promise<AirportEvent[]>;
  filterExistingSourceIds(ids: { sourceId: string; source: string }[]): Promise<Set<string>>;

  // Airline Ops
  saveAirlineOps(ops: AirlineOps[]): Promise<void>;
  findLatestAirlineOps(): Promise<AirlineOps[]>;

  // Emirates Routes
  saveEmiratesRoutes(routes: EmiratesRoute[]): Promise<void>;
  findLatestEmiratesRoutes(): Promise<EmiratesRoute[]>;

  // Cleanup
  deleteOlderThan(days: number): Promise<number>;
}
