import { GoogleGenerativeAI } from "@google/generative-ai";
import type { PrismaClient } from "../generated/prisma/client";

export interface AirportAssessment {
  status: "OPERATIONAL" | "CAUTION" | "DISRUPTED";
  light: "green" | "amber" | "red";
  riskScore: number;
  summary: { en: string; ko: string; ja: string };
  factors: { text: { en: string; ko: string }; impact: "positive" | "negative" | "neutral" }[];
  recommendation: { en: string; ko: string; ja: string };
}

export async function analyzeAirportStatus(prisma: PrismaClient): Promise<AirportAssessment | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const events = await prisma.airportEvent.findMany({
    orderBy: { eventDate: "desc" },
    take: 10,
    select: { titleEn: true, descEn: true, eventType: true, eventDate: true },
  });

  if (events.length === 0) return null;

  const eventList = events.map((e) =>
    `[${e.eventType}] ${e.eventDate.toISOString().split("T")[0]} ${e.titleEn}${e.descEn ? ". " + e.descEn : ""}`,
  ).join("\n");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite" });

  const prompt = `You are an aviation safety analyst. Analyze these DXB airport events and provide a JSON response:

Events (newest first):
${eventList}

Return ONLY this JSON:
{
  "status": "OPERATIONAL" | "CAUTION" | "DISRUPTED",
  "light": "green" | "amber" | "red",
  "riskScore": <0-100>,
  "summary_en": "<2 sentences>",
  "summary_ko": "<2 sentences in Korean>",
  "summary_ja": "<2 sentences in Japanese>",
  "factors": [{"factor_en":"<text>","factor_ko":"<Korean>","impact":"positive"|"negative"|"neutral"}],
  "recommendation_en": "<1 sentence>",
  "recommendation_ko": "<1 sentence in Korean>",
  "recommendation_ja": "<1 sentence in Japanese>"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    status: parsed.status,
    light: parsed.light,
    riskScore: parsed.riskScore,
    summary: { en: parsed.summary_en, ko: parsed.summary_ko, ja: parsed.summary_ja },
    factors: (parsed.factors ?? []).map((f: Record<string, string>) => ({
      text: { en: f.factor_en, ko: f.factor_ko },
      impact: f.impact,
    })),
    recommendation: { en: parsed.recommendation_en, ko: parsed.recommendation_ko, ja: parsed.recommendation_ja },
  };
}
