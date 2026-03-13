import type { NewsCollectorPort, NewsRepositoryPort } from "../domain/news/ports";
import type { Article, RawArticle } from "../domain/news/entities";
import type { Severity } from "../shared/types";
import { randomUUID } from "crypto";

function rawToArticle(raw: RawArticle): Article {
  return {
    id: randomUUID(),
    sourceId: raw.sourceId,
    source: raw.source,
    url: raw.url,
    title: {
      en: raw.title,
      ko: "",
      ja: "",
    },
    summary: raw.summary
      ? { en: raw.summary, ko: "", ja: "" }
      : null,
    category: raw.category ?? "diplomacy",
    region: raw.region ?? "europe",
    severity: "medium" as Severity,
    imageUrl: raw.imageUrl,
    publishedAt: raw.publishedAt,
    collectedAt: new Date(),
  };
}

export interface CollectNewsResult {
  total: number;
  saved: number;
  skipped: number;
}

export async function collectNews(
  collectors: NewsCollectorPort[],
  repository: NewsRepositoryPort,
): Promise<CollectNewsResult> {
  let total = 0;
  let saved = 0;
  let skipped = 0;

  for (const collector of collectors) {
    const result = await collector.collect();
    total += result.data.length;

    // Batch check existing articles (single query instead of N+1)
    const existingIds = await repository.filterExistingSourceIds(
      result.data.map((r) => ({ sourceId: r.sourceId, source: r.source })),
    );

    const newArticles: Article[] = [];
    for (const raw of result.data) {
      if (existingIds.has(raw.sourceId)) {
        skipped++;
        continue;
      }
      newArticles.push(rawToArticle(raw));
    }

    if (newArticles.length > 0) {
      await repository.save(newArticles);
      saved += newArticles.length;
    }
  }

  return { total, saved, skipped };
}
