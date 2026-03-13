import { GoogleGenerativeAI } from "@google/generative-ai";
import type { TranslatorPort } from "../../domain/analysis/ports";
import type { Language, TranslatedText } from "../../shared/types";

const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  ko: "Korean",
  ja: "Japanese",
};

function buildPrompt(texts: string[], targetLang: Language): string {
  const langName = LANGUAGE_NAMES[targetLang];
  const json = JSON.stringify(texts);
  return `Translate the following texts to ${langName}.
Return a JSON array of translated strings in the same order.
Keep proper nouns, country names, and organization names as-is where appropriate.
Do not add any explanation, only return the JSON array.

Texts: ${json}`;
}

function parseResponse(response: string, expectedCount: number): string[] {
  // Try to extract JSON array from response
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("No JSON array found in response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed) || parsed.length !== expectedCount) {
    throw new Error(
      `Expected array of ${expectedCount} items, got ${Array.isArray(parsed) ? parsed.length : "non-array"}`,
    );
  }

  return parsed.map(String);
}

export class GeminiTranslator implements TranslatorPort {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    const key = apiKey ?? process.env.GEMINI_API_KEY ?? "";
    if (!key) {
      throw new Error("GEMINI_API_KEY is required");
    }
    this.genAI = new GoogleGenerativeAI(key);
    this.modelName = modelName ?? "gemini-2.5-flash-lite";
  }

  async translate(
    text: string,
    from: Language,
    to: Language[],
  ): Promise<TranslatedText> {
    const result: TranslatedText = { en: "", ko: "", ja: "" };
    result[from] = text;

    const targetLangs = to.filter((lang) => lang !== from);
    if (targetLangs.length === 0) {
      // All targets are same as source
      for (const lang of to) {
        result[lang] = text;
      }
      return result;
    }

    for (const lang of targetLangs) {
      try {
        const translated = await this.callGemini([text], lang);
        result[lang] = translated[0];
      } catch (error) {
        console.warn(
          `Translation to ${lang} failed, using original:`,
          error instanceof Error ? error.message : error,
        );
        result[lang] = text;
      }
    }

    return result;
  }

  async translateBatch(
    texts: string[],
    from: Language,
    to: Language[],
  ): Promise<TranslatedText[]> {
    if (texts.length === 0) return [];

    const results: TranslatedText[] = texts.map((text) => {
      const t: TranslatedText = { en: "", ko: "", ja: "" };
      t[from] = text;
      return t;
    });

    const targetLangs = to.filter((lang) => lang !== from);
    if (targetLangs.length === 0) {
      return results.map((r) => {
        const text = r[from];
        return { en: text, ko: text, ja: text };
      });
    }

    for (const lang of targetLangs) {
      try {
        const translated = await this.callGemini(texts, lang);
        for (let i = 0; i < texts.length; i++) {
          results[i][lang] = translated[i];
        }
      } catch (error) {
        console.warn(
          `Batch translation to ${lang} failed, using originals:`,
          error instanceof Error ? error.message : error,
        );
        for (let i = 0; i < texts.length; i++) {
          results[i][lang] = texts[i];
        }
      }
    }

    return results;
  }

  private async callGemini(texts: string[], targetLang: Language): Promise<string[]> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });
    const prompt = buildPrompt(texts, targetLang);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return parseResponse(responseText, texts.length);
  }
}

// Exported for testing
export { buildPrompt, parseResponse };
