import { describe, it, expect } from "vitest";
import {
  parseSentimentResponse,
  parseClustersResponse,
} from "../src/adapters/ai/gemini-analyzer";

describe("parseSentimentResponse", () => {
  it("should parse valid sentiment JSON", () => {
    const response = JSON.stringify({
      score: -0.7,
      label: "negative",
      reasoning: "Military escalation indicates negative outlook",
    });

    const result = parseSentimentResponse(response);
    expect(result.score).toBe(-0.7);
    expect(result.label).toBe("negative");
    expect(result.reasoning).toBe(
      "Military escalation indicates negative outlook",
    );
  });

  it("should extract JSON from surrounding text", () => {
    const response = `Here is the analysis:
{"score": 0.3, "label": "positive", "reasoning": "Trade agreement progress"}
Done.`;

    const result = parseSentimentResponse(response);
    expect(result.score).toBe(0.3);
    expect(result.label).toBe("positive");
  });

  it("should throw on missing JSON", () => {
    expect(() => parseSentimentResponse("No JSON here")).toThrow(
      "No JSON object found",
    );
  });

  it("should throw on invalid score range", () => {
    const response = JSON.stringify({
      score: 2.0,
      label: "positive",
      reasoning: "test",
    });
    expect(() => parseSentimentResponse(response)).toThrow(
      "Invalid sentiment score",
    );
  });

  it("should throw on invalid label", () => {
    const response = JSON.stringify({
      score: 0.5,
      label: "super_positive",
      reasoning: "test",
    });
    expect(() => parseSentimentResponse(response)).toThrow(
      "Invalid sentiment label",
    );
  });

  it("should accept all valid labels", () => {
    const labels = [
      "very_negative",
      "negative",
      "neutral",
      "positive",
      "very_positive",
    ];
    for (const label of labels) {
      const response = JSON.stringify({ score: 0, label, reasoning: "test" });
      const result = parseSentimentResponse(response);
      expect(result.label).toBe(label);
    }
  });
});

describe("parseClustersResponse", () => {
  it("should parse valid cluster JSON array", () => {
    const response = JSON.stringify([
      {
        label: "Ukraine Conflict",
        articleIds: ["a1", "a2"],
        summary: "Ongoing military operations",
      },
      {
        label: "Iran Nuclear",
        articleIds: ["a3"],
        summary: "Nuclear negotiations update",
      },
    ]);

    const result = parseClustersResponse(response);
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe("Ukraine Conflict");
    expect(result[0].articleIds).toEqual(["a1", "a2"]);
    expect(result[1].summary).toBe("Nuclear negotiations update");
  });

  it("should extract JSON array from surrounding text", () => {
    const response = `Here are the clusters:
[{"label": "Test", "articleIds": ["a1"], "summary": "test"}]
End.`;

    const result = parseClustersResponse(response);
    expect(result).toHaveLength(1);
  });

  it("should throw on missing JSON array", () => {
    expect(() => parseClustersResponse("No JSON here")).toThrow(
      "No JSON array found",
    );
  });

  it("should handle missing fields gracefully", () => {
    const response = JSON.stringify([{ label: "Test" }]);
    const result = parseClustersResponse(response);
    expect(result[0].articleIds).toEqual([]);
    expect(result[0].summary).toBe("");
  });
});
