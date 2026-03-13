import { describe, it, expect, vi } from "vitest";
import { collectNews } from "../src/usecases/collect-news";
import type { NewsCollectorPort, NewsRepositoryPort } from "../src/domain/news/ports";
import type { RawArticle } from "../src/domain/news/entities";

function createMockCollector(articles: RawArticle[]): NewsCollectorPort {
  return {
    collect: vi.fn().mockResolvedValue({
      data: articles,
      collectedAt: new Date(),
      source: "test",
    }),
  };
}

function createMockRepository(existingIds: Set<string> = new Set()): NewsRepositoryPort {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findLatest: vi.fn().mockResolvedValue([]),
    findByRegion: vi.fn().mockResolvedValue([]),
    findByCategory: vi.fn().mockResolvedValue([]),
    existsBySourceId: vi.fn().mockImplementation(
      (sourceId: string) => Promise.resolve(existingIds.has(sourceId)),
    ),
  };
}

const SAMPLE_ARTICLES: RawArticle[] = [
  {
    sourceId: "abc123",
    source: "gdelt",
    url: "https://example.com/1",
    title: "Iran tensions rise",
    summary: null,
    category: "military",
    region: "middle-east",
    imageUrl: null,
    publishedAt: new Date("2026-03-13"),
    originalLanguage: "en",
  },
  {
    sourceId: "def456",
    source: "gdelt",
    url: "https://example.com/2",
    title: "EU trade talks",
    summary: "EU and China discuss tariffs",
    category: "economy",
    region: "europe",
    imageUrl: null,
    publishedAt: new Date("2026-03-13"),
    originalLanguage: "en",
  },
];

describe("collectNews", () => {
  it("should collect and save new articles", async () => {
    const collector = createMockCollector(SAMPLE_ARTICLES);
    const repo = createMockRepository();

    const result = await collectNews([collector], repo);

    expect(result.total).toBe(2);
    expect(result.saved).toBe(2);
    expect(result.skipped).toBe(0);
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect((repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0]).toHaveLength(2);
  });

  it("should skip already existing articles", async () => {
    const collector = createMockCollector(SAMPLE_ARTICLES);
    const repo = createMockRepository(new Set(["abc123"]));

    const result = await collectNews([collector], repo);

    expect(result.total).toBe(2);
    expect(result.saved).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it("should skip all when all exist", async () => {
    const collector = createMockCollector(SAMPLE_ARTICLES);
    const repo = createMockRepository(new Set(["abc123", "def456"]));

    const result = await collectNews([collector], repo);

    expect(result.total).toBe(2);
    expect(result.saved).toBe(0);
    expect(result.skipped).toBe(2);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("should handle multiple collectors", async () => {
    const collector1 = createMockCollector([SAMPLE_ARTICLES[0]]);
    const collector2 = createMockCollector([SAMPLE_ARTICLES[1]]);
    const repo = createMockRepository();

    const result = await collectNews([collector1, collector2], repo);

    expect(result.total).toBe(2);
    expect(result.saved).toBe(2);
    expect(repo.save).toHaveBeenCalledTimes(2);
  });

  it("should handle empty collector result", async () => {
    const collector = createMockCollector([]);
    const repo = createMockRepository();

    const result = await collectNews([collector], repo);

    expect(result.total).toBe(0);
    expect(result.saved).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it("should convert RawArticle to Article with default values", async () => {
    const collector = createMockCollector([SAMPLE_ARTICLES[0]]);
    const repo = createMockRepository();

    await collectNews([collector], repo);

    const savedArticles = (repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const article = savedArticles[0];

    expect(article.title.en).toBe("Iran tensions rise");
    expect(article.title.ko).toBe("");
    expect(article.title.ja).toBe("");
    expect(article.severity).toBe("medium");
    expect(article.category).toBe("military");
    expect(article.region).toBe("middle-east");
  });
});
