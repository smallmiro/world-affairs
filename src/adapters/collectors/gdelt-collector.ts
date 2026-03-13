import type { NewsCollectorPort } from "../../domain/news/ports";
import type { RawArticle } from "../../domain/news/entities";
import type { CollectionResult } from "../../shared/types";
import { classifyCategory, classifyRegionFromText, hashString } from "../../shared/classify";

const GDELT_API_URL = "https://api.gdeltproject.org/api/v2/doc/doc";

const GDELT_QUERY_PARAMS = {
  query: "(geopolitics OR conflict OR sanctions OR military OR diplomacy OR war OR nuclear OR missile) sourcelang:eng",
  mode: "artlist",
  format: "json",
  maxrecords: "50",
  sort: "datedesc",
};

interface GdeltArticle {
  url: string;
  url_mobile: string;
  title: string;
  seendate: string;
  socialimage: string;
  domain: string;
  language: string;
  sourcecountry: string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

function parseGdeltDate(seendate: string): Date {
  // GDELT format: "20240315T143000Z"
  const year = seendate.slice(0, 4);
  const month = seendate.slice(4, 6);
  const day = seendate.slice(6, 8);
  const hour = seendate.slice(9, 11);
  const min = seendate.slice(11, 13);
  const sec = seendate.slice(13, 15);
  return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`);
}

export class GdeltCollector implements NewsCollectorPort {
  async collect(): Promise<CollectionResult<RawArticle[]>> {
    const params = new URLSearchParams(GDELT_QUERY_PARAMS);
    const url = `${GDELT_API_URL}?${params.toString()}`;

    const response = await fetch(url);
    if (response.status === 429) {
      console.warn("[GDELT News] Rate limited (429). Returning empty result.");
      return { data: [], collectedAt: new Date(), source: "gdelt" };
    }
    if (!response.ok) {
      throw new Error(`GDELT API error: ${response.status} ${response.statusText}`);
    }

    const data: GdeltResponse = await response.json();
    const articles = data.articles ?? [];

    const rawArticles: RawArticle[] = articles.map((article) => {
      const text = `${article.title} ${article.domain}`;
      return {
        sourceId: hashString(article.url),
        source: "gdelt",
        url: article.url,
        title: article.title,
        summary: null,
        category: classifyCategory(text),
        region: classifyRegionFromText(text),
        imageUrl: article.socialimage || null,
        publishedAt: parseGdeltDate(article.seendate),
        originalLanguage: "en" as const,
      };
    });

    return {
      data: rawArticles,
      collectedAt: new Date(),
      source: "gdelt",
    };
  }
}
