import type { GoogleGenerativeAI } from "@google/generative-ai";
import type { PrismaClient } from "../generated/prisma/client";
import type { AirportRepositoryPort } from "../domain/airport/ports";
import type { AirportEvent } from "../domain/airport/entities";
import type { AirportEventType } from "../shared/types";
import { collectDxbMedia } from "../adapters/collectors/dxb-media-collector";
import { randomUUID } from "crypto";

interface DailyFlightSummary {
  date: string;
  totalFlights: number;
  delayed: number;
  cancelled: number;
  notableDelays: string[];
}

interface RawTimelineInput {
  flightSummaries: DailyFlightSummary[];
  gdeltAirportEvents: { date: string; title: string; type: string }[];
  newsArticles: { date: string; title: string; category: string }[];
  geoEvents: { date: string; title: string; type: string }[];
  mediaArticles: { date: string; title: string; url: string }[];
}

interface GeneratedTimelineEntry {
  date: string;
  eventType: AirportEventType;
  title: { en: string; ko: string; ja: string };
}

const GEMINI_MODEL = "gemini-2.5-flash-lite";

const SYSTEM_PROMPT = `You are an aviation operations analyst for Dubai International Airport (DXB).
Generate a concise 7-day PAST timeline (today and 6 days before) combining ALL provided intelligence sources.
Each day should have 1-3 entries summarizing the MOST SIGNIFICANT events affecting DXB.
IMPORTANT: Do NOT generate entries for future dates. Only use dates from today and the past 6 days.

Data sources you will receive:
1. DXB Flight Status — actual delays, cancellations from dubaiairports.ae
2. GDELT Airport Events — aviation/airspace news (NOTAM, closures, reroutes)
3. News Articles — Middle East geopolitical news (military, diplomacy, conflicts)
4. Geo Events — geopolitical events with coordinates (conflicts, sanctions, tensions)
5. Dubai Airports Media — official DXB operational announcements

Analysis rules:
- CROSS-REFERENCE sources: if news reports Iran strikes AND flights are delayed, connect them
- eventType: "ops" for flight delays/route changes, "conflict" for military/security events affecting aviation, "normal" for routine ops, "info" for advisories/intel
- Title must be concise (under 60 chars), written in operational/SIGINT style
- Do NOT mark a day as "normal" if there are conflict events, airspace issues, or significant delays
- If military activity or airspace restrictions are reported, classify as "conflict" even if DXB flights seem unaffected
- Focus on: airspace closures, military operations near Gulf, flight disruptions, NOTAM changes, route diversions
- Output ONLY a JSON array, no explanation

Output format:
[
  { "date": "2026-03-14", "eventType": "conflict", "title": { "en": "US strikes on Iran — Gulf airspace restrictions in effect", "ko": "미국 이란 공습 — 걸프 영공 제한 발효", "ja": "米国イラン空爆 — 湾岸空域制限発効" } },
  { "date": "2026-03-14", "eventType": "ops", "title": { "en": "EK006 LHR delayed 48min; multiple EK reroutes via southern corridor", "ko": "EK006 런던 48분 지연; 다수 EK편 남측 회랑 우회", "ja": "EK006 ロンドン48分遅延; 複数EK便南部回廊迂回" } }
]`;

function buildDataPrompt(input: RawTimelineInput): string {
  const sections: string[] = [];

  if (input.flightSummaries.length > 0) {
    sections.push("## 1. DXB Flight Status (dubaiairports.ae)\n" +
      input.flightSummaries.map((s) =>
        `${s.date}: ${s.totalFlights} flights, ${s.delayed} delayed, ${s.cancelled} cancelled` +
        (s.notableDelays.length > 0 ? `\n  Notable: ${s.notableDelays.join("; ")}` : ""),
      ).join("\n"));
  }

  if (input.gdeltAirportEvents.length > 0) {
    sections.push("## 2. GDELT Airport/Aviation Events\n" +
      input.gdeltAirportEvents.map((e) => `${e.date} [${e.type}]: ${e.title}`).join("\n"));
  }

  if (input.newsArticles.length > 0) {
    sections.push("## 3. Middle East News Articles\n" +
      input.newsArticles.map((n) => `${n.date} [${n.category}]: ${n.title}`).join("\n"));
  }

  if (input.geoEvents.length > 0) {
    sections.push("## 4. Geopolitical Events\n" +
      input.geoEvents.map((g) => `${g.date} [${g.type}]: ${g.title}`).join("\n"));
  }

  if (input.mediaArticles.length > 0) {
    sections.push("## 5. Dubai Airports Official Media\n" +
      input.mediaArticles.map((a) => `${a.date}: ${a.title} (${a.url})`).join("\n"));
  }

  return `Generate a 7-day DXB airport timeline from the following raw intelligence data.
Today is ${new Date().toISOString().split("T")[0]}.
Analyze and cross-reference ALL sources to produce accurate operational assessments.

${sections.join("\n\n")}`;
}

async function gatherFlightSummaries(prisma: PrismaClient): Promise<DailyFlightSummary[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const flights = await prisma.dxbFlightStatus.findMany({
    where: { collectedAt: { gte: sevenDaysAgo } },
    select: { flightCode: true, destination: true, status: true, scheduled: true, actual: true, collectedAt: true },
    orderBy: { collectedAt: "desc" },
  });

  const byDate = new Map<string, typeof flights>();
  for (const f of flights) {
    const dateKey = f.collectedAt.toISOString().split("T")[0];
    if (!byDate.has(dateKey)) byDate.set(dateKey, []);
    byDate.get(dateKey)!.push(f);
  }

  const summaries: DailyFlightSummary[] = [];
  for (const [date, dayFlights] of byDate) {
    const latestTime = Math.max(...dayFlights.map((f) => f.collectedAt.getTime()));
    const latestBatch = dayFlights.filter((f) => f.collectedAt.getTime() === latestTime);

    const delayed = latestBatch.filter((f) => f.status === "Delayed" || f.status === "New Time");
    const cancelled = latestBatch.filter((f) => f.status === "Cancelled");

    const notableDelays: string[] = [];
    for (const f of delayed) {
      if (f.flightCode.startsWith("EK") && f.scheduled && f.actual) {
        notableDelays.push(`${f.flightCode} → ${f.destination} (${f.status})`);
      }
    }
    for (const f of cancelled) {
      notableDelays.push(`${f.flightCode} → ${f.destination} CANCELLED`);
    }

    summaries.push({
      date,
      totalFlights: latestBatch.length,
      delayed: delayed.length,
      cancelled: cancelled.length,
      notableDelays: notableDelays.slice(0, 10),
    });
  }

  return summaries.sort((a, b) => b.date.localeCompare(a.date));
}

async function gatherGdeltAirportEvents(repo: AirportRepositoryPort): Promise<{ date: string; title: string; type: string }[]> {
  const events = await repo.findLatestEvents(50);
  // Exclude gemini-timeline entries to avoid circular reference
  return events
    .filter((e) => e.source !== "gemini-timeline")
    .map((e) => ({
      date: e.eventDate.toISOString().split("T")[0],
      title: e.title.en,
      type: e.eventType,
    }));
}

async function gatherNewsArticles(prisma: PrismaClient): Promise<{ date: string; title: string; category: string }[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get aviation/military/diplomacy related news
  const articles = await prisma.article.findMany({
    where: {
      collectedAt: { gte: sevenDaysAgo },
      category: { in: ["military", "diplomacy", "energy", "human_rights"] },
    },
    select: { titleEn: true, collectedAt: true, category: true },
    orderBy: { collectedAt: "desc" },
    take: 50,
  });

  return articles
    .filter((a) => a.titleEn)
    .map((a) => ({
      date: a.collectedAt.toISOString().split("T")[0],
      title: a.titleEn!,
      category: a.category ?? "other",
    }));
}

async function gatherGeoEvents(prisma: PrismaClient): Promise<{ date: string; title: string; type: string }[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const events = await prisma.geoEvent.findMany({
    where: {
      collectedAt: { gte: sevenDaysAgo },
      eventType: { in: ["conflict", "military", "sanctions", "protest"] },
    },
    select: { titleEn: true, eventDate: true, eventType: true },
    orderBy: { eventDate: "desc" },
    take: 50,
  });

  return events
    .filter((e) => e.titleEn)
    .map((e) => ({
      date: e.eventDate.toISOString().split("T")[0],
      title: e.titleEn!,
      type: e.eventType ?? "other",
    }));
}

async function gatherMediaArticles(): Promise<{ date: string; title: string; url: string }[]> {
  try {
    const articles = await collectDxbMedia();
    return articles.map((a) => ({
      date: a.date.toISOString().split("T")[0],
      title: a.title,
      url: a.url,
    }));
  } catch {
    return [];
  }
}

function parseTimelineResponse(responseText: string): GeneratedTimelineEntry[] {
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("No JSON array found in timeline response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed)) {
    throw new Error("Expected JSON array for timeline");
  }

  return parsed.map((entry: Record<string, unknown>) => ({
    date: String(entry.date ?? ""),
    eventType: String(entry.eventType ?? "info") as AirportEventType,
    title: entry.title as { en: string; ko: string; ja: string },
  }));
}

export async function generateAirportTimeline(
  genAI: GoogleGenerativeAI,
  prisma: PrismaClient,
  repo: AirportRepositoryPort,
): Promise<{ generated: number }> {
  // 1. Gather raw data from ALL sources
  const [flightSummaries, gdeltAirportEvents, newsArticles, geoEvents, mediaArticles] = await Promise.all([
    gatherFlightSummaries(prisma),
    gatherGdeltAirportEvents(repo),
    gatherNewsArticles(prisma),
    gatherGeoEvents(prisma),
    gatherMediaArticles(),
  ]);

  const input: RawTimelineInput = { flightSummaries, gdeltAirportEvents, newsArticles, geoEvents, mediaArticles };
  const dataPrompt = buildDataPrompt(input);

  // 2. Call Gemini
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
  });
  const result = await model.generateContent(dataPrompt);
  const responseText = result.response.text();

  // 3. Parse response
  const entries = parseTimelineResponse(responseText);

  // 4. Save as AirportEvent entries (clear old generated ones first)
  const SOURCE = "gemini-timeline";
  await prisma.airportEvent.deleteMany({ where: { source: SOURCE } });

  const batchId = Date.now();
  const events: AirportEvent[] = entries.map((entry, idx) => ({
    id: randomUUID(),
    sourceId: `timeline-${entry.date}-${entry.eventType}-${batchId}-${idx}`,
    source: SOURCE,
    url: "",
    title: entry.title,
    description: null,
    eventType: entry.eventType,
    eventDate: new Date(entry.date + "T00:00:00Z"),
    collectedAt: new Date(),
  }));

  if (events.length > 0) {
    await repo.saveEvents(events);
  }

  return { generated: events.length };
}
