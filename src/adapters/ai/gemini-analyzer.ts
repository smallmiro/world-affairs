import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AnalyzerPort } from "../../domain/analysis/ports";
import type {
  Summary,
  SentimentResult,
  BriefingReport,
  IssueCluster,
} from "../../domain/analysis/entities";
import type { Article } from "../../domain/news/entities";
import type { SentimentLabel } from "../../shared/types";

const VALID_LABELS = new Set<SentimentLabel>([
  "very_negative",
  "negative",
  "neutral",
  "positive",
  "very_positive",
]);

function parseSentimentResponse(responseText: string): SentimentResult {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in sentiment response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const score = Number(parsed.score);
  if (isNaN(score) || score < -1 || score > 1) {
    throw new Error(`Invalid sentiment score: ${parsed.score}`);
  }

  const label = String(parsed.label) as SentimentLabel;
  if (!VALID_LABELS.has(label)) {
    throw new Error(`Invalid sentiment label: ${parsed.label}`);
  }

  return {
    score,
    label,
    reasoning: String(parsed.reasoning ?? ""),
  };
}

function parseClustersResponse(responseText: string): IssueCluster[] {
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("No JSON array found in cluster response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed)) {
    throw new Error("Expected JSON array for clusters");
  }

  return parsed.map((c: Record<string, unknown>) => ({
    label: String(c.label ?? ""),
    articleIds: Array.isArray(c.articleIds)
      ? c.articleIds.map(String)
      : [],
    summary: String(c.summary ?? ""),
  }));
}

export class GeminiAnalyzer implements AnalyzerPort {
  private genAI: GoogleGenerativeAI;
  private liteModel: string;
  private flashModel: string;

  constructor(apiKey?: string, liteModel?: string, flashModel?: string) {
    const key = apiKey ?? process.env.GEMINI_API_KEY ?? "";
    if (!key) {
      throw new Error("GEMINI_API_KEY is required");
    }
    this.genAI = new GoogleGenerativeAI(key);
    this.liteModel = liteModel ?? "gemini-2.5-flash-lite";
    this.flashModel = flashModel ?? "gemini-2.5-flash";
  }

  async summarize(text: string): Promise<Summary> {
    const model = this.genAI.getGenerativeModel({ model: this.liteModel });
    const prompt = `Summarize the following geopolitical news in 2-3 concise sentences. Focus on key facts, actors, and implications.

Text: ${text}`;

    const result = await model.generateContent(prompt);
    return {
      text: result.response.text().trim(),
      model: this.liteModel,
    };
  }

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const model = this.genAI.getGenerativeModel({ model: this.liteModel });
    const prompt = `Analyze the sentiment of this geopolitical news article.
Return a JSON object:
{
  "score": <float -1.0 to 1.0>,
  "label": "very_negative|negative|neutral|positive|very_positive",
  "reasoning": "<1 sentence explanation>"
}

Text: ${text}`;

    const result = await model.generateContent(prompt);
    return parseSentimentResponse(result.response.text());
  }

  async generateBriefing(articles: Article[]): Promise<BriefingReport> {
    const model = this.genAI.getGenerativeModel({ model: this.flashModel });
    const articleList = articles
      .map(
        (a, i) =>
          `${i + 1}. [${a.category}/${a.region}] ${a.title.en}${a.summary?.en ? ` — ${a.summary.en}` : ""}`,
      )
      .join("\n");

    const prompt = `You are a geopolitical analyst. Generate a daily briefing report based on the following news articles.

Structure:
## Daily Geopolitical Briefing

### Key Summary
(3-5 bullet points of the most critical developments)

### Regional Analysis
(Group by region, highlight tensions and trends)

### Risk Assessment
(Identify emerging risks and escalation patterns)

### Outlook
(Brief forward-looking analysis)

Articles:
${articleList}`;

    const result = await model.generateContent(prompt);
    return {
      date: new Date(),
      content: result.response.text().trim(),
      model: this.flashModel,
    };
  }

  async clusterIssues(articles: Article[]): Promise<IssueCluster[]> {
    const model = this.genAI.getGenerativeModel({ model: this.flashModel });
    const articleList = articles
      .map(
        (a) =>
          `- id:"${a.id}" title:"${a.title.en}" category:${a.category} region:${a.region}`,
      )
      .join("\n");

    const prompt = `Group the following news articles into thematic clusters. Each cluster should represent a distinct geopolitical issue or event.

Return a JSON array:
[
  {
    "label": "<short cluster label>",
    "articleIds": ["<article id>", ...],
    "summary": "<1-2 sentence summary of this issue>"
  }
]

Articles:
${articleList}`;

    const result = await model.generateContent(prompt);
    return parseClustersResponse(result.response.text());
  }
}

// Exported for testing
export { parseSentimentResponse, parseClustersResponse };
