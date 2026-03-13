import type { Language, TranslatedText } from "../../shared/types";
import type {
  AiAnalysis,
  BriefingReport,
  IssueCluster,
  SentimentResult,
  Summary,
} from "./entities";
import type { Article } from "../news/entities";

export interface TranslatorPort {
  translate(
    text: string,
    from: Language,
    to: Language[],
  ): Promise<TranslatedText>;

  translateBatch(
    texts: string[],
    from: Language,
    to: Language[],
  ): Promise<TranslatedText[]>;
}

export interface AnalyzerPort {
  summarize(text: string): Promise<Summary>;
  analyzeSentiment(text: string): Promise<SentimentResult>;
  generateBriefing(articles: Article[]): Promise<BriefingReport>;
  clusterIssues(articles: Article[]): Promise<IssueCluster[]>;
}

export interface AnalysisRepositoryPort {
  save(analysis: AiAnalysis): Promise<void>;
  findByTarget(targetType: string, targetId: string): Promise<AiAnalysis[]>;
  findLatestBriefing(lang: Language): Promise<AiAnalysis | null>;
}
