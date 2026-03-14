import type { OpenSkyCollectorPort } from "../../domain/airport/ports";
import type { RawFlightPosition } from "../../domain/airport/entities";
import type { CollectionResult, AircraftClass } from "../../shared/types";

// Middle East + Indian Ocean approach: covers Gulf, Red Sea, Iran, India approach, East Africa
const OPENSKY_API_URL =
  "https://opensky-network.org/api/states/all?lamin=10.0&lomin=30.0&lamax=40.0&lomax=70.0";

const METERS_TO_FEET = 3.28084;
const MPS_TO_KNOTS = 1.94384;

const ICAO_TO_IATA: Record<string, string> = {
  // UAE carriers
  UAE: "EK", FDB: "FZ", ETD: "EY",
  // Gulf carriers
  QTR: "QR", GFA: "GF", SVA: "SV", KAC: "KU", OMA: "WY", MEA: "ME",
  // Major international
  BAW: "BA", DLH: "LH", KAL: "KE", ANA: "NH", SIA: "SQ", THY: "TK",
  QFA: "QF", JAI: "9W", IGO: "6E", FDX: "FX", UPS: "5X",
  // Regional
  ABY: "G9", PAX: "2P", FJL: "F3", ADY: "AD", MSC: "M5", ABQ: "A7",
  PIA: "PK", IRA: "IR", IAW: "IA",
};

// UAE-based airline ICAO prefixes
const UAE_CARRIERS = new Set(["UAE", "FDB", "ETD"]);

// Airline hub airports (ICAO prefix → home airport IATA)
const AIRLINE_HUB: Record<string, string> = {
  UAE: "DXB", FDB: "DXB", ETD: "AUH",
  QTR: "DOH", SVA: "JED", GFA: "BAH", KAC: "KWI", OMA: "MCT", MEA: "BEY",
  BAW: "LHR", DLH: "FRA", KAL: "ICN", ANA: "NRT", SIA: "SIN", THY: "IST",
  QFA: "SYD", JAI: "DEL", IGO: "DEL", PIA: "KHI", IRA: "IKA",
  ABY: "SHJ", PGT: "SAW", MSR: "CAI", RJA: "AMM",
};

const DXB_AREA = { minLat: 23, maxLat: 27, minLon: 53, maxLon: 57 };

function resolveRoute(callsign: string, lat: number, lon: number): { depAirport: string | null; arrAirport: string | null } {
  const prefix = callsign.trim().slice(0, 3).toUpperCase();
  const hub = AIRLINE_HUB[prefix];
  if (!hub) return { depAirport: null, arrAirport: null };

  const nearDXB = lat >= DXB_AREA.minLat && lat <= DXB_AREA.maxLat && lon >= DXB_AREA.minLon && lon <= DXB_AREA.maxLon;

  if (hub === "DXB") {
    return nearDXB ? { depAirport: "DXB", arrAirport: null } : { depAirport: "DXB", arrAirport: "EN ROUTE" };
  }
  if (nearDXB) return { depAirport: hub, arrAirport: "DXB" };
  return { depAirport: hub, arrAirport: null };
}

function resolveAirlineIata(callsign: string): string | null {
  const icaoPrefix = callsign.slice(0, 3).toUpperCase();
  return ICAO_TO_IATA[icaoPrefix] ?? null;
}

function resolveAircraftClass(callsign: string): AircraftClass {
  const prefix = callsign.slice(0, 3).toUpperCase();
  return UAE_CARRIERS.has(prefix) ? "ek" : "other";
}

const OPENSKY_TOKEN_URL =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function fetchOAuth2Token(): Promise<string | null> {
  const clientId = process.env.OPENSKY_USERNAME;
  const clientSecret = process.env.OPENSKY_PASSWORD;
  if (!clientId || !clientSecret) return null;

  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(OPENSKY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    console.warn(`[OpenSky] OAuth2 token request failed (${res.status}). Will use anonymous access.`);
    return null;
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // refresh 1 min early
  return cachedToken;
}

async function buildHeaders(): Promise<HeadersInit> {
  const token = await fetchOAuth2Token();
  if (token) {
    return { Authorization: `Bearer ${token}` };
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
    depAirport: resolveRoute(callsign, lat, lon).depAirport,
    arrAirport: resolveRoute(callsign, lat, lon).arrAirport,
    depTime: null,
    arrTime: null,
    flightStatus: null,
  };
}

export class OpenSkyCollector implements OpenSkyCollectorPort {
  // Query specific aircraft by icao24 addresses
  async refreshByIcao24(icao24s: string[]): Promise<CollectionResult<RawFlightPosition[]>> {
    if (icao24s.length === 0) return { data: [], collectedAt: new Date(), source: "opensky" };

    // OpenSky allows multiple icao24 params: ?icao24=aaa&icao24=bbb
    // Split into batches of 50 to avoid URL length limits
    const BATCH_SIZE = 50;
    const allFlights: RawFlightPosition[] = [];
    const headers = await buildHeaders();

    for (let i = 0; i < icao24s.length; i += BATCH_SIZE) {
      const batch = icao24s.slice(i, i + BATCH_SIZE);
      const params = batch.map((id) => `icao24=${id}`).join("&");
      const url = `https://opensky-network.org/api/states/all?${params}`;

      try {
        let response = await fetch(url, { headers });
        if (response.status === 401 || response.status === 403) {
          cachedToken = null;
          tokenExpiresAt = 0;
          response = await fetch(url);
        }
        if (response.status === 429) {
          console.warn("[OpenSky] Rate limited on refresh. Skipping batch.");
          continue;
        }
        if (!response.ok) continue;

        const body: OpenSkyResponse = await response.json();
        for (const state of body.states ?? []) {
          const parsed = parseState(state);
          if (parsed) allFlights.push(parsed);
        }
      } catch {
        // Skip failed batch
      }
    }

    return { data: allFlights, collectedAt: new Date(), source: "opensky" };
  }

  async collectFlights(): Promise<CollectionResult<RawFlightPosition[]>> {
    const headers = await buildHeaders();
    let response = await fetch(OPENSKY_API_URL, { headers });

    if (response.status === 401 || response.status === 403) {
      console.warn(`[OpenSky] Auth failed (${response.status}). Clearing token and retrying anonymously.`);
      cachedToken = null;
      tokenExpiresAt = 0;
      response = await fetch(OPENSKY_API_URL);
    }

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
