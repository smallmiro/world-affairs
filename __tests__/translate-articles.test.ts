import { describe, it, expect, vi } from "vitest";
import { translateUntranslatedArticles } from "../src/usecases/translate-articles";
import type { TranslatorPort } from "../src/domain/analysis/ports";
import type { NewsRepositoryPort } from "../src/domain/news/ports";
import type { Article } from "../src/domain/news/entities";

function createMockArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: "test-id",
    sourceId: "src-1",
    source: "test",
    url: "https://example.com/1",
    title: { en: "Test title", ko: "", ja: "" },
    summary: { en: "Test summary", ko: "", ja: "" },
    category: "diplomacy",
    region: "europe",
    severity: "medium",
    imageUrl: null,
    publishedAt: new Date("2026-03-13"),
    collectedAt: new Date("2026-03-13"),
    ...overrides,
  };
}

function createMockTranslator(): TranslatorPort {
  return {
    translate: vi.fn().mockImplementation(
      (text: string) =>
        Promise.resolve({
          en: text,
          ko: `${text} (한국어)`,
          ja: `${text} (日本語)`,
        }),
    ),
    translateBatch: vi.fn().mockImplementation(
      (texts: string[]) =>
        Promise.resolve(
          texts.map((t) => ({
            en: t,
            ko: `${t} (한국어)`,
            ja: `${t} (日本語)`,
          })),
        ),
    ),
  };
}

function createMockRepository(articles: Article[] = []): NewsRepositoryPort {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findLatest: vi.fn().mockResolvedValue(articles),
    findByRegion: vi.fn().mockResolvedValue([]),
    findByCategory: vi.fn().mockResolvedValue([]),
    existsBySourceId: vi.fn().mockResolvedValue(false),
    filterExistingSourceIds: vi.fn().mockResolvedValue(new Set()),
  };
}

describe("translateUntranslatedArticles", () => {
  it("should translate articles with empty ko/ja titles", async () => {
    const article = createMockArticle();
    const repo = createMockRepository([article]);
    const translator = createMockTranslator();

    const count = await translateUntranslatedArticles(repo, translator);

    expect(count).toBe(1);
    expect(translator.translateBatch).toHaveBeenCalledTimes(2); // titles + summaries
    expect(repo.save).toHaveBeenCalledTimes(1);

    const savedArticles = (repo.save as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(savedArticles[0].title.ko).toBe("Test title (한국어)");
    expect(savedArticles[0].title.ja).toBe("Test title (日本語)");
  });

  it("should skip already translated articles", async () => {
    const article = createMockArticle({
      title: { en: "Test", ko: "테스트", ja: "テスト" },
    });
    const repo = createMockRepository([article]);
    const translator = createMockTranslator();

    const count = await translateUntranslatedArticles(repo, translator);

    expect(count).toBe(0);
    expect(translator.translateBatch).not.toHaveBeenCalled();
  });

  it("should handle articles with null summary", async () => {
    const article = createMockArticle({ summary: null });
    const repo = createMockRepository([article]);
    const translator = createMockTranslator();

    const count = await translateUntranslatedArticles(repo, translator);

    expect(count).toBe(1);
    // Only title batch, no summary batch
    expect(translator.translateBatch).toHaveBeenCalledTimes(1);
  });

  it("should handle empty article list", async () => {
    const repo = createMockRepository([]);
    const translator = createMockTranslator();

    const count = await translateUntranslatedArticles(repo, translator);

    expect(count).toBe(0);
  });

  it("should translate summaries along with titles", async () => {
    const article = createMockArticle();
    const repo = createMockRepository([article]);
    const translator = createMockTranslator();

    await translateUntranslatedArticles(repo, translator);

    const savedArticles = (repo.save as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(savedArticles[0].summary.ko).toBe("Test summary (한국어)");
    expect(savedArticles[0].summary.ja).toBe("Test summary (日本語)");
  });
});
