import type { OpenSkyCollectorPort } from "../../domain/airport/ports";
import type { RawFlightPosition } from "../../domain/airport/entities";
import type { CollectionResult, AircraftClass } from "../../shared/types";

const OPENSKY_API_URL =
  "https://opensky-network.org/api/states/all?lamin=23.5&lomin=53.0&lamax=27.0&lomax=57.5";

const METERS_TO_FEET = 3.28084;
const MPS_TO_KNOTS = 1.94384;

const ICAO_TO_IATA: Record<string, string> = {
  UAE: "EK",
  FDB: "FZ",
  QTR: "QR",
  ETD: "EY",
  SVA: "SV",
  QFA: "QF",
  BAW: "BA",
  DLH: "LH",
  KAL: "KE",
  ANA: "NH",
  SIA: "SQ",
  THY: "TK",
  JAI: "9W",
  IGO: "6E",
  FDX: "FX",
  UPS: "5X",
};

function resolveAirlineIata(callsign: string): string | null {
  const icaoPrefix = callsign.slice(0, 3).toUpperCase();
  return ICAO_TO_IATA[icaoPrefix] ?? null;
}

function resolveAircraftClass(callsign: string): AircraftClass {
  return callsign.toUpperCase().startsWith("UAE") ? "ek" : "other";
}

function buildHeaders(): HeadersInit {
  const username = process.env.OPENSKY_USERNAME;
  const password = process.env.OPENSKY_PASSWORD;
  if (username && password) {
    const encoded = Buffer.from(`${username}:${password}`).toString("base64");
    return { Authorization: `Basic ${encoded}` };
  }
  return {};
}

type OpenSkyState = (string | number | boolean | number[] | null)[];

interface OpenSkyResponse {
  time: number;
  states: OpenSkyState[] | null;
}

function parseState(state: OpenSkyState): RawFlightPosition | null {
  const lat = state[6] as number | null;
  const lon = state[5] as number | null;
  if (lat == null || lon == null) return null;

  const callsign = ((state[1] as string) ?? "").trim();
  const altitudeMeters = (state[7] as number | null) ?? 0;
  const velocityMps = (state[9] as number | null) ?? 0;
  const heading = (state[10] as number | null) ?? 0;

  return {
    icao24: state[0] as string,
    callsign,
    lat,
    lon,
    altitude: altitudeMeters * METERS_TO_FEET,
    speed: velocityMps * MPS_TO_KNOTS,
    heading,
    onGround: state[8] as boolean,
    airlineIata: resolveAirlineIata(callsign),
    aircraftClass: resolveAircraftClass(callsign),
  };
}

export class OpenSkyCollector implements OpenSkyCollectorPort {
  async collectFlights(): Promise<CollectionResult<RawFlightPosition[]>> {
    const response = await fetch(OPENSKY_API_URL, {
      headers: buildHeaders(),
    });

    if (response.status === 429) {
      console.warn("[OpenSky] Rate limited (429). Returning empty result.");
      return { data: [], collectedAt: new Date(), source: "opensky" };
    }

    if (!response.ok) {
      throw new Error(
        `OpenSky API error: ${response.status} ${response.statusText}`
      );
    }

    const body: OpenSkyResponse = await response.json();
    const states = body.states ?? [];

    const flights: RawFlightPosition[] = [];
    for (const state of states) {
      const parsed = parseState(state);
      if (parsed) flights.push(parsed);
    }

    return {
      data: flights,
      collectedAt: new Date(),
      source: "opensky",
    };
  }
}
