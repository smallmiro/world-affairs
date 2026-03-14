import { chromium } from "playwright";
import type { PrismaClient } from "../../generated/prisma/client";
import { randomUUID } from "crypto";

interface ScrapedFlight {
  flightCode: string;
  airline: string;
  destination: string;
  scheduled: string;
  actual: string;
  terminal: string;
  gate: string;
  status: string;
  direction: "departure" | "arrival";
}

async function scrapeDxbFlights(direction: "departure" | "arrival"): Promise<ScrapedFlight[]> {
  const today = new Date().toISOString().split("T")[0];
  const type = direction === "departure" ? "departures" : "arrivals";
  const url = `https://dubaiairports.ae/flight-status?type=${type}&from=${today}`;

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    // Wait for flight table to load
    await page.waitForSelector("table, .flight-row, [class*=flight]", { timeout: 10000 }).catch(() => {});

    // Try to extract from table rows
    const flights = await page.evaluate((dir) => {
      const results: {
        flightCode: string; airline: string; destination: string;
        scheduled: string; actual: string; terminal: string;
        gate: string; status: string; direction: string;
      }[] = [];

      // Try multiple selectors for the flight data
      const rows = document.querySelectorAll("table tbody tr, [class*='flight-row'], [class*='FlightRow']");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td, [class*='cell'], span");
        if (cells.length >= 4) {
          const texts = Array.from(cells).map((c) => c.textContent?.trim() ?? "");
          results.push({
            flightCode: texts[0] || "",
            destination: texts[1] || "",
            scheduled: texts[2] || "",
            actual: texts[3] || "",
            airline: texts[4] || "",
            terminal: texts[5] || "",
            gate: texts[6] || "",
            status: texts[7] || texts[texts.length - 1] || "",
            direction: dir,
          });
        }
      });

      return results;
    }, direction);

    return flights.filter((f) => f.flightCode).map((f) => ({ ...f, direction } as ScrapedFlight));
  } catch (error) {
    console.warn(`[DXB Scraper] ${direction} failed:`, error instanceof Error ? error.message : error);
    return [];
  } finally {
    await browser?.close();
  }
}

export async function collectDxbFlightStatus(prisma: PrismaClient): Promise<{ departures: number; arrivals: number }> {
  const [departures, arrivals] = await Promise.all([
    scrapeDxbFlights("departure"),
    scrapeDxbFlights("arrival"),
  ]);

  const all = [...departures, ...arrivals];
  if (all.length > 0) {
    await prisma.$transaction(
      all.map((f) =>
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
            direction: f.direction,
          },
        }),
      ),
    );
  }

  return { departures: departures.length, arrivals: arrivals.length };
}
