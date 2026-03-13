import type { CollectionResult, Language, NewsCategory, Region } from "../../shared/types";
import type { Article, RawArticle } from "./entities";

export interface NewsCollectorPort {
  collect(): Promise<CollectionResult<RawArticle[]>>;
}

export interface NewsRepositoryPort {
  save(articles: Article[]): Promise<void>;
  findLatest(limit: number, lang: Language): Promise<Article[]>;
  findByRegion(region: Region, lang: Language, limit: number): Promise<Article[]>;
  findByCategory(category: NewsCategory, lang: Language, limit: number): Promise<Article[]>;
  existsBySourceId(sourceId: string, source: string): Promise<boolean>;
}
