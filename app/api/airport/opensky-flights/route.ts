import { NextResponse, type NextRequest } from "next/server";

const OPENSKY_TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const DXB_ICAO = "OMDB";

const ICAO_TO_NAME: Record<string, string> = {
  EGLL: "London Heathrow", GMMT: "Tangier", EKCH: "Copenhagen", VIDP: "New Delhi",
  VAPO: "Pune", VABB: "Mumbai", OEJN: "Jeddah", OERK: "Riyadh", OTHH: "Doha",
  OMDB: "Dubai DXB", OMSJ: "Sharjah", OMAA: "Abu Dhabi", LTFM: "Istanbul",
  LFPG: "Paris CDG", EDDF: "Frankfurt", KJFK: "New York JFK", KSEA: "Seattle",
  SBGR: "São Paulo", FACT: "Cape Town", ZSPD: "Shanghai", LHBP: "Budapest",
  FVHA: "Harare", VTBS: "Bangkok", VVTS: "Ho Chi Minh", UDYZ: "Yerevan",
  LOWS: "Salzburg", RKSI: "Seoul Incheon", RJTT: "Tokyo Haneda", RJAA: "Tokyo Narita",
  WSSS: "Singapore", YSSY: "Sydney", CYYZ: "Toronto", UUEE: "Moscow DME",
};

interface OpenSkyFlight {
  icao24: string;
  firstSeen: number;
  estDepartureAirport: string | null;
  lastSeen: number;
  estArrivalAirport: string | null;
  callsign: string | null;
}

export async function GET(request: NextRequest) {
  const direction = request.nextUrl.searchParams.get("direction") ?? "arrival";

  try {
    const clientId = process.env.OPENSKY_USERNAME;
    const clientSecret = process.env.OPENSKY_PASSWORD;
    if (!clientId || !clientSecret) {
      return NextResponse.json({ data: [], count: 0 });
    }

    const tokenRes = await fetch(OPENSKY_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }).toString(),
    });
    if (!tokenRes.ok) return NextResponse.json({ data: [], count: 0 });
    const { access_token } = await tokenRes.json() as { access_token: string };

    const now = Math.floor(Date.now() / 1000);
    const begin = now - 43200; // 12 hours

    const endpoint = direction === "departure" ? "departure" : "arrival";
    const res = await fetch(
      `https://opensky-network.org/api/flights/${endpoint}?airport=${DXB_ICAO}&begin=${begin}&end=${now}`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );

    if (!res.ok) return NextResponse.json({ data: [], count: 0 });

    const flights = await res.json() as OpenSkyFlight[];

    const data = flights.map((f) => {
      const dep = f.estDepartureAirport;
      const arr = f.estArrivalAirport;
      const origin = direction === "arrival" ? dep : arr;
      const depTime = new Date(f.firstSeen * 1000);
      const arrTime = new Date(f.lastSeen * 1000);

      return {
        flightCode: (f.callsign ?? "").trim(),
        origin: origin ?? "Unknown",
        originName: ICAO_TO_NAME[origin ?? ""] ?? origin ?? "Unknown",
        depAirport: dep,
        arrAirport: arr,
        depTime: depTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" }),
        arrTime: arrTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" }),
        status: f.lastSeen > now - 1800 ? "In Flight" : "Landed",
      };
    });

    return NextResponse.json({ data, count: data.length });
  } catch (error) {
    console.error("[opensky-flights API]", error);
    return NextResponse.json({ data: [], count: 0 });
  }
}
