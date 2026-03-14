import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../src/infrastructure/prisma";

export async function GET(request: NextRequest) {
  const direction = request.nextUrl.searchParams.get("direction") ?? "departure";
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? "30"), 100);

  try {
    // Get latest collection batch
    const latest = await prisma.dxbFlightStatus.findFirst({
      where: { direction },
      orderBy: { collectedAt: "desc" },
      select: { collectedAt: true },
    });

    if (!latest) {
      return NextResponse.json({ data: [], count: 0 });
    }

    const flights = await prisma.dxbFlightStatus.findMany({
      where: { direction, collectedAt: latest.collectedAt },
      take: limit,
      orderBy: { scheduled: "asc" },
    });

    return NextResponse.json({ data: flights, count: flights.length });
  } catch (error) {
    console.error("[airport/flights API]", error);
    return NextResponse.json({ error: "Failed to fetch flight status" }, { status: 500 });
  }
}
