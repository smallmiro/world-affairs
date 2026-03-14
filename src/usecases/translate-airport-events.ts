import type { TranslatorPort } from "../domain/analysis/ports";
import type { AirportRepositoryPort } from "../domain/airport/ports";
import type { Language } from "../shared/types";

const TARGET_LANGUAGES: Language[] = ["en", "ko", "ja"];
const BATCH_SIZE = 10;

export async function translateUntranslatedAirportEvents(
  repository: AirportRepositoryPort,
  translator: TranslatorPort,
  limit = 50,
): Promise<number> {
  const events = await repository.findLatestEvents(limit);
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

    for (let j = 0; j < batch.length; j++) {
      const updated = {
        ...batch[j],
        title: translatedTitles[j],
      };
      await repository.updateEvent(updated);
    }

    translated += batch.length;
  }

  return translated;
}
