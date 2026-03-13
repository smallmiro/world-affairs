import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../src/infrastructure/prisma";
import { NewsRepository } from "../../../src/adapters/repositories/news-repository";
import type { Language, NewsCategory, Region } from "../../../src/shared/types";

const repo = new NewsRepository(prisma);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lang = (searchParams.get("lang") ?? "ko") as Language;
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);
  const region = searchParams.get("region") as Region | null;
  const category = searchParams.get("category") as NewsCategory | null;

  try {
    let articles;
    if (region) {
      articles = await repo.findByRegion(region, lang, limit);
    } else if (category) {
      articles = await repo.findByCategory(category, lang, limit);
    } else {
      articles = await repo.findLatest(limit, lang);
    }

    return NextResponse.json({ data: articles, count: articles.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch news", code: 500 },
      { status: 500 },
    );
  }
}
