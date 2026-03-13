import type {
  Language,
  NewsCategory,
  Region,
  Severity,
  TranslatedText,
} from "../../shared/types";

export interface Article {
  id: string;
  sourceId: string;
  source: string;
  url: string;
  title: TranslatedText;
  summary: TranslatedText | null;
  category: NewsCategory;
  region: Region;
  severity: Severity;
  imageUrl: string | null;
  publishedAt: Date;
  collectedAt: Date;
}

export interface RawArticle {
  sourceId: string;
  source: string;
  url: string;
  title: string;
  summary: string | null;
  category: NewsCategory | null;
  region: Region | null;
  imageUrl: string | null;
  publishedAt: Date;
  originalLanguage: Language;
}
