import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../src/infrastructure/prisma";
import { AnalysisRepository } from "../../../../src/adapters/repositories/analysis-repository";
import type { Language } from "../../../../src/shared/types";

const repo = new AnalysisRepository(prisma);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lang = (searchParams.get("lang") ?? "ko") as Language;

  try {
    const briefing = await repo.findLatestBriefing(lang);

    if (!briefing) {
      return NextResponse.json(
        { error: "No briefing available", code: 404 },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: briefing });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch briefing", code: 500 },
      { status: 500 },
    );
  }
}
