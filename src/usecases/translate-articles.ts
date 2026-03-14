import type { TranslatorPort } from "../domain/analysis/ports";
import type { NewsRepositoryPort } from "../domain/news/ports";
import type { Language } from "../shared/types";

const TARGET_LANGUAGES: Language[] = ["en", "ko", "ja"];
const BATCH_SIZE = 10;

export async function translateUntranslatedArticles(
  repository: NewsRepositoryPort,
  translator: TranslatorPort,
  limit = 50,
): Promise<number> {
  const articles = await repository.findLatest(limit, "en");
  let translated = 0;

  // Filter articles that need title translation (ko/ja empty or same as en = untranslated fallback)
  const needsTranslation = articles.filter(
    (a) => a.title.ko === "" || a.title.ja === "" || a.title.ko === a.title.en || a.title.ja === a.title.en,
  );

  for (let i = 0; i < needsTranslation.length; i += BATCH_SIZE) {
    const batch = needsTranslation.slice(i, i + BATCH_SIZE);
    const titles = batch.map((a) => a.title.en);

    const translatedTitles = await translator.translateBatch(
      titles,
      "en",
      TARGET_LANGUAGES,
    );

    // Only translate summaries that need translation (ko or ja empty)
    const summaryNeedsTranslation = batch.map(
      (a) =>
        a.summary !== null &&
        (a.summary.ko === "" || a.summary.ja === ""),
    );
    const summariesToTranslate = batch
      .filter((_, idx) => summaryNeedsTranslation[idx])
      .map((a) => a.summary!.en);

    let translatedSummaries: { en: string; ko: string; ja: string }[] = [];
    if (summariesToTranslate.length > 0) {
      translatedSummaries = await translator.translateBatch(
        summariesToTranslate,
        "en",
        TARGET_LANGUAGES,
      );
    }

    let summaryIdx = 0;
    const updatedArticles = batch.map((article, idx) => {
      const needsSummaryTranslation = summaryNeedsTranslation[idx];
      const translatedSummary = needsSummaryTranslation
        ? translatedSummaries[summaryIdx++]
        : article.summary;

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
