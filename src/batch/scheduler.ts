import cron from "node-cron";
import { prisma } from "../infrastructure/prisma";
import { collectNews } from "../usecases/collect-news";
import { collectMarket } from "../usecases/collect-market";
import { collectGeoEvents } from "../usecases/collect-geo-events";
import { GdeltCollector } from "../adapters/collectors/gdelt-collector";
import { RssCollector } from "../adapters/collectors/rss-collector";
import { GdeltGeoCollector } from "../adapters/collectors/gdelt-geo-collector";
import { MarketCollector } from "../adapters/collectors/market-collector";
import { NewsRepository } from "../adapters/repositories/news-repository";
import { MarketRepository } from "../adapters/repositories/market-repository";
import { GeoRepository } from "../adapters/repositories/geo-repository";

const newsRepo = new NewsRepository(prisma);
const marketRepo = new MarketRepository(prisma);
const geoRepo = new GeoRepository(prisma);

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

// ─── Schedule ──────────────────────────────────────────────────

// News: GDELT + RSS every 15 minutes
cron.schedule("*/15 * * * *", runCollectNews);

// Market data: Yahoo Finance every 15 minutes
cron.schedule("*/15 * * * *", runCollectMarket);

// Geopolitics: GDELT events every 30 minutes
cron.schedule("*/30 * * * *", runCollectGeoEvents);

// ─── Startup ───────────────────────────────────────────────────

console.log(`[${new Date().toISOString()}] Batch scheduler started`);
console.log("Schedules:");
console.log("  */15 * * * *  News collection (GDELT + RSS)");
console.log("  */15 * * * *  Market data (Yahoo Finance)");
console.log("  */30 * * * *  Geopolitics events (GDELT)");

// Run initial collection on startup
runCollectNews();
runCollectMarket();
runCollectGeoEvents();
