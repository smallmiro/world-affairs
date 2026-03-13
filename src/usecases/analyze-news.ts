import type { AnalyzerPort, AnalysisRepositoryPort } from "../domain/analysis/ports";
import type { NewsRepositoryPort } from "../domain/news/ports";
import type { AiAnalysis } from "../domain/analysis/entities";
import { randomUUID } from "crypto";

export interface AnalyzeNewsResult {
  summarized: number;
  sentimentAnalyzed: number;
}

export async function analyzeRecentNews(
  newsRepository: NewsRepositoryPort,
  analyzer: AnalyzerPort,
  analysisRepository: AnalysisRepositoryPort,
  limit = 20,
): Promise<AnalyzeNewsResult> {
  const articles = await newsRepository.findLatest(limit, "en");
  let summarized = 0;
  let sentimentAnalyzed = 0;

  for (const article of articles) {
    const text = `${article.title.en}. ${article.summary?.en ?? ""}`;

    // Check if already analyzed
    const existing = await analysisRepository.findByTarget("article", article.id);
    const hasSummary = existing.some((a) => a.type === "summary");
    const hasSentiment = existing.some((a) => a.type === "sentiment");

    if (!hasSummary) {
      try {
        const summary = await analyzer.summarize(text);
        const analysis: AiAnalysis = {
          id: randomUUID(),
          targetType: "article",
          targetId: article.id,
          type: "summary",
          result: { en: summary.text, ko: "", ja: "" },
          sentiment: null,
          sentimentLabel: null,
          model: summary.model,
          createdAt: new Date(),
        };
        await analysisRepository.save(analysis);
        summarized++;
      } catch (error) {
        console.warn(
          `Summary failed for article ${article.id}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    if (!hasSentiment) {
      try {
        const sentiment = await analyzer.analyzeSentiment(text);
        const analysis: AiAnalysis = {
          id: randomUUID(),
          targetType: "article",
          targetId: article.id,
          type: "sentiment",
          result: { en: sentiment.reasoning, ko: "", ja: "" },
          sentiment: sentiment.score,
          sentimentLabel: sentiment.label,
          model: "gemini-2.5-flash-lite",
          createdAt: new Date(),
        };
        await analysisRepository.save(analysis);
        sentimentAnalyzed++;
      } catch (error) {
        console.warn(
          `Sentiment analysis failed for article ${article.id}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  return { summarized, sentimentAnalyzed };
}

export async function generateDailyBriefing(
  newsRepository: NewsRepositoryPort,
  analyzer: AnalyzerPort,
  analysisRepository: AnalysisRepositoryPort,
): Promise<AiAnalysis> {
  const articles = await newsRepository.findLatest(50, "en");
  const briefing = await analyzer.generateBriefing(articles);

  const analysis: AiAnalysis = {
    id: randomUUID(),
    targetType: "daily_briefing",
    targetId: null,
    type: "briefing",
    result: { en: briefing.content, ko: "", ja: "" },
    sentiment: null,
    sentimentLabel: null,
    model: briefing.model,
    createdAt: new Date(),
  };

  await analysisRepository.save(analysis);
  return analysis;
}
