import type { NewsRepositoryPort } from "../../domain/news/ports";
import type { Article } from "../../domain/news/entities";
import type { Language, NewsCategory, Region } from "../../shared/types";
import type { PrismaClient } from "../../generated/prisma/client";

function langTitle(lang: Language): "titleEn" | "titleKo" | "titleJa" {
  return lang === "en" ? "titleEn" : lang === "ko" ? "titleKo" : "titleJa";
}

function langSummary(lang: Language): "summaryEn" | "summaryKo" | "summaryJa" {
  return lang === "en" ? "summaryEn" : lang === "ko" ? "summaryKo" : "summaryJa";
}

function toArticle(row: Record<string, unknown>): Article {
  return {
    id: row.id as string,
    sourceId: row.sourceId as string,
    source: row.source as string,
    url: row.url as string,
    title: {
      en: row.titleEn as string,
      ko: row.titleKo as string,
      ja: row.titleJa as string,
    },
    summary:
      row.summaryEn || row.summaryKo || row.summaryJa
        ? {
            en: (row.summaryEn as string) ?? "",
            ko: (row.summaryKo as string) ?? "",
            ja: (row.summaryJa as string) ?? "",
          }
        : null,
    category: row.category as NewsCategory,
    region: row.region as Region,
    severity: row.severity as Article["severity"],
    imageUrl: (row.imageUrl as string) ?? null,
    publishedAt: new Date(row.publishedAt as string | Date),
    collectedAt: new Date(row.collectedAt as string | Date),
  };
}

export class NewsRepository implements NewsRepositoryPort {
  constructor(private prisma: PrismaClient) {}

  async save(articles: Article[]): Promise<void> {
    await this.prisma.$transaction(
      articles.map((article) =>
        this.prisma.article.upsert({
          where: {
            sourceId_source: {
              sourceId: article.sourceId,
              source: article.source,
            },
          },
          create: {
            sourceId: article.sourceId,
            source: article.source,
            url: article.url,
            titleEn: article.title.en,
            titleKo: article.title.ko,
            titleJa: article.title.ja,
            summaryEn: article.summary?.en ?? null,
            summaryKo: article.summary?.ko ?? null,
            summaryJa: article.summary?.ja ?? null,
            category: article.category,
            region: article.region,
            severity: article.severity,
            imageUrl: article.imageUrl,
            publishedAt: article.publishedAt,
          },
          update: {
            titleEn: article.title.en,
            titleKo: article.title.ko,
            titleJa: article.title.ja,
            summaryEn: article.summary?.en ?? null,
            summaryKo: article.summary?.ko ?? null,
            summaryJa: article.summary?.ja ?? null,
            category: article.category,
            region: article.region,
            severity: article.severity,
            imageUrl: article.imageUrl,
          },
        }),
      ),
    );
  }

  async findLatest(limit: number, lang: Language): Promise<Article[]> {
    const rows = await this.prisma.article.findMany({
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
    return rows.map((r) => toArticle(r as unknown as Record<string, unknown>));
  }

  async findByRegion(region: Region, lang: Language, limit: number): Promise<Article[]> {
    const rows = await this.prisma.article.findMany({
      where: { region },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
    return rows.map((r) => toArticle(r as unknown as Record<string, unknown>));
  }

  async findByCategory(category: NewsCategory, lang: Language, limit: number): Promise<Article[]> {
    const rows = await this.prisma.article.findMany({
      where: { category },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
    return rows.map((r) => toArticle(r as unknown as Record<string, unknown>));
  }

  async existsBySourceId(sourceId: string, source: string): Promise<boolean> {
    const count = await this.prisma.article.count({
      where: { sourceId, source },
    });
    return count > 0;
  }

  async filterExistingSourceIds(
    ids: { sourceId: string; source: string }[],
  ): Promise<Set<string>> {
    if (ids.length === 0) return new Set();

    const existing = await this.prisma.article.findMany({
      where: {
        OR: ids.map(({ sourceId, source }) => ({ sourceId, source })),
      },
      select: { sourceId: true },
    });

    return new Set(existing.map((r) => r.sourceId));
  }
}
