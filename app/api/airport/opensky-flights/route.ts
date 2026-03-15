import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../src/infrastructure/prisma";

const DXB_CODES = ["DXB", "OMDB"];

const IATA_TO_NAME: Record<string, string> = {
  LHR: "London Heathrow", CDG: "Paris CDG", FRA: "Frankfurt", AMS: "Amsterdam",
  IST: "Istanbul", FCO: "Rome", BCN: "Barcelona", MUC: "Munich", ZRH: "Zurich",
  ICN: "Seoul Incheon", NRT: "Tokyo Narita", HND: "Tokyo Haneda", SIN: "Singapore",
  BKK: "Bangkok", KUL: "Kuala Lumpur", HKG: "Hong Kong", PVG: "Shanghai",
  DEL: "New Delhi", BOM: "Mumbai", SYD: "Sydney", MEL: "Melbourne",
  JFK: "New York JFK", LAX: "Los Angeles", ORD: "Chicago", SFO: "San Francisco",
  YYZ: "Toronto", GRU: "São Paulo", EZE: "Buenos Aires",
  DOH: "Doha", JED: "Jeddah", RUH: "Riyadh", BAH: "Bahrain", KWI: "Kuwait",
  MCT: "Muscat", AMM: "Amman", BEY: "Beirut", CAI: "Cairo", IKA: "Tehran",
  DXB: "Dubai", AUH: "Abu Dhabi", SHJ: "Sharjah",
  CPT: "Cape Town", NBO: "Nairobi", ADD: "Addis Ababa",
};

const ICAO_TO_NAME: Record<string, string> = {
  EGLL: "London Heathrow", LFPG: "Paris CDG", EDDF: "Frankfurt",
  EHAM: "Amsterdam", LTFM: "Istanbul", LIRF: "Rome", LEBL: "Barcelona",
  EDDM: "Munich", LSZH: "Zurich",
  RKSI: "Seoul Incheon", RJAA: "Tokyo Narita", RJTT: "Tokyo Haneda",
  WSSS: "Singapore", VTBS: "Bangkok", WMKK: "Kuala Lumpur",
  VHHH: "Hong Kong", ZSPD: "Shanghai", VIDP: "New Delhi", VABB: "Mumbai",
  YSSY: "Sydney", YMML: "Melbourne",
  KJFK: "New York JFK", KLAX: "Los Angeles", KORD: "Chicago", KSFO: "San Francisco",
  CYYZ: "Toronto", SBGR: "São Paulo",
  OTHH: "Doha", OEJN: "Jeddah", OERK: "Riyadh", OBKH: "Bahrain",
  OKBK: "Kuwait", OOMS: "Muscat", OJAI: "Amman", OLBA: "Beirut",
  HECA: "Cairo", OIIE: "Tehran",
  OMDB: "Dubai", OMAA: "Abu Dhabi", OMSJ: "Sharjah",
  FACT: "Cape Town", HKJK: "Nairobi", HAAB: "Addis Ababa",
  FVHA: "Harare", UDYZ: "Yerevan", LOWS: "Salzburg", LHBP: "Budapest",
  UUEE: "Moscow DME", VVTS: "Ho Chi Minh",
};

function resolveAirportName(code: string | null): string {
  if (!code) return "Unknown";
  return IATA_TO_NAME[code] ?? ICAO_TO_NAME[code] ?? code;
}

export async function GET(request: NextRequest) {
  const direction = request.nextUrl.searchParams.get("direction") ?? "arrival";

  try {
    const isDeparture = direction === "departure";

    // Read from DB (batch-collected FlightPosition data)
    // Departures: depAirport is DXB/OMDB
    // Arrivals: arrAirport is DXB/OMDB, OR non-DXB-hub carriers in the area (depAirport set, not DXB)
    const flights = await prisma.flightPosition.findMany({
      where: {
        onGround: false,
        ...(isDeparture
          ? { depAirport: { in: DXB_CODES } }
          : {
              OR: [
                { arrAirport: { in: DXB_CODES } },
                {
                  depAirport: { notIn: [...DXB_CODES, "EN ROUTE"] },
                  arrAirport: { not: null },
                },
                {
                  depAirport: { notIn: [...DXB_CODES, "EN ROUTE", ""] },
                  arrAirport: null,
                },
              ],
            }),
      },
      orderBy: { collectedAt: "desc" },
      take: 100,
    });

    const data = flights.map((f) => {
      const counterpart = isDeparture
        ? (f.arrAirport === "EN ROUTE" ? null : f.arrAirport)
        : f.depAirport;

      return {
        flightCode: f.callsign?.trim() || f.icao24,
        origin: counterpart ?? "EN ROUTE",
        originName: resolveAirportName(counterpart),
        depTime: f.depTime ?? "—",
        arrTime: f.arrTime ?? "—",
        status: "In Flight",
      };
    });

    return NextResponse.json({ data, count: data.length });
  } catch (error) {
    console.error("[opensky-flights API]", error);
    return NextResponse.json({ data: [], count: 0 });
  }
}
