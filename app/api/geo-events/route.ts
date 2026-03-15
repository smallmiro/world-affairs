import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../src/infrastructure/prisma";
import { GeoRepository } from "../../../src/adapters/repositories/geo-repository";
import type { GeoEventType, Language, Severity } from "../../../src/shared/types";

const repo = new GeoRepository(prisma);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lang = (searchParams.get("lang") ?? "ko") as Language;
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 1000);
  const severity = searchParams.get("severity") as Severity | null;
  const eventType = searchParams.get("eventType") as GeoEventType | null;

  try {
    let events;
    if (severity) {
      events = await repo.findBySeverity(severity, lang, limit);
    } else if (eventType) {
      events = await repo.findByEventType(eventType, lang, limit);
    } else {
      events = await repo.findLatest(limit, lang);
    }

    return NextResponse.json({ data: events, count: events.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch geo events", code: 500 },
      { status: 500 },
    );
  }
}
