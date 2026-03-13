import type {
  AnalysisType,
  SentimentLabel,
  TranslatedText,
} from "../../shared/types";

export interface AiAnalysis {
  id: string;
  targetType: string;
  targetId: string | null;
  type: AnalysisType;
  result: TranslatedText;
  sentiment: number | null;
  sentimentLabel: SentimentLabel | null;
  model: string;
  createdAt: Date;
}

export interface Summary {
  text: string;
  model: string;
}

export interface SentimentResult {
  score: number;
  label: SentimentLabel;
  reasoning: string;
}

export interface BriefingReport {
  date: Date;
  content: string;
  model: string;
}

export interface IssueCluster {
  label: string;
  articleIds: string[];
  summary: string;
}
