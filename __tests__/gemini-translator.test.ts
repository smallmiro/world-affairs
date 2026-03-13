import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildPrompt, parseResponse } from "../src/adapters/translators/gemini-translator";

describe("buildPrompt", () => {
  it("should build Korean translation prompt", () => {
    const prompt = buildPrompt(["Hello world"], "ko");
    expect(prompt).toContain("Korean");
    expect(prompt).toContain('"Hello world"');
    expect(prompt).toContain("JSON array");
  });

  it("should build Japanese translation prompt", () => {
    const prompt = buildPrompt(["Hello world"], "ja");
    expect(prompt).toContain("Japanese");
  });

  it("should include multiple texts", () => {
    const prompt = buildPrompt(["Text 1", "Text 2", "Text 3"], "ko");
    expect(prompt).toContain("Text 1");
    expect(prompt).toContain("Text 2");
    expect(prompt).toContain("Text 3");
  });
});

describe("parseResponse", () => {
  it("should parse valid JSON array", () => {
    const result = parseResponse('["안녕하세요", "세계"]', 2);
    expect(result).toEqual(["안녕하세요", "세계"]);
  });

  it("should extract JSON array from surrounding text", () => {
    const result = parseResponse(
      'Here are the translations:\n["번역 1", "번역 2"]\n',
      2,
    );
    expect(result).toEqual(["번역 1", "번역 2"]);
  });

  it("should throw on missing JSON array", () => {
    expect(() => parseResponse("No JSON here", 1)).toThrow(
      "No JSON array found",
    );
  });

  it("should throw on wrong array length", () => {
    expect(() => parseResponse('["one"]', 2)).toThrow(
      "Expected array of 2 items",
    );
  });

  it("should convert non-string values to strings", () => {
    const result = parseResponse("[123, true]", 2);
    expect(result).toEqual(["123", "true"]);
  });
});

describe("GeminiTranslator", () => {
  it("should skip translation when source equals target", async () => {
    // We test the logic without actual API by importing the class
    // and mocking the API call
    const { GeminiTranslator } = await import(
      "../src/adapters/translators/gemini-translator"
    );

    // Mock the genAI to avoid needing a real API key
    const translator = Object.create(GeminiTranslator.prototype);
    translator.genAI = {};
    translator.modelName = "test-model";

    // Override callGemini to track calls
    const callSpy = vi.fn();
    translator.callGemini = callSpy;

    const result = await translator.translate("Hello", "en", ["en"]);

    expect(result.en).toBe("Hello");
    expect(callSpy).not.toHaveBeenCalled();
  });

  it("should fall back to original text on API failure", async () => {
    const { GeminiTranslator } = await import(
      "../src/adapters/translators/gemini-translator"
    );

    const translator = Object.create(GeminiTranslator.prototype);
    translator.genAI = {};
    translator.modelName = "test-model";

    translator.callGemini = vi.fn().mockRejectedValue(new Error("API error"));

    const result = await translator.translate("Hello world", "en", [
      "en",
      "ko",
      "ja",
    ]);

    expect(result.en).toBe("Hello world");
    expect(result.ko).toBe("Hello world"); // fallback
    expect(result.ja).toBe("Hello world"); // fallback
  });

  it("should batch translate with fallback on failure", async () => {
    const { GeminiTranslator } = await import(
      "../src/adapters/translators/gemini-translator"
    );

    const translator = Object.create(GeminiTranslator.prototype);
    translator.genAI = {};
    translator.modelName = "test-model";

    let callCount = 0;
    translator.callGemini = vi.fn().mockImplementation(
      (texts: string[], lang: string) => {
        callCount++;
        if (lang === "ko") {
          return Promise.resolve(texts.map((t: string) => `${t} (한국어)`));
        }
        return Promise.reject(new Error("JA translation failed"));
      },
    );

    const results = await translator.translateBatch(
      ["Text 1", "Text 2"],
      "en",
      ["en", "ko", "ja"],
    );

    expect(results).toHaveLength(2);
    expect(results[0].en).toBe("Text 1");
    expect(results[0].ko).toBe("Text 1 (한국어)");
    expect(results[0].ja).toBe("Text 1"); // fallback
    expect(results[1].ko).toBe("Text 2 (한국어)");
    expect(results[1].ja).toBe("Text 2"); // fallback
  });

  it("should return empty array for empty batch", async () => {
    const { GeminiTranslator } = await import(
      "../src/adapters/translators/gemini-translator"
    );

    const translator = Object.create(GeminiTranslator.prototype);
    translator.genAI = {};
    translator.modelName = "test-model";

    const results = await translator.translateBatch([], "en", ["ko", "ja"]);
    expect(results).toEqual([]);
  });
});
