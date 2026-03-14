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
  gdeltEvents: { date: string; title: string; type: string }[];
  mediaArticles: { date: string; title: string; url: string }[];
}

interface GeneratedTimelineEntry {
  date: string;
  eventType: AirportEventType;
  title: { en: string; ko: string; ja: string };
}

const GEMINI_MODEL = "gemini-2.5-flash-lite";

const SYSTEM_PROMPT = `You are an aviation operations analyst for Dubai International Airport (DXB).
Generate a concise 7-day timeline from the raw data provided.
Each day should have 1-3 entries summarizing the most significant events.

Rules:
- eventType: "ops" for delays/cancellations/route changes, "conflict" for military/security, "normal" for normal operations, "info" for advisories
- Title should be concise (under 60 chars), written in operational/SIGINT style
- If a day has no notable events, create one "normal" entry like "DXB operations normal"
- Focus on patterns: which airlines delayed, which routes affected, security events
- Output ONLY a JSON array, no explanation

Output format:
[
  { "date": "2026-03-14", "eventType": "ops", "title": { "en": "EK006 LHR delayed 48min, EK242 YYZ delayed 48min", "ko": "EK006 런던 48분 지연, EK242 토론토 48분 지연", "ja": "EK006 ロンドン48分遅延、EK242 トロント48分遅延" } },
  { "date": "2026-03-14", "eventType": "normal", "title": { "en": "DXB departures on time — EK LHR, PVG, BKK, IST, GRU on schedule", "ko": "DXB 출발편 정상 — EK 런던, 상하이, 방콕, 이스탄불, 상파울루행 정시", "ja": "DXB出発便正常 — EK ロンドン、上海、バンコク、イスタンブール、サンパウロ行定時" } }
]`;

function buildDataPrompt(input: RawTimelineInput): string {
  const sections: string[] = [];

  if (input.flightSummaries.length > 0) {
    sections.push("## DXB Flight Status (dubaiairports.ae)\n" +
      input.flightSummaries.map((s) =>
        `${s.date}: ${s.totalFlights} flights, ${s.delayed} delayed, ${s.cancelled} cancelled` +
        (s.notableDelays.length > 0 ? `\n  Notable: ${s.notableDelays.join("; ")}` : ""),
      ).join("\n"));
  }

  if (input.gdeltEvents.length > 0) {
    sections.push("## GDELT News Events\n" +
      input.gdeltEvents.map((e) => `${e.date} [${e.type}]: ${e.title}`).join("\n"));
  }

  if (input.mediaArticles.length > 0) {
    sections.push("## Dubai Airports Media\n" +
      input.mediaArticles.map((a) => `${a.date}: ${a.title}`).join("\n"));
  }

  return `Generate a 7-day DXB airport timeline from the following raw data.
Today is ${new Date().toISOString().split("T")[0]}.

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

  // Group by date, deduplicate by taking latest batch per day
  const byDate = new Map<string, typeof flights>();
  for (const f of flights) {
    const dateKey = f.collectedAt.toISOString().split("T")[0];
    if (!byDate.has(dateKey)) byDate.set(dateKey, []);
    byDate.get(dateKey)!.push(f);
  }

  const summaries: DailyFlightSummary[] = [];
  for (const [date, dayFlights] of byDate) {
    // Take latest batch only (dedup by collectedAt)
    const latestTime = Math.max(...dayFlights.map((f) => f.collectedAt.getTime()));
    const latestBatch = dayFlights.filter((f) => f.collectedAt.getTime() === latestTime);

    const delayed = latestBatch.filter((f) => f.status === "Delayed" || f.status === "New Time");
    const cancelled = latestBatch.filter((f) => f.status === "Cancelled");

    // Notable: EK delays > 30min, or any cancellation
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

async function gatherGdeltEvents(repo: AirportRepositoryPort): Promise<{ date: string; title: string; type: string }[]> {
  const events = await repo.findLatestEvents(50);
  return events.map((e) => ({
    date: e.eventDate.toISOString().split("T")[0],
    title: e.title.en,
    type: e.eventType,
  }));
}

async function gatherMediaArticles(): Promise<{ date: string; title: string; url: string }[]> {
  const articles = await collectDxbMedia();
  return articles.map((a) => ({
    date: a.date.toISOString().split("T")[0],
    title: a.title,
    url: a.url,
  }));
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
  // 1. Gather raw data from all sources
  const [flightSummaries, gdeltEvents, mediaArticles] = await Promise.all([
    gatherFlightSummaries(prisma),
    gatherGdeltEvents(repo),
    gatherMediaArticles(),
  ]);

  const input: RawTimelineInput = { flightSummaries, gdeltEvents, mediaArticles };
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
