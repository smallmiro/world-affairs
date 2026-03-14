import type {
  AirportLight,
  AirportEventType,
  AirlineOpsStatus,
  RouteStatus,
  AircraftClass,
  TranslatedText,
} from "../../shared/types";

// ─── Raw Entities (from collectors) ───────────────────────────

export interface RawAirportStatus {
  light: AirportLight;
  totalFlights: number;
  onTimePercent: number;
  delayedFlights: number;
  cancelledFlights: number;
}

export interface RawFlightPosition {
  icao24: string;
  callsign: string;
  lat: number;
  lon: number;
  altitude: number; // feet
  speed: number; // knots
  heading: number;
  onGround: boolean;
  airlineIata: string | null;
  aircraftClass: AircraftClass;
  depAirport: string | null;
  arrAirport: string | null;
  depTime: string | null;
  arrTime: string | null;
  flightStatus: string | null;
}

export interface RawAirportEvent {
  sourceId: string;
  source: string;
  url: string;
  title: string;
  description: string | null;
  eventType: AirportEventType;
  eventDate: Date;
}

export interface RawAirlineOps {
  airlineIata: string;
  airlineName: string;
  totalFlights: number;
  onTimePercent: number;
  status: AirlineOpsStatus;
}

export interface RawEmiratesRoute {
  destination: string;
  flightCode: string;
  status: RouteStatus;
}

// ─── Domain Entities ──────────────────────────────────────────

export interface AirportStatus {
  id: string;
  light: AirportLight;
  totalFlights: number;
  onTimePercent: number;
  delayedFlights: number;
  cancelledFlights: number;
  collectedAt: Date;
}

export interface FlightPosition {
  id: string;
  icao24: string;
  callsign: string;
  lat: number;
  lon: number;
  altitude: number;
  speed: number;
  heading: number;
  onGround: boolean;
  airlineIata: string | null;
  aircraftClass: AircraftClass;
  depAirport: string | null;
  arrAirport: string | null;
  depTime: string | null;
  arrTime: string | null;
  flightStatus: string | null;
  collectedAt: Date;
}

export interface AirportEvent {
  id: string;
  sourceId: string;
  source: string;
  url: string;
  title: TranslatedText;
  description: TranslatedText | null;
  eventType: AirportEventType;
  eventDate: Date;
  collectedAt: Date;
}

export interface AirlineOps {
  id: string;
  airlineIata: string;
  airlineName: string;
  totalFlights: number;
  onTimePercent: number;
  status: AirlineOpsStatus;
  collectedAt: Date;
}

export interface EmiratesRoute {
  id: string;
  destination: string;
  flightCode: string;
  status: RouteStatus;
  collectedAt: Date;
}
