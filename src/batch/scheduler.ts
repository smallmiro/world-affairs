import "dotenv/config";
import cron from "node-cron";
import { prisma } from "../infrastructure/prisma";
import { collectNews } from "../usecases/collect-news";
import { collectMarket } from "../usecases/collect-market";
import { collectGeoEvents } from "../usecases/collect-geo-events";
import { collectAirportFlights, collectAirportOps, collectAirportEvents } from "../usecases/collect-airport";
import { translateUntranslatedArticles } from "../usecases/translate-articles";
import { translateUntranslatedGeoEvents } from "../usecases/translate-geo-events";
import { translateUntranslatedAirportEvents } from "../usecases/translate-airport-events";
import { analyzeRecentNews, generateDailyBriefing } from "../usecases/analyze-news";
import { GeminiAnalyzer } from "../adapters/ai/gemini-analyzer";
import { AnalysisRepository } from "../adapters/repositories/analysis-repository";
import { GeminiTranslator } from "../adapters/ai/gemini-translator";
import { GdeltCollector } from "../adapters/collectors/gdelt-collector";
import { RssCollector } from "../adapters/collectors/rss-collector";
import { GdeltGeoCollector } from "../adapters/collectors/gdelt-geo-collector";
import { MarketCollector } from "../adapters/collectors/market-collector";
import { OpenSkyCollector } from "../adapters/collectors/opensky-collector";
import { AviationStackCollector } from "../adapters/collectors/aviationstack-collector";
import { GdeltAirportEventCollector } from "../adapters/collectors/airport-event-collector";
import { AisStreamCollector } from "../adapters/collectors/ais-collector";
import { processVesselMessage } from "../usecases/process-vessel";
import { collectDxbFlightStatus } from "../adapters/collectors/dxb-flight-collector";
import { publishToSSE } from "../infrastructure/publish-sse";
import { NewsRepository } from "../adapters/repositories/news-repository";
import { MarketRepository } from "../adapters/repositories/market-repository";
import { GeoRepository } from "../adapters/repositories/geo-repository";
import { AirportRepository } from "../adapters/repositories/airport-repository";
import { VesselRepository } from "../adapters/repositories/vessel-repository";

const newsRepo = new NewsRepository(prisma);
const marketRepo = new MarketRepository(prisma);
const geoRepo = new GeoRepository(prisma);
const airportRepo = new AirportRepository(prisma);
const vesselRepo = new VesselRepository(prisma);
const analysisRepo = new AnalysisRepository(prisma);
let analyzer: GeminiAnalyzer | null = null;
try { analyzer = new GeminiAnalyzer(); } catch { console.warn("[analyze] GEMINI_API_KEY not set."); }

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
    if (result.saved > 0) {
      const flights = await airportRepo.findLatestFlights(100);
      publishToSSE("flights", flights.map((f) => ({
        icao24: f.icao24, callsign: f.callsign, lat: f.lat, lon: f.lon,
        altitude: f.altitude, speed: f.speed, heading: f.heading,
        onGround: f.onGround, aircraftClass: f.aircraftClass,
      })));
    }
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

// ─── Translation Jobs ─────────────────────────────────────────

let translator: GeminiTranslator | null = null;
try {
  translator = new GeminiTranslator();
} catch {
  console.warn("[translate] GEMINI_API_KEY not set. Translation jobs will be skipped.");
}

async function runTranslateNews() {
  const label = "translate:news";
  console.log(`[${new Date().toISOString()}] ${label}: starting`);
  try {
    if (!translator) return;
    const count = await translateUntranslatedArticles(newsRepo, translator);
    console.log(`[${new Date().toISOString()}] ${label}: translated=${count}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${label}: error`, error);
  }
}

async function runTranslateGeoEvents() {
  const label = "translate:geo";
  console.log(`[${new Date().toISOString()}] ${label}: starting`);
  try {
    if (!translator) return;
    const count = await translateUntranslatedGeoEvents(geoRepo, translator);
    console.log(`[${new Date().toISOString()}] ${label}: translated=${count}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${label}: error`, error);
  }
}

async function runTranslateAirportEvents() {
  const label = "translate:airport";
  console.log(`[${new Date().toISOString()}] ${label}: starting`);
  try {
    if (!translator) return;
    const count = await translateUntranslatedAirportEvents(airportRepo, translator);
    console.log(`[${new Date().toISOString()}] ${label}: translated=${count}`);
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

// ─── AI Analysis Jobs ────────────────────────────────────────

async function runAnalyzeNews() {
  const label = "analyze:news";
  console.log(`[${new Date().toISOString()}] ${label}: starting`);
  try {
    if (!analyzer) return;
    const result = await analyzeRecentNews(newsRepo, analyzer, analysisRepo);
    console.log(`[${new Date().toISOString()}] ${label}: summarized=${result.summarized} sentiment=${result.sentimentAnalyzed}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${label}: error`, error);
  }
}

async function runGenerateBriefing() {
  const label = "analyze:briefing";
  console.log(`[${new Date().toISOString()}] ${label}: starting`);
  try {
    if (!analyzer) return;
    const briefing = await generateDailyBriefing(newsRepo, analyzer, analysisRepo);
    console.log(`[${new Date().toISOString()}] ${label}: generated (model=${briefing.model})`);
    // Translate briefing
    if (translator) {
      const translated = await translator.translate(briefing.result.en, "en", ["en", "ko", "ja"]);
      await prisma.aiAnalysis.update({ where: { id: briefing.id }, data: { resultKo: translated.ko, resultJa: translated.ja } });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${label}: error`, error);
  }
}

// ─── Global Cleanup ─────────────────────────────────────────

async function runGlobalCleanup() {
  const label = "cleanup:global";
  console.log(`[${new Date().toISOString()}] ${label}: starting`);
  try {
    const cutoff30d = new Date();
    cutoff30d.setDate(cutoff30d.getDate() - 30);
    const results = await prisma.$transaction([
      prisma.article.deleteMany({ where: { collectedAt: { lt: cutoff30d } } }),
      prisma.marketSnapshot.deleteMany({ where: { timestamp: { lt: cutoff30d } } }),
      prisma.geoEvent.deleteMany({ where: { collectedAt: { lt: cutoff30d } } }),
      prisma.vesselPosition.deleteMany({ where: { timestamp: { lt: cutoff30d } } }),
      prisma.aiAnalysis.deleteMany({ where: { createdAt: { lt: cutoff30d } } }),
    ]);
    const total = results.reduce((sum, r) => sum + r.count, 0);
    console.log(`[${new Date().toISOString()}] ${label}: deleted=${total} (30-day retention)`);
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

// Airport: flights — 07:00~23:00 every 2 min, otherwise every hour
const FLIGHT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
setInterval(() => {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 23) {
    runCollectAirportFlights();
  }
}, FLIGHT_INTERVAL_MS);
// Off-peak: every hour (runs at :00, skipped during 07-22 by the function itself is not needed — cron handles off-peak)
cron.schedule("0 0,1,2,3,4,5,6,23 * * *", runCollectAirportFlights);

// Airport: ops twice daily (06:00, 18:00)
cron.schedule("0 6,18 * * *", runCollectAirportOps);

// Airport: GDELT events disabled — timeline uses dubaiairports.ae data only
// cron.schedule("0 */4 * * *", runCollectAirportEvents);

// Airport: cleanup daily at 03:00
cron.schedule("0 3 * * *", runAirportCleanup);

// DXB Flight Status: scrape every 10 minutes
cron.schedule("*/10 * * * *", runCollectDxbFlights);

// Translation: run after each collection cycle (5 min offset to allow collection to finish)
cron.schedule("5,20,35,50 * * * *", runTranslateNews);
cron.schedule("5,35 * * * *", runTranslateGeoEvents);
// Airport event translation disabled — GDELT airport events collection is disabled
// cron.schedule("5 */4 * * *", runTranslateAirportEvents);

// AI analysis: every 4 hours at :10
cron.schedule("10 */4 * * *", runAnalyzeNews);

// AI briefing: daily at 06:00
cron.schedule("0 6 * * *", runGenerateBriefing);

// Global cleanup: daily at 03:30 (after airport cleanup at 03:00)
cron.schedule("30 3 * * *", runGlobalCleanup);

// ─── Startup ───────────────────────────────────────────────────

// ─── DXB Flight Status Scraping ───────────────────────────────

async function runCollectDxbFlights() {
  const label = "dxb:flights";
  console.log(`[${new Date().toISOString()}] ${label}: starting`);
  try {
    const result = await collectDxbFlightStatus(prisma);
    console.log(
      `[${new Date().toISOString()}] ${label}: departures=${result.departures} arrivals=${result.arrivals}`,
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${label}: error`, error instanceof Error ? error.message : error);
  }
}

// ─── AIS Vessel Tracking (persistent WebSocket) ──────────────

let aisMessageCount = 0;

async function startAisStream() {
  const label = "ais:stream";
  if (!process.env.AISSTREAM_API_KEY) {
    console.warn(`[${new Date().toISOString()}] ${label}: AISSTREAM_API_KEY not set. Skipping.`);
    return;
  }

  console.log(`[${new Date().toISOString()}] ${label}: connecting...`);
  try {
    const collector = new AisStreamCollector();

    collector.onMessage(async (raw) => {
      try {
        const result = await processVesselMessage(raw, vesselRepo);
        if (result.vesselType) {
          aisMessageCount++;
          // Publish to SSE
          publishToSSE("vessels", [{
            mmsi: raw.mmsi,
            name: raw.name,
            type: result.vesselType,
            lat: raw.lat,
            lon: raw.lon,
            speed: raw.speed,
            course: raw.course,
            timestamp: raw.timestamp,
          }]);
          if (aisMessageCount % 100 === 0) {
            console.log(`[${new Date().toISOString()}] ${label}: processed ${aisMessageCount} messages`);
          }
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] ${label}: save error`, error instanceof Error ? error.message : error);
      }
    });

    await collector.connect();
    console.log(`[${new Date().toISOString()}] ${label}: connected. Receiving vessel positions.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${label}: connection failed`, error);
  }
}

console.log(`[${new Date().toISOString()}] Batch scheduler started`);
console.log("Schedules:");
console.log("  */15 * * * *     News collection (GDELT + RSS)");
console.log("  */15 * * * *     Market data (Yahoo Finance)");
console.log("  */30 * * * *     Geopolitics events (GDELT)");
console.log("  */2min 07-23h    Airport flights (OpenSky, 2min peak / 1h off-peak)");
console.log("  0 6,18 * * *     Airport ops (AviationStack)");
console.log("  */10 * * * *     DXB flight status (scraping)");
console.log("  0 3 * * *        Airport cleanup (7-day retention)");
console.log("  10 */4 * * *     AI news analysis (summarize + sentiment)");
console.log("  0 6 * * *        AI daily briefing (generate + translate)");
console.log("  30 3 * * *       Global cleanup (30-day retention)");
console.log("  5,20,35,50 * * * *  Translate news (ko/ja)");
console.log("  5,35 * * * *     Translate geo events (ko/ja)");
console.log("  [persistent]     AIS vessel tracking (WebSocket)");

// Run initial collection on startup
runCollectNews();
runCollectMarket();
runCollectGeoEvents();
runCollectAirportFlights();
runCollectAirportOps();
// runCollectAirportEvents(); — disabled, using dubaiairports.ae scraping instead
startAisStream();
runCollectDxbFlights();
runGenerateBriefing();
