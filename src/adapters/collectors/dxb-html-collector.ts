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

function parseFlightsFromHtml(html: string): ParsedFlight[] {
  const flights: ParsedFlight[] = [];

  // Match flight blocks — each flight is in a grid row with role="row"
  const rowPattern = /role="row"[\s\S]*?(?=role="row"|$)/g;
  const rows = html.match(rowPattern) || [];

  for (const row of rows) {
    // Extract flight code: pattern like "EK 328" or "FZ 1449"
    const flightMatch = row.match(/([A-Z0-9]{2}\s\d{2,4})\s*<\/span>/);
    if (!flightMatch) continue;

    const flightCode = flightMatch[1].trim();

    // Extract destination/origin: pattern like "Shenzhen (SZX)"
    const destMatch = row.match(/col-start-3[^>]*>[^<]*?([A-Za-z\s]+\([A-Z]{3}\))/);
    const destination = destMatch ? destMatch[1].trim() : "";

    // Extract scheduled time: pattern like "13:30"
    const times = row.match(/\d{2}:\d{2}/g) || [];
    const scheduled = times[0] || "";
    const actual = times[1] || times[0] || "";

    // Extract terminal: "T1", "T2", "T3"
    const termMatch = row.match(/T[123]/);
    const terminal = termMatch ? termMatch[0] : "";

    // Extract gate: pattern like gate/carousel info
    const gateMatch = row.match(/(?:Gate|gate|carousel)\s*[:\s]*([A-Z]?\d+)/i);
    const gate = gateMatch ? gateMatch[1] : "";

    // Extract status
    let status = "Scheduled";
    if (row.includes("Delayed")) status = "Delayed";
    else if (row.includes("Cancelled")) status = "Cancelled";
    else if (row.includes("Gate Closed")) status = "Gate Closed";
    else if (row.includes("Final Call")) status = "Final Call";
    else if (row.includes("Boarding")) status = "Boarding";
    else if (row.includes("Departed")) status = "Departed";
    else if (row.includes("Landed") || row.includes("Arrived")) status = "Landed";
    else if (row.includes("On Time")) status = "On Time";
    else if (row.includes("New Time") || row.includes("New time")) status = "New Time";

    // Determine airline from flight code prefix
    const prefix = flightCode.split(" ")[0];
    const airlineMap: Record<string, string> = {
      EK: "Emirates", FZ: "flydubai", EY: "Etihad", QR: "Qatar Airways",
      SV: "Saudia", G9: "Air Arabia", IX: "Air India Express", AI: "Air India",
      "6E": "IndiGo", SG: "SpiceJet", PK: "PIA", BS: "US-Bangla",
      HY: "Uzbekistan Airways", C6: "My Freighter", WY: "Oman Air",
    };
    const airline = airlineMap[prefix] || prefix;

    flights.push({ flightCode, airline, destination, scheduled, actual, terminal, gate, status });
  }

  return flights;
}

export async function collectDxbHtmlFlights(prisma: PrismaClient): Promise<{ departures: number; arrivals: number }> {
  const today = new Date().toISOString().split("T")[0];
  const headers = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" };

  let depCount = 0;
  let arrCount = 0;

  try {
    // Fetch departures
    const depRes = await fetch(`https://dubaiairports.ae/flight-status?type=departures&from=${today}`, { headers });
    if (depRes.ok) {
      const depHtml = await depRes.text();
      const depFlights = parseFlightsFromHtml(depHtml);
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
      const arrFlights = parseFlightsFromHtml(arrHtml);
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
