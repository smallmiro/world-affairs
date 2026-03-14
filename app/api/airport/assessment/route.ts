import { NextResponse } from "next/server";
import { prisma } from "../../../../src/infrastructure/prisma";
import { analyzeAirportStatus } from "../../../../src/usecases/analyze-airport";

let cachedAssessment: { data: unknown; cachedAt: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function GET() {
  try {
    if (cachedAssessment && Date.now() - cachedAssessment.cachedAt < CACHE_TTL) {
      return NextResponse.json({ data: cachedAssessment.data });
    }

    const assessment = await analyzeAirportStatus(prisma);
    if (!assessment) {
      return NextResponse.json({ data: null });
    }

    cachedAssessment = { data: assessment, cachedAt: Date.now() };
    return NextResponse.json({ data: assessment });
  } catch (error) {
    console.error("[airport/assessment]", error);
    return NextResponse.json({ data: null });
  }
}
