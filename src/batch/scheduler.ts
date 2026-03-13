import cron from "node-cron";
import { prisma } from "../infrastructure/prisma";
import { collectNews } from "../usecases/collect-news";
import { collectMarket } from "../usecases/collect-market";
import { collectGeoEvents } from "../usecases/collect-geo-events";
import { collectAirportFlights, collectAirportOps, collectAirportEvents } from "../usecases/collect-airport";
import { GdeltCollector } from "../adapters/collectors/gdelt-collector";
import { RssCollector } from "../adapters/collectors/rss-collector";
import { GdeltGeoCollector } from "../adapters/collectors/gdelt-geo-collector";
import { MarketCollector } from "../adapters/collectors/market-collector";
import { OpenSkyCollector } from "../adapters/collectors/opensky-collector";
import { AviationStackCollector } from "../adapters/collectors/aviationstack-collector";
import { GdeltAirportEventCollector } from "../adapters/collectors/airport-event-collector";
import { NewsRepository } from "../adapters/repositories/news-repository";
import { MarketRepository } from "../adapters/repositories/market-repository";
import { GeoRepository } from "../adapters/repositories/geo-repository";
import { AirportRepository } from "../adapters/repositories/airport-repository";

const newsRepo = new NewsRepository(prisma);
const marketRepo = new MarketRepository(prisma);
const geoRepo = new GeoRepository(prisma);
const airportRepo = new AirportRepository(prisma);

async function runCollectNews() {
  const label = "collect-news";
  console.log(`[${new Date().toISOString()}] ${label}: starting`);
  try {
    const gdelt = new GdeltCollector();
    const rss = new RssCollector();
    const result = await collectNews([gdelt, rss], newsRepo);
    console.log(
      `[${new Date().toISOString()}] ${label}: total=${result.total} saved=${result.saved} skipped=${result.skipped}`,
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${label}: error`, error);
  }
}

async function runCollectMarket() {
  const label = "collect-market";
  console.log(`[${new Date().toISOString()}] ${label}: starting`);
  try {
    const collector = new MarketCollector();
    const result = await collectMarket(collector, marketRepo);
    console.log(
      `[${new Date().toISOString()}] ${label}: total=${result.total} saved=${result.saved}`,
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${label}: error`, error);
  }
}

async function runCollectGeoEvents() {
  const label = "collect-geo";
  console.log(`[${new Date().toISOString()}] ${label}: starting`);
  try {
    const gdeltGeo = new GdeltGeoCollector();
    const result = await collectGeoEvents([gdeltGeo], geoRepo);
    console.log(
      `[${new Date().toISOString()}] ${label}: total=${result.total} saved=${result.saved} skipped=${result.skipped}`,
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${label}: error`, error);
  }
}

// ─── Airport Jobs ─────────────────────────────────────────────

async function runCollectAirportFlights() {
  const label = "airport:flights";
  console.log(`[${new Date().toISOString()}] ${label}: starting`);
  try {
    const collector = new OpenSkyCollector();
    const result = await collectAirportFlights(collector, airportRepo);
    console.log(
      `[${new Date().toISOString()}] ${label}: total=${result.total} saved=${result.saved}`,
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${label}: error`, error);
  }
}

async function runCollectAirportOps() {
  const label = "airport:ops";
  console.log(`[${new Date().toISOString()}] ${label}: starting`);
  try {
    const collector = new AviationStackCollector();
    const result = await collectAirportOps(collector, airportRepo);
    console.log(
      `[${new Date().toISOString()}] ${label}: total=${result.total} saved=${result.saved}`,
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${label}: error`, error);
  }
}

async function runCollectAirportEvents() {
  const label = "airport:events";
  console.log(`[${new Date().toISOString()}] ${label}: starting`);
  try {
    const collector = new GdeltAirportEventCollector();
    const result = await collectAirportEvents(collector, airportRepo);
    console.log(
      `[${new Date().toISOString()}] ${label}: total=${result.total} saved=${result.saved} skipped=${result.skipped}`,
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${label}: error`, error);
  }
}

async function runAirportCleanup() {
  const label = "airport:cleanup";
  console.log(`[${new Date().toISOString()}] ${label}: starting`);
  try {
    const deleted = await airportRepo.deleteOlderThan(7);
    console.log(
      `[${new Date().toISOString()}] ${label}: deleted=${deleted}`,
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${label}: error`, error);
  }
}

// ─── Schedule ──────────────────────────────────────────────────

// News: GDELT + RSS every 15 minutes
cron.schedule("*/15 * * * *", runCollectNews);

// Market data: Yahoo Finance every 15 minutes
cron.schedule("*/15 * * * *", runCollectMarket);

// Geopolitics: GDELT events every 30 minutes
cron.schedule("*/30 * * * *", runCollectGeoEvents);

// Airport: flights every hour
cron.schedule("0 * * * *", runCollectAirportFlights);

// Airport: ops twice daily (06:00, 18:00)
cron.schedule("0 6,18 * * *", runCollectAirportOps);

// Airport: events every 4 hours
cron.schedule("0 */4 * * *", runCollectAirportEvents);

// Airport: cleanup daily at 03:00
cron.schedule("0 3 * * *", runAirportCleanup);

// ─── Startup ───────────────────────────────────────────────────

console.log(`[${new Date().toISOString()}] Batch scheduler started`);
console.log("Schedules:");
console.log("  */15 * * * *  News collection (GDELT + RSS)");
console.log("  */15 * * * *  Market data (Yahoo Finance)");
console.log("  */30 * * * *  Geopolitics events (GDELT)");
console.log("  0 * * * *     Airport flights (OpenSky)");
console.log("  0 6,18 * * *  Airport ops (AviationStack)");
console.log("  0 */4 * * *   Airport events (GDELT)");
console.log("  0 3 * * *     Airport cleanup (7-day retention)");

// Run initial collection on startup
runCollectNews();
runCollectMarket();
runCollectGeoEvents();
runCollectAirportFlights();
runCollectAirportEvents();
