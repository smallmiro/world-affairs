import { describe, it, expect, vi } from "vitest";
import {
  analyzeRecentNews,
  generateDailyBriefing,
} from "../src/usecases/analyze-news";
import type {
  AnalyzerPort,
  AnalysisRepositoryPort,
} from "../src/domain/analysis/ports";
import type { NewsRepositoryPort } from "../src/domain/news/ports";
import type { Article } from "../src/domain/news/entities";
import type { AiAnalysis } from "../src/domain/analysis/entities";

function createMockArticle(id: string): Article {
  return {
    id,
    sourceId: `src-${id}`,
    source: "test",
    url: `https://example.com/${id}`,
    title: { en: "Test article title", ko: "", ja: "" },
    summary: { en: "Test article summary", ko: "", ja: "" },
    category: "diplomacy",
    region: "europe",
    severity: "medium",
    imageUrl: null,
    publishedAt: new Date("2026-03-13"),
    collectedAt: new Date("2026-03-13"),
  };
}

function createMockNewsRepo(articles: Article[] = []): NewsRepositoryPort {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findLatest: vi.fn().mockResolvedValue(articles),
    findByRegion: vi.fn().mockResolvedValue([]),
    findByCategory: vi.fn().mockResolvedValue([]),
    existsBySourceId: vi.fn().mockResolvedValue(false),
    filterExistingSourceIds: vi.fn().mockResolvedValue(new Set()),
  };
}

function createMockAnalyzer(): AnalyzerPort {
  return {
    summarize: vi.fn().mockResolvedValue({
      text: "Summary of the article",
      model: "test-model",
    }),
    analyzeSentiment: vi.fn().mockResolvedValue({
      score: -0.5,
      label: "negative",
      reasoning: "Conflict escalation",
    }),
    generateBriefing: vi.fn().mockResolvedValue({
      date: new Date(),
      content: "## Daily Briefing\n\nKey developments...",
      model: "test-flash",
    }),
    clusterIssues: vi.fn().mockResolvedValue([]),
  };
}

function createMockAnalysisRepo(
  existingAnalyses: AiAnalysis[] = [],
): AnalysisRepositoryPort {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findByTarget: vi.fn().mockResolvedValue(existingAnalyses),
    findLatestBriefing: vi.fn().mockResolvedValue(null),
  };
}

describe("analyzeRecentNews", () => {
  it("should summarize and analyze sentiment for articles", async () => {
    const articles = [createMockArticle("1"), createMockArticle("2")];
    const newsRepo = createMockNewsRepo(articles);
    const analyzer = createMockAnalyzer();
    const analysisRepo = createMockAnalysisRepo();

    const result = await analyzeRecentNews(
      newsRepo,
      analyzer,
      analysisRepo,
    );

    expect(result.summarized).toBe(2);
    expect(result.sentimentAnalyzed).toBe(2);
    // 2 articles × 2 types (summary + sentiment) = 4 saves
    expect(analysisRepo.save).toHaveBeenCalledTimes(4);
  });

  it("should skip already analyzed articles", async () => {
    const articles = [createMockArticle("1")];
    const newsRepo = createMockNewsRepo(articles);
    const analyzer = createMockAnalyzer();
    const existingAnalysis: AiAnalysis = {
      id: "existing",
      targetType: "article",
      targetId: "1",
      type: "summary",
      result: { en: "Already summarized", ko: "", ja: "" },
      sentiment: null,
      sentimentLabel: null,
      model: "test",
      createdAt: new Date(),
    };
    const analysisRepo = createMockAnalysisRepo([existingAnalysis]);

    const result = await analyzeRecentNews(
      newsRepo,
      analyzer,
      analysisRepo,
    );

    expect(result.summarized).toBe(0); // skipped
    expect(result.sentimentAnalyzed).toBe(1); // only sentiment
    expect(analysisRepo.save).toHaveBeenCalledTimes(1);
  });

  it("should handle empty article list", async () => {
    const newsRepo = createMockNewsRepo([]);
    const analyzer = createMockAnalyzer();
    const analysisRepo = createMockAnalysisRepo();

    const result = await analyzeRecentNews(
      newsRepo,
      analyzer,
      analysisRepo,
    );

    expect(result.summarized).toBe(0);
    expect(result.sentimentAnalyzed).toBe(0);
  });

  it("should continue on individual analysis failure", async () => {
    const articles = [createMockArticle("1")];
    const newsRepo = createMockNewsRepo(articles);
    const analyzer = createMockAnalyzer();
    (analyzer.summarize as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("API error"),
    );
    const analysisRepo = createMockAnalysisRepo();

    const result = await analyzeRecentNews(
      newsRepo,
      analyzer,
      analysisRepo,
    );

    expect(result.summarized).toBe(0); // failed
    expect(result.sentimentAnalyzed).toBe(1); // still works
  });
});

describe("generateDailyBriefing", () => {
  it("should generate and save a briefing", async () => {
    const articles = [createMockArticle("1"), createMockArticle("2")];
    const newsRepo = createMockNewsRepo(articles);
    const analyzer = createMockAnalyzer();
    const analysisRepo = createMockAnalysisRepo();

    const briefing = await generateDailyBriefing(
      newsRepo,
      analyzer,
      analysisRepo,
    );

    expect(briefing.targetType).toBe("daily_briefing");
    expect(briefing.type).toBe("briefing");
    expect(briefing.result.en).toContain("Daily Briefing");
    expect(analysisRepo.save).toHaveBeenCalledTimes(1);
  });
});
