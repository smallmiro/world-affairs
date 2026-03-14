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

async function scrapeSkyscanner(direction: "departure" | "arrival"): Promise<ScrapedFlight[]> {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      locale: "en-US",
    });
    const page = await context.newPage();

    const url = "https://www.skyscanner.co.kr/flights/arrivals-departures/dxb/dubai-arrivals-departures";
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(3000);

    // Click the correct tab
    if (direction === "departure") {
      const depTab = await page.$('button:has-text("Departures"), a:has-text("Departures"), [data-testid*="departure"]');
      if (depTab) await depTab.click();
      await page.waitForTimeout(2000);
    }

    // Scroll to load more
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      const showMore = await page.$('button:has-text("more"), button:has-text("더 보기"), button:has-text("Show more")');
      if (showMore) {
        await showMore.click();
        await page.waitForTimeout(1500);
      }
    }

    // Extract flight data from page
    const flights = await page.evaluate((dir: string) => {
      const results: {
        flightCode: string; airline: string; destination: string;
        scheduled: string; actual: string; terminal: string;
        gate: string; status: string; direction: string;
      }[] = [];

      // Try multiple selectors
      const selectors = [
        "table tbody tr",
        "[class*='FlightRow']", "[class*='flight-row']",
        "[class*='FlightInfo']", "[data-testid*='flight']",
        "li[class*='flight']",
      ];

      let rows: Element[] = [];
      for (const sel of selectors) {
        const found = document.querySelectorAll(sel);
        if (found.length > 0) { rows = Array.from(found); break; }
      }

      if (rows.length === 0) {
        // Fallback: extract from page text
        const allText = document.body.innerText;
        const lines = allText.split("\n").filter(Boolean);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          const flightMatch = line.match(/^([A-Z0-9]{2}\s?\d{2,4})/);
          if (flightMatch) {
            const timesInContext = lines.slice(i, i + 5).join(" ");
            const times = timesInContext.match(/\d{1,2}:\d{2}/g) || [];
            results.push({
              flightCode: flightMatch[1],
              airline: "",
              destination: lines[i + 1]?.trim() || "",
              scheduled: times[0] || "",
              actual: times[1] || times[0] || "",
              terminal: "", gate: "",
              status: "Scheduled",
              direction: dir,
            });
          }
        }
        return results;
      }

      for (const row of rows) {
        const texts = Array.from(row.querySelectorAll("td, span, div"))
          .map((c) => (c as HTMLElement).innerText?.trim())
          .filter((t) => t && t.length > 0 && t.length < 100);

        if (texts.length >= 3) {
          const flightMatch = texts[0]?.match(/^[A-Z0-9]{2}\s?\d{1,4}/);
          if (flightMatch) {
            results.push({
              flightCode: flightMatch[0],
              airline: texts[1] || "",
              destination: texts.find((t) => !t.match(/^\d{1,2}:\d{2}/) && t.length > 2 && t !== flightMatch[0]) || "",
              scheduled: texts.find((t) => t.match(/^\d{1,2}:\d{2}/)) || "",
              actual: (texts.filter((t) => t.match(/^\d{1,2}:\d{2}/))[1]) || texts.find((t) => t.match(/^\d{1,2}:\d{2}/)) || "",
              terminal: texts.find((t) => t.match(/^T\d/)) || "",
              gate: "",
              status: texts.find((t) => ["On Time", "Delayed", "Cancelled", "Landed", "Departed", "Scheduled", "En Route"].some((s) => t.includes(s))) || "Scheduled",
              direction: dir,
            });
          }
        }
      }
      return results;
    }, direction);

    return flights as ScrapedFlight[];
  } catch (error) {
    console.warn("[Skyscanner]", direction, "scrape failed:", error instanceof Error ? error.message : error);
    return [];
  } finally {
    await browser?.close();
  }
}

export async function collectSkyscannerFlights(prisma: PrismaClient): Promise<{ departures: number; arrivals: number }> {
  const [arrivals, departures] = await Promise.all([
    scrapeSkyscanner("arrival"),
    scrapeSkyscanner("departure"),
  ]);

  const all = [...arrivals, ...departures];
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
