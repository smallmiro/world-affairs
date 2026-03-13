import type { TranslatorPort } from "../domain/analysis/ports";
import type { NewsRepositoryPort } from "../domain/news/ports";
import type { GeoRepositoryPort } from "../domain/geopolitics/ports";
import type { Language } from "../shared/types";

const TARGET_LANGUAGES: Language[] = ["en", "ko", "ja"];
const BATCH_SIZE = 10;

export interface TranslateResult {
  articlesTranslated: number;
  geoEventsTranslated: number;
}

export async function translateUntranslatedArticles(
  repository: NewsRepositoryPort,
  translator: TranslatorPort,
  limit = 50,
): Promise<number> {
  // Get latest articles that may need translation (ko/ja empty)
  const articles = await repository.findLatest(limit, "en");
  let translated = 0;

  // Filter articles that need translation (ko or ja title is empty)
  const needsTranslation = articles.filter(
    (a) => a.title.ko === "" || a.title.ja === "",
  );

  // Batch translate titles
  for (let i = 0; i < needsTranslation.length; i += BATCH_SIZE) {
    const batch = needsTranslation.slice(i, i + BATCH_SIZE);
    const titles = batch.map((a) => a.title.en);

    const translatedTitles = await translator.translateBatch(
      titles,
      "en",
      TARGET_LANGUAGES,
    );

    // Translate summaries for articles that have them
    const summaries = batch.map((a) => a.summary?.en ?? null);
    const nonNullSummaries = summaries.filter((s): s is string => s !== null);
    let translatedSummaries: { en: string; ko: string; ja: string }[] = [];

    if (nonNullSummaries.length > 0) {
      translatedSummaries = await translator.translateBatch(
        nonNullSummaries,
        "en",
        TARGET_LANGUAGES,
      );
    }

    // Update articles with translations
    let summaryIdx = 0;
    const updatedArticles = batch.map((article, idx) => {
      const hasSummary = summaries[idx] !== null;
      const translatedSummary = hasSummary
        ? translatedSummaries[summaryIdx++]
        : null;

      return {
        ...article,
        title: translatedTitles[idx],
        summary: translatedSummary,
      };
    });

    await repository.save(updatedArticles);
    translated += updatedArticles.length;
  }

  return translated;
}
