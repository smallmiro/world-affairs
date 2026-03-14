import type { TranslatorPort } from "../domain/analysis/ports";
import type { GeoRepositoryPort } from "../domain/geopolitics/ports";
import type { Language } from "../shared/types";

const TARGET_LANGUAGES: Language[] = ["en", "ko", "ja"];
const BATCH_SIZE = 10;

export async function translateUntranslatedGeoEvents(
  repository: GeoRepositoryPort,
  translator: TranslatorPort,
  limit = 50,
): Promise<number> {
  const events = await repository.findLatest(limit, "en");
  let translated = 0;

  const needsTranslation = events.filter(
    (e) => e.title.ko === "" || e.title.ja === "" || e.title.ko === e.title.en || e.title.ja === e.title.en,
  );

  for (let i = 0; i < needsTranslation.length; i += BATCH_SIZE) {
    const batch = needsTranslation.slice(i, i + BATCH_SIZE);
    const titles = batch.map((e) => e.title.en);

    const translatedTitles = await translator.translateBatch(
      titles,
      "en",
      TARGET_LANGUAGES,
    );

    const descNeedsTranslation = batch.map(
      (e) =>
        e.description !== null &&
        (e.description.ko === "" || e.description.ja === ""),
    );
    const descsToTranslate = batch
      .filter((_, idx) => descNeedsTranslation[idx])
      .map((e) => e.description!.en);

    let translatedDescs: { en: string; ko: string; ja: string }[] = [];
    if (descsToTranslate.length > 0) {
      translatedDescs = await translator.translateBatch(
        descsToTranslate,
        "en",
        TARGET_LANGUAGES,
      );
    }

    let descIdx = 0;
    const updated = batch.map((event, idx) => {
      const needsDesc = descNeedsTranslation[idx];
      const translatedDesc = needsDesc
        ? translatedDescs[descIdx++]
        : event.description;

      return {
        ...event,
        title: translatedTitles[idx],
        description: translatedDesc,
      };
    });

    await repository.save(updated);
    translated += updated.length;
  }

  return translated;
}
