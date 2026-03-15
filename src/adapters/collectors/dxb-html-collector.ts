import type { PrismaClient } from "../../generated/prisma/client";
import { randomUUID } from "crypto";

interface ParsedFlight {
  flightCode: string;
  airline: string;
  destination: string;
  scheduled: string;
  actual: string;
  terminal: string;
  gate: string;
  status: string;
}

const AIRLINE_MAP: Record<string, string> = {
  EK: "Emirates", FZ: "flydubai", EY: "Etihad", QR: "Qatar Airways",
  SV: "Saudia", G9: "Air Arabia", IX: "Air India Express", AI: "Air India",
  "6E": "IndiGo", SG: "SpiceJet", PK: "PIA", BS: "US-Bangla",
  HY: "Uzbekistan Airways", C6: "My Freighter", WY: "Oman Air",
  MS: "EgyptAir", RJ: "Royal Jordanian", TK: "Turkish Airlines",
  LH: "Lufthansa", BA: "British Airways", KE: "Korean Air",
  QF: "Qantas", AC: "Air Canada", UA: "United", PA: "AirBlue",
  MK: "Air Mauritius", T8: "Rotana Jet",
};

const STATUS_KEYWORDS = [
  "Arrived early", "Delayed", "Cancelled", "Gate Closed", "Final Call",
  "Boarding", "Departed", "Landed", "Arrived", "On Time", "New Time",
  "New time", "In Flight", "Scheduled",
];

function normalizeStatus(raw: string): string {
  if (raw.includes("Arrived early")) return "Landed";
  if (raw.includes("Arrived")) return "Landed";
  if (raw.includes("New time") || raw.includes("New Time")) return "New Time";
  for (const kw of STATUS_KEYWORDS) {
    if (raw.includes(kw)) return kw;
  }
  return "Scheduled";
}

/**
 * Parse flights from dubaiairports.ae HTML.
 * Actual structure (2026-03):
 * <a href="/flight-details?Id=...&type=departure" class="flight ...">
 *   <div role="row">
 *     <span col-start-1 role="cell"><span>15:40</span></span>   ← scheduled
 *     <span col-start-2 role="cell">15:40</span>                ← actual
 *     <span col-start-3 role="cell">
 *       Mumbai (BOM)
 *       <span>EK 508</span>                                     ← destination + flight code in same cell
 *     </span>
 *     <span col-start-4><img alt="Emirates" /></span>            ← airline logo
 *     <span col-start-5>T3</span>                                ← terminal
 *     ...
 *     <span>Gate Closed</span>                                   ← status
 *   </div>
 * </a>
 */
function parseFlightsFromHtml(html: string, direction: "departure" | "arrival"): ParsedFlight[] {
  const flights: ParsedFlight[] = [];

  // Match each flight link block
  const pattern = new RegExp(
    `<a[^>]+href="/flight-details\\?[^"]*type=${direction}"[^>]*>([\\s\\S]*?)<\\/a>`,
    "gi",
  );

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const block = match[1];

    // Strip all HTML tags to get plain text, then split by whitespace
    const plainText = block.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    // Extract fields using regex on the full block HTML

    // Times: HH:MM pattern
    const times = plainText.match(/\b\d{2}:\d{2}\b/g) ?? [];

    // Destination: "City Name (CODE)" — from col-start-3 cell
    const col3Match = block.match(/col-start-3[^>]*>([\s\S]*?)<\/span>\s*<span/i);
    let destination = "";
    if (col3Match) {
      // Get text before the nested <span> (which contains flight code)
      const col3Text = col3Match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const destMatch = col3Text.match(/([A-Za-z\s.'-]+\([A-Z]{3}\))/);
      destination = destMatch ? destMatch[1].trim() : "";
    }
    // Fallback: search entire block
    if (!destination) {
      const destFallback = plainText.match(/([A-Za-z\s.'-]+\([A-Z]{3}\))/);
      destination = destFallback ? destFallback[1].trim() : "";
    }

    // Flight code: "EK 508", "FZ 376", "6E 1463" — must have at least one letter
    const codeMatch = plainText.match(/\b([A-Z][A-Z0-9]\s\d{1,4}|[0-9][A-Z]\s\d{1,4})\b/);
    const flightCode = codeMatch ? codeMatch[1] : "";
    if (!flightCode) continue;

    // Airline: from img alt
    const imgAlt = block.match(/<img[^>]+alt="([^"]+)"/i);
    const prefix = flightCode.split(" ")[0];
    const airline = imgAlt ? imgAlt[1].trim() : (AIRLINE_MAP[prefix] || prefix);

    // Terminal: T1/T2/T3
    const termMatch = plainText.match(/\bT[123]\b/);
    const terminal = termMatch ? termMatch[0] : "";

    // Gate: alphanumeric like A13, B15, F8, or just number for carousel
    const gateMatch = block.match(/col-start-[67][^>]*>[\s\S]*?([A-Z]\d{1,2}|\d{1,2})[\s\S]*?<\/span>/i);
    const gate = gateMatch ? gateMatch[1].trim() : "";

    // Status: last significant text
    const status = normalizeStatus(plainText);

    flights.push({
      flightCode,
      airline,
      destination,
      scheduled: times[0] ?? "",
      actual: times[1] ?? times[0] ?? "",
      terminal,
      gate,
      status,
    });
  }

  return flights;
}

export async function collectDxbHtmlFlights(prisma: PrismaClient): Promise<{ departures: number; arrivals: number }> {
  const today = new Date().toISOString().split("T")[0];
  const headers = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" };

  let depCount = 0;
  let arrCount = 0;
  const batchTime = new Date();

  try {
    // Fetch departures
    const depRes = await fetch(`https://dubaiairports.ae/flight-status?type=departures&from=${today}`, { headers });
    if (depRes.ok) {
      const depHtml = await depRes.text();
      const depFlights = parseFlightsFromHtml(depHtml, "departure");
      if (depFlights.length > 0) {
        await prisma.$transaction(
          depFlights.map((f) =>
            prisma.dxbFlightStatus.create({
              data: {
                id: randomUUID(),
                flightCode: f.flightCode,
                airline: f.airline,
                destination: f.destination,
                scheduled: f.scheduled,
                actual: f.actual,
                terminal: f.terminal,
                gate: f.gate,
                status: f.status,
                direction: "departure",
                collectedAt: batchTime,
              },
            }),
          ),
        );
        depCount = depFlights.length;
      }
    }

    // Fetch arrivals
    const arrRes = await fetch(`https://dubaiairports.ae/flight-status?type=arrivals&from=${today}`, { headers });
    if (arrRes.ok) {
      const arrHtml = await arrRes.text();
      const arrFlights = parseFlightsFromHtml(arrHtml, "arrival");
      if (arrFlights.length > 0) {
        await prisma.$transaction(
          arrFlights.map((f) =>
            prisma.dxbFlightStatus.create({
              data: {
                id: randomUUID(),
                flightCode: f.flightCode,
                airline: f.airline,
                destination: f.destination,
                scheduled: f.scheduled,
                actual: f.actual,
                terminal: f.terminal,
                gate: f.gate,
                status: f.status,
                direction: "arrival",
                collectedAt: batchTime,
              },
            }),
          ),
        );
        arrCount = arrFlights.length;
      }
    }
  } catch (error) {
    console.warn("[DXB HTML] Scrape failed:", error instanceof Error ? error.message : error);
  }

  return { departures: depCount, arrivals: arrCount };
}
